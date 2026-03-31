"""Views for simulation app."""
from datetime import datetime
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models import SimulationScenario, SimulationResult, SimulationAuditLog
from ..simulation_engine import estimate_mm_c, simulate_replication
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

        metrics_list = []
        for rep in range(num_replications):
            rep_params = dict(params)
            # Different seed per replication if provided
            if rep_params.get('seed') is not None:
                try:
                    rep_params['seed'] = int(rep_params['seed']) + rep
                except (ValueError, TypeError):
                    rep_params['seed'] = None
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
            return sum(m[key] for m in metrics_list) / len(metrics_list)

        aggregated = {
            'avg_queue_length': avg('avg_queue_length'),
            'avg_waiting_time': avg('avg_waiting_time'),
            'avg_system_time': avg('avg_system_time'),
            'server_utilization': avg('server_utilization'),
            'max_queue_length': max(m['max_queue_length'] for m in metrics_list),
            'served_count_avg': avg('served_count'),
            'num_replications': num_replications
        }

        result = SimulationResult.objects.create(
            scenario=scenario,
            metrics=aggregated,
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
