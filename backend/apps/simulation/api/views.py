"""Views for simulation app."""
from datetime import datetime
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models import SimulationScenario, SimulationResult, SimulationAuditLog
from ..simulation_engine import (
    estimate_mm_c, 
    simulate_replication,
    run_shortage_analysis,
    run_comparative_scenarios,
)
from ..simulation_categories import get_simulator
from ..decision_support import build_decision_support_payload
from .payload_mappers import (
    serialize_backup_result,
    serialize_backup_scenario,
    serialize_history_run,
)
from .serializers import (
    SimulationScenarioSerializer,
    SimulationResultSerializer,
    SimulationAuditLogSerializer,
)
from .query_filters import build_result_category_filter, build_scenario_filter
from .snapshot_service import build_system_snapshot_payload


class SimulationViewSet(viewsets.ModelViewSet):
    """ViewSet for Simulation management."""
    
    serializer_class = SimulationScenarioSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['created_at']
    ordering_fields = ['created_at', 'name']

    HISTORY_RETENTION_PER_CATEGORY = 10
    AUDIT_LOG_RETENTION_COUNT = 500
    
    def get_queryset(self):
        """Get all simulations."""
        return SimulationScenario.objects.all()

    def _parse_int_query_param(self, request, name, default, *, min_value=1, max_value=500):
        """Parse and clamp integer query params, returning (value, error_response)."""
        raw_value = request.query_params.get(name, default)
        try:
            value = int(raw_value)
        except (TypeError, ValueError):
            return None, Response({'error': f'{name} must be an integer'}, status=status.HTTP_400_BAD_REQUEST)

        return max(min_value, min(value, max_value)), None
    
    def _avg_hour_metric(self, metrics_list, hour_idx, metric_key):
        """Average a metric across all replications for a specific hour."""
        values = []
        for m in metrics_list:
            if 'time_slot_breakdown' in m and hour_idx < len(m['time_slot_breakdown']):
                hour_data = m['time_slot_breakdown'][hour_idx]
                if metric_key in hour_data:
                    values.append(hour_data[metric_key])
        return sum(values) / len(values) if values else 0.0

    @action(detail=False, methods=['get'])
    def system_snapshot(self, request):
        """Return current rooms, equipment, and booking summary for simulation setup."""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        payload = build_system_snapshot_payload(start_date=start_date, end_date=end_date)
        return Response(payload)

    def _log_audit(self, request, action, message, *, level='info', scenario=None, result=None, metadata=None):
        try:
            SimulationAuditLog.objects.create(
                action=action,
                level=level,
                message=message,
                metadata=metadata or {},
                user=request.user if getattr(request, 'user', None) and request.user.is_authenticated else None,
                scenario=scenario,
                result=result,
            )
            self._prune_audit_logs()
        except Exception:
            # Audit logging failures must not break simulation flows.
            pass

    def _prune_audit_logs(self):
        """Keep only the most recent N audit log rows globally."""
        stale_ids = list(
            SimulationAuditLog.objects.order_by('-created_at', '-id')
            .values_list('id', flat=True)[self.AUDIT_LOG_RETENTION_COUNT:]
        )
        if stale_ids:
            SimulationAuditLog.objects.filter(id__in=stale_ids).delete()

    def _prune_history_for_category(self, simulation_type):
        """Keep only the most recent N runs per simulation category."""
        if not simulation_type:
            return

        category_runs = SimulationResult.objects.filter(
            build_result_category_filter(simulation_type, include_legacy=True)
        ).order_by('-run_date', '-id')

        stale_run_ids = list(
            category_runs.values_list('id', flat=True)[self.HISTORY_RETENTION_PER_CATEGORY:]
        )
        if stale_run_ids:
            SimulationResult.objects.filter(id__in=stale_run_ids).delete()

    def _resolve_result_for_detail_actions(self, request, scenario):
        """Resolve target result by query param result_id or latest scenario result."""
        result_id = request.query_params.get('result_id')
        queryset = scenario.simulationresult_set.all().order_by('-run_date', '-id')

        if result_id:
            try:
                return queryset.get(id=int(result_id))
            except (TypeError, ValueError, SimulationResult.DoesNotExist):
                return None

        return queryset.first()
    
    @action(detail=True, methods=['post'])
    def run(self, request, pk=None):
        """Run the simulation and generate results."""
        scenario = self.get_object()

        params = scenario.parameters or {}
        run_mode = request.data.get('mode', 'simulate')
        num_replications = request.data.get('num_replications') or scenario.num_replications or 1000

        try:
            num_replications = int(num_replications)
        except (ValueError, TypeError):
            self._log_audit(
                request,
                action='run_failed',
                level='error',
                scenario=scenario,
                message='Simulation run rejected due to invalid num_replications',
                metadata={'num_replications': request.data.get('num_replications')},
            )
            return Response({'error': 'num_replications must be an integer'}, status=status.HTTP_400_BAD_REQUEST)

        if num_replications < 100:
            num_replications = 100

        self._log_audit(
            request,
            action='run_started',
            scenario=scenario,
            message='Simulation run started',
            metadata={'mode': run_mode, 'num_replications': num_replications},
        )

        if run_mode == 'estimate':
            try:
                aggregated = estimate_mm_c(params)
            except ValueError as exc:
                self._log_audit(
                    request,
                    action='run_failed',
                    level='error',
                    scenario=scenario,
                    message='Simulation estimate failed',
                    metadata={'error': str(exc), 'mode': run_mode},
                )
                return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
            aggregated['num_replications'] = 0
            result = SimulationResult.objects.create(
                scenario=scenario,
                metrics=aggregated,
                raw_data={'mode': 'estimate'}
            )
            self._log_audit(
                request,
                action='run_succeeded',
                scenario=scenario,
                result=result,
                message='Simulation estimate completed successfully',
                metadata={'mode': run_mode},
            )
            self._prune_history_for_category(params.get('simulation_type'))
            return Response(
                SimulationResultSerializer(result).data,
                status=status.HTTP_201_CREATED
            )

        # Check if we should use category-specific simulator
        simulation_type = str(params.get('simulation_type', 'general')).replace('-', '_')
        use_category_simulator = simulation_type in ['room_usage', 'equipment_usage', 'peak_hour', 'shortage', 'what_if']
        
        if use_category_simulator:
            try:
                # Use category-specific simulator
                simulator_kwargs = {}
                if simulation_type == 'what_if':
                    multipliers = request.data.get('multipliers', [0.75, 1.0, 1.25])
                    try:
                        multipliers = [float(m) for m in multipliers if m]
                    except (ValueError, TypeError):
                        multipliers = [0.75, 1.0, 1.25]
                    simulator_kwargs['multipliers'] = multipliers
                
                simulator = get_simulator(
                    simulation_type, 
                    params, 
                    num_replications=num_replications,
                    **simulator_kwargs
                )
                simulator_results = simulator.run()
                
                aggregated = simulator_results['standard_metrics']
                category_metrics = simulator_results['category_metrics'] or {}
                aggregated['num_replications'] = num_replications

                decision_support = build_decision_support_payload(
                    simulation_type,
                    aggregated,
                    category_metrics,
                )
                category_metrics['decision_support'] = decision_support
                if not category_metrics.get('recommendations'):
                    category_metrics['recommendations'] = decision_support.get('recommendations', [])
                
                result = SimulationResult.objects.create(
                    scenario=scenario,
                    metrics=aggregated,
                    category_metrics=category_metrics if category_metrics else None,
                    raw_data={'simulation_type': simulation_type, 'category_simulator': True}
                )
            except Exception as exc:
                self._log_audit(
                    request,
                    action='run_failed',
                    level='error',
                    scenario=scenario,
                    message=f'Category-specific simulation failed: {simulation_type}',
                    metadata={'error': str(exc), 'simulation_type': simulation_type},
                )
                return Response({'error': f'Simulation failed: {str(exc)}'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Use standard simulation path
            metrics_list = []
            for rep in range(num_replications):
                rep_params = dict(params)
                # Different seed per replication if provided
                if rep_params.get('seed') is not None:
                    try:
                        rep_params['seed'] = int(rep_params['seed']) + rep
                    except (ValueError, TypeError):
                        rep_params['seed'] = None
                
                # Enable time-slot tracking
                rep_params['track_time_slots'] = True
                
                try:
                    metrics_list.append(simulate_replication(rep_params))
                except ValueError as exc:
                    self._log_audit(
                        request,
                        action='run_failed',
                        level='error',
                        scenario=scenario,
                        message='Simulation run failed while computing replications',
                        metadata={'error': str(exc), 'mode': run_mode},
                    )
                    return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

            # Aggregate metrics
            def avg(key):
                values = [m[key] for m in metrics_list if key in m]
                return sum(values) / len(values) if values else 0.0

            aggregated = {
                'avg_queue_length': avg('avg_queue_length'),
                'avg_waiting_time': avg('avg_waiting_time'),
                'avg_system_time': avg('avg_system_time'),
                'server_utilization': avg('server_utilization'),
                'max_queue_length': max((m.get('max_queue_length', 0) for m in metrics_list), default=0),
                'served_count_avg': avg('served_count'),
                'num_replications': num_replications
            }
            
            # Add shortage metrics if any replication tracked them
            if any('rejected_count' in m for m in metrics_list):
                aggregated['rejected_count'] = sum(m.get('rejected_count', 0) for m in metrics_list)
                aggregated['unmet_demand_percentage'] = avg('unmet_demand_percentage')
            
            category_metrics = {}
            decision_support = build_decision_support_payload(
                simulation_type,
                aggregated,
                category_metrics,
            )
            category_metrics['decision_support'] = decision_support
            category_metrics['recommendations'] = decision_support.get('recommendations', [])
            result = SimulationResult.objects.create(
                scenario=scenario,
                metrics=aggregated,
                category_metrics=category_metrics if category_metrics else None,
                raw_data={'replications': metrics_list[:100]}
            )
        self._log_audit(
            request,
            action='run_succeeded',
            scenario=scenario,
            result=result,
            message='Simulation run completed successfully',
            metadata={'mode': run_mode, 'num_replications': num_replications},
        )
        self._prune_history_for_category(params.get('simulation_type'))
        
        return Response(
            SimulationResultSerializer(result).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        """Get all results for a simulation scenario."""
        scenario = self.get_object()
        results = scenario.simulationresult_set.all()
        serializer = SimulationResultSerializer(results, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='time-slot-breakdown')
    def time_slot_breakdown(self, request, pk=None):
        """Return time-slot series for the selected or latest simulation result."""
        scenario = self.get_object()
        result = self._resolve_result_for_detail_actions(request, scenario)
        if not result:
            return Response({'error': 'No simulation result found for this scenario'}, status=status.HTTP_404_NOT_FOUND)

        category_metrics = result.category_metrics or {}
        metrics = result.metrics or {}

        if category_metrics.get('room_utilization_by_hour'):
            payload = category_metrics['room_utilization_by_hour']
            source = 'room_utilization_by_hour'
        elif category_metrics.get('peak_hours_analysis'):
            payload = category_metrics['peak_hours_analysis']
            source = 'peak_hours_analysis'
        elif metrics.get('time_slot_breakdown'):
            payload = metrics['time_slot_breakdown']
            source = 'metrics.time_slot_breakdown'
        else:
            payload = []
            source = 'none'

        return Response({
            'scenario_id': scenario.id,
            'result_id': result.id,
            'source': source,
            'time_slots': payload,
        })

    @action(detail=True, methods=['get'], url_path='recommendations')
    def recommendations(self, request, pk=None):
        """Return decision-support recommendations for selected/latest simulation result."""
        scenario = self.get_object()
        result = self._resolve_result_for_detail_actions(request, scenario)
        if not result:
            return Response({'error': 'No simulation result found for this scenario'}, status=status.HTTP_404_NOT_FOUND)

        category_metrics = result.category_metrics or {}
        decision_support = category_metrics.get('decision_support') or {}
        recommendations = category_metrics.get('recommendations') or decision_support.get('recommendations') or []

        return Response({
            'scenario_id': scenario.id,
            'result_id': result.id,
            'health_score': decision_support.get('health_score'),
            'priority': decision_support.get('priority'),
            'recommendations': recommendations,
        })

    @action(detail=True, methods=['get'], url_path='shortage-breakdown')
    def shortage_breakdown(self, request, pk=None):
        """Return shortage comparison payload for selected/latest simulation result."""
        scenario = self.get_object()
        result = self._resolve_result_for_detail_actions(request, scenario)
        if not result:
            return Response({'error': 'No simulation result found for this scenario'}, status=status.HTTP_404_NOT_FOUND)

        category_metrics = result.category_metrics or {}
        scenario_comparison = category_metrics.get('scenario_comparison') or {}
        shortage_impact = category_metrics.get('shortage_impact') or {}
        recommendations = category_metrics.get('recommendations') or []

        return Response({
            'scenario_id': scenario.id,
            'result_id': result.id,
            'scenario_comparison': scenario_comparison,
            'shortage_impact': shortage_impact,
            'recommendations': recommendations,
        })
    
    @action(detail=False, methods=['post'])
    def batch_compare(self, request):
        """Run multiple what-if scenarios in a batch and return all results for comparison."""
        scenario_id = request.data.get('scenario_id')
        multipliers = request.data.get('multipliers', [0.5, 0.75, 1.0, 1.25, 1.5])
        num_replications = request.data.get('num_replications', 100)
        
        if not scenario_id:
            return Response({'error': 'scenario_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            scenario = SimulationScenario.objects.get(id=scenario_id)
        except SimulationScenario.DoesNotExist:
            return Response({'error': 'Scenario not found'}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            multipliers = [float(m) for m in multipliers if m]
            num_replications = int(num_replications)
        except (ValueError, TypeError):
            return Response({'error': 'Invalid multipliers or num_replications'}, status=status.HTTP_400_BAD_REQUEST)
        
        if num_replications < 50:
            num_replications = 50
        
        self._log_audit(
            request,
            action='run_started',
            scenario=scenario,
            message='Batch comparison started',
            metadata={'multipliers': multipliers, 'num_replications': num_replications},
        )
        
        params = scenario.parameters or {}
        batch_results = run_comparative_scenarios(params, multipliers, num_replications=num_replications)
        
        # Store batch results
        batch_data = {
            'batch_multipliers': multipliers,
            'batch_scenario_id': scenario_id,
            'results_per_multiplier': {},
        }
        
        result_ids = []
        for multiplier_key, scenario_result in batch_results.items():
            multiplier_value = scenario_result.get('multiplier')
            
            # Create individual result for each scenario
            result = SimulationResult.objects.create(
                scenario=scenario,
                metrics=scenario_result.get('metrics', {}),
                raw_data={'batch_mode': True, 'multiplier': multiplier_value},
            )
            result_ids.append(result.id)
            batch_data['results_per_multiplier'][multiplier_key] = result.id
        
        # Create summary result with batch metadata
        summary_result = SimulationResult.objects.create(
            scenario=scenario,
            metrics={},
            category_metrics={
                'batch_comparison': batch_data,
                'scenario_results': batch_results,
            },
            raw_data={'batch_mode': True, 'is_summary': True},
        )
        
        self._log_audit(
            request,
            action='run_succeeded',
            scenario=scenario,
            result=summary_result,
            message='Batch comparison completed successfully',
            metadata={'multipliers': multipliers, 'num_results': len(result_ids)},
        )
        
        return Response({
            'summary_result_id': summary_result.id,
            'individual_result_ids': result_ids,
            'multipliers': multipliers,
            'batch_data': batch_data,
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def history(self, request):
        """Get recent simulation runs across scenarios."""
        limit, error = self._parse_int_query_param(request, 'limit', 50, min_value=1, max_value=200)
        if error:
            return error

        simulation_type = request.query_params.get('simulation_type')
        if simulation_type:
            self._prune_history_for_category(simulation_type)

        runs = SimulationResult.objects.select_related('scenario')
        if simulation_type:
            runs = runs.filter(build_result_category_filter(simulation_type, include_legacy=True))
        runs = runs.order_by('-run_date', '-id')[:limit]

        payload = [serialize_history_run(run) for run in runs]
        return Response(payload)

    @action(detail=False, methods=['get'])
    def audit_logs(self, request):
        """List recent simulation audit logs."""
        limit, error = self._parse_int_query_param(request, 'limit', 100, min_value=1, max_value=500)
        if error:
            return error

        simulation_type = request.query_params.get('simulation_type')

        queryset = SimulationAuditLog.objects.select_related('scenario', 'result').all()
        if simulation_type:
            queryset = queryset.filter(
                build_result_category_filter(simulation_type, include_legacy=True)
                | Q(metadata__simulation_type=simulation_type)
            )
        queryset = queryset[:limit]
        serializer = SimulationAuditLogSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def backup(self, request):
        """Export simulation scenarios/results as a JSON backup payload."""
        include_raw = str(request.query_params.get('include_raw', '0')).lower() in {'1', 'true', 'yes'}
        simulation_type = request.query_params.get('simulation_type')
        audit_limit, error = self._parse_int_query_param(
            request,
            'audit_limit',
            5,
            min_value=1,
            max_value=500,
        )
        if error:
            return error

        scenario_qs = SimulationScenario.objects.order_by('-created_at')
        if simulation_type:
            scenario_qs = scenario_qs.filter(build_scenario_filter(simulation_type, include_legacy=True))
        scenarios = [serialize_backup_scenario(scenario) for scenario in scenario_qs]

        result_qs = SimulationResult.objects.select_related('scenario').order_by('-run_date')
        if simulation_type:
            result_qs = result_qs.filter(build_result_category_filter(simulation_type, include_legacy=True))
        results = [serialize_backup_result(result, include_raw) for result in result_qs]

        logs = SimulationAuditLog.objects.order_by('-created_at')
        if simulation_type:
            logs = logs.filter(
                build_result_category_filter(simulation_type, include_legacy=True)
                | Q(metadata__simulation_type=simulation_type)
            )
        logs = logs[:audit_limit]
        audit_logs = SimulationAuditLogSerializer(logs, many=True).data

        self._log_audit(
            request,
            action='backup_exported',
            message='Simulation backup exported',
            metadata={
                'include_raw': include_raw,
                'simulation_type': simulation_type,
                'scenario_count': len(scenarios),
                'result_count': len(results),
                'audit_limit': audit_limit,
            },
        )

        return Response({
            'exported_at': datetime.utcnow().isoformat() + 'Z',
            'include_raw': include_raw,
            'simulation_type': simulation_type,
            'scenarios': scenarios,
            'results': results,
            'audit_logs': audit_logs,
        })
