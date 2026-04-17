"""
Category-specific simulation handlers for different simulation types.

Each category provides specialized metrics collection and analysis tailored to:
- Room usage patterns
- Equipment availability
- Peak hour stress testing
- Shortage impact analysis
- What-if scenario comparisons
"""

from .simulation_engine import (
    simulate_replication,
    run_shortage_analysis,
    run_comparative_scenarios,
    _aggregate_metrics,
)


class SimulationCategoryBase:
    """Base class for category-specific simulators."""
    
    CATEGORY_NAME = 'base'
    DESCRIPTION = 'Base simulation category'
    
    def __init__(self, params, num_replications=100):
        """Initialize simulator with parameters and number of replications.
        
        Args:
            params: Dict of simulation parameters (arrival_rate, service_rate, etc.)
            num_replications: Number of replications to run
        """
        self.params = params
        self.num_replications = num_replications
        self.results = None
        self.category_metrics = {}
    
    def run(self):
        """Run the simulation and collect category-specific metrics."""
        raise NotImplementedError("Subclasses must implement run()")
    
    def get_results(self):
        """Return aggregated results with category-specific metrics."""
        return {
            'standard_metrics': self.results,
            'category_metrics': self.category_metrics,
        }


class RoomUsageSimulator(SimulationCategoryBase):
    """Simulate room usage patterns and occupancy trends."""
    
    CATEGORY_NAME = 'room_usage'
    DESCRIPTION = 'Room usage patterns and occupancy analysis'
    
    def run(self):
        """Run room usage simulation."""
        # Enable time-slot tracking
        params = dict(self.params)
        params['track_time_slots'] = True
        
        metrics_list = []
        for _ in range(self.num_replications):
            metrics_list.append(simulate_replication(params))
        
        # Aggregate standard metrics
        self.results = self._aggregate_standard_metrics(metrics_list)
        
        # Collect room usage specific metrics
        self.category_metrics = self._extract_room_usage_metrics(metrics_list)
        
        return self.get_results()
    
    def _aggregate_standard_metrics(self, metrics_list):
        """Aggregate standard metrics."""
        return _aggregate_metrics(metrics_list)
    
    def _extract_room_usage_metrics(self, metrics_list):
        """Extract room-specific usage patterns."""
        if not metrics_list or not metrics_list[0].get('time_slot_breakdown'):
            return {}
        
        time_slots = []
        for hour_idx in range(len(metrics_list[0]['time_slot_breakdown'])):
            hour_metrics = [m['time_slot_breakdown'][hour_idx] for m in metrics_list 
                          if hour_idx < len(m.get('time_slot_breakdown', []))]
            
            if hour_metrics:
                avg_occupancy = sum(h.get('served', 0) for h in hour_metrics) / len(hour_metrics)
                utilization_rate = (avg_occupancy / self.params.get('num_servers', 1)) * 100
                
                time_slots.append({
                    'hour': hour_idx,
                    'occupancy_rate': utilization_rate,
                    'avg_room_usage': avg_occupancy,
                    'peak_demand': max(h.get('arrivals', 0) for h in hour_metrics),
                })
        
        return {
            'room_utilization_by_hour': time_slots,
            'peak_utilization_hour': max(time_slots, key=lambda x: x['occupancy_rate']) if time_slots else None,
            'avg_daily_utilization': sum(s['occupancy_rate'] for s in time_slots) / len(time_slots) if time_slots else 0,
        }


class EquipmentUsageSimulator(SimulationCategoryBase):
    """Simulate equipment availability and usage patterns."""
    
    CATEGORY_NAME = 'equipment_usage'
    DESCRIPTION = 'Equipment availability and queue dynamics'
    
    def run(self):
        """Run equipment usage simulation."""
        params = dict(self.params)
        params['track_time_slots'] = True
        
        metrics_list = []
        for _ in range(self.num_replications):
            metrics_list.append(simulate_replication(params))
        
        self.results = self._aggregate_standard_metrics(metrics_list)
        self.category_metrics = self._extract_equipment_metrics(metrics_list)
        
        return self.get_results()
    
    def _aggregate_standard_metrics(self, metrics_list):
        """Aggregate standard metrics."""
        return _aggregate_metrics(metrics_list)
    
    def _extract_equipment_metrics(self, metrics_list):
        """Extract equipment-specific metrics."""
        equipment_stats = {
            'avg_equipment_utilization': sum(m.get('server_utilization', 0) for m in metrics_list) / len(metrics_list),
            'equipment_downtime_percentage': 100 - (sum(m.get('server_utilization', 0) for m in metrics_list) / len(metrics_list) * 100),
            'avg_waiting_for_equipment': sum(m.get('avg_waiting_time', 0) for m in metrics_list) / len(metrics_list),
            'equipment_queue_statistics': {
                'avg_queue_length': sum(m.get('avg_queue_length', 0) for m in metrics_list) / len(metrics_list),
                'max_queue_observed': max(m.get('max_queue_length', 0) for m in metrics_list),
            }
        }
        
        return equipment_stats


class PeakHourSimulator(SimulationCategoryBase):
    """Simulate peak hour scenarios with stress testing."""
    
    CATEGORY_NAME = 'peak_hour'
    DESCRIPTION = 'Peak hour stress testing and bottleneck analysis'
    
    def run(self):
        """Run peak hour simulation with 1.7x demand multiplier."""
        # Apply peak hour multiplier (1.7x demand)
        params = dict(self.params)
        params['arrival_rate'] = params.get('arrival_rate', 1.0) * 1.7
        params['track_time_slots'] = True
        
        metrics_list = []
        for _ in range(self.num_replications):
            metrics_list.append(simulate_replication(params))
        
        self.results = self._aggregate_standard_metrics(metrics_list)
        self.category_metrics = self._extract_peak_hour_metrics(metrics_list)
        
        return self.get_results()
    
    def _aggregate_standard_metrics(self, metrics_list):
        """Aggregate standard metrics."""
        return _aggregate_metrics(metrics_list)
    
    def _extract_peak_hour_metrics(self, metrics_list):
        """Extract peak hour analysis."""
        if not metrics_list or not metrics_list[0].get('time_slot_breakdown'):
            return {}
        
        time_slots = []
        max_wait_time = 0
        max_wait_hour = 0
        
        for hour_idx in range(len(metrics_list[0]['time_slot_breakdown'])):
            hour_metrics = [m['time_slot_breakdown'][hour_idx] for m in metrics_list 
                          if hour_idx < len(m.get('time_slot_breakdown', []))]
            
            if hour_metrics:
                avg_wait = sum(h.get('avg_wait_time', 0) for h in hour_metrics) / len(hour_metrics)
                max_queue = max(h.get('max_queue_length', 0) for h in hour_metrics)
                arrivals = sum(h.get('arrivals', 0) for h in hour_metrics) / len(hour_metrics)
                
                if avg_wait > max_wait_time:
                    max_wait_time = avg_wait
                    max_wait_hour = hour_idx
                
                time_slots.append({
                    'hour': hour_idx,
                    'avg_wait_time': avg_wait,
                    'max_queue_length': max_queue,
                    'avg_arrivals': arrivals,
                    'stress_level': 'high' if avg_wait > 5 else 'medium' if avg_wait > 2 else 'low',
                })
        
        return {
            'peak_hours_analysis': time_slots,
            'peak_stress_hour': max_wait_hour,
            'peak_stress_value': max_wait_time,
            'demand_multiplier': 1.7,
            'system_stress_level': 'critical' if max_wait_time > 10 else 'high' if max_wait_time > 5 else 'moderate',
        }


class ShortageSimulator(SimulationCategoryBase):
    """Analyze impact of resource shortages."""
    
    CATEGORY_NAME = 'shortage'
    DESCRIPTION = 'Shortage scenarios: room, equipment, and combined impact analysis'
    
    def run(self):
        """Run shortage analysis."""
        shortage_results = run_shortage_analysis(self.params, num_replications=self.num_replications)
        
        # Use normal scenario results as standard metrics
        self.results = shortage_results['normal']
        
        # Collect all shortage analysis data
        self.category_metrics = {
            'shortage_impact': shortage_results['impact'],
            'scenario_comparison': {
                'normal': self._summarize_scenario(shortage_results['normal']),
                'room_shortage': self._summarize_scenario(shortage_results['room_shortage']),
                'equipment_shortage': self._summarize_scenario(shortage_results['equipment_shortage']),
                'combined': self._summarize_scenario(shortage_results['combined']),
            },
            'recommendations': self._generate_shortage_recommendations(shortage_results),
        }
        
        return self.get_results()
    
    def _summarize_scenario(self, scenario_metrics):
        """Create summary of a shortage scenario."""
        return {
            'avg_waiting_time': scenario_metrics.get('avg_waiting_time', 0),
            'avg_queue_length': scenario_metrics.get('avg_queue_length', 0),
            'server_utilization': scenario_metrics.get('server_utilization', 0),
            'rejected_count': scenario_metrics.get('rejected_count', 0),
        }
    
    def _generate_shortage_recommendations(self, shortage_results):
        """Generate recommendations based on shortage impact."""
        impact = shortage_results['impact']
        recommendations = []
        
        room_impact = impact.get('room_shortage_impact', {})
        if room_impact.get('wait_time_increase_pct', 0) > 100:
            recommendations.append({
                'type': 'room_shortage',
                'severity': 'high',
                'message': f"Room shortages increase wait times by {room_impact.get('wait_time_increase_pct', 0):.0f}%",
                'action': 'Increase number of available rooms',
            })
        
        equip_impact = impact.get('equipment_shortage_impact', {})
        if equip_impact.get('wait_time_increase_pct', 0) > 100:
            recommendations.append({
                'type': 'equipment_shortage',
                'severity': 'high',
                'message': f"Equipment shortages increase wait times by {equip_impact.get('wait_time_increase_pct', 0):.0f}%",
                'action': 'Increase equipment availability',
            })
        
        combined_impact = impact.get('combined_impact', {})
        if combined_impact.get('wait_time_increase_pct', 0) > 200:
            recommendations.append({
                'type': 'combined_shortage',
                'severity': 'critical',
                'message': 'Combined shortage creates critical system stress',
                'action': 'Address both room and equipment constraints immediately',
            })
        
        return recommendations


class WhatIfSimulator(SimulationCategoryBase):
    """Perform what-if scenario comparisons."""
    
    CATEGORY_NAME = 'what_if'
    DESCRIPTION = 'What-if analysis: comparing multiple scenarios'
    
    def __init__(self, params, num_replications=100, multipliers=None):
        """Initialize with optional multipliers for what-if analysis.
        
        Args:
            params: Base simulation parameters
            num_replications: Number of replications per scenario
            multipliers: List of demand multipliers to test (e.g., [0.75, 1.0, 1.25])
        """
        super().__init__(params, num_replications)
        self.multipliers = multipliers or [0.75, 1.0, 1.25]
    
    def run(self):
        """Run what-if comparisons."""
        whatif_results = run_comparative_scenarios(
            self.params,
            self.multipliers,
            num_replications=self.num_replications
        )
        
        # Use baseline (1.0x) results as standard metrics
        baseline_key = 'multiplier_1.0'
        if baseline_key in whatif_results:
            self.results = whatif_results[baseline_key]['metrics']
        
        # Collect what-if specific metrics
        self.category_metrics = self._extract_whatif_metrics(whatif_results)
        
        return self.get_results()
    
    def _extract_whatif_metrics(self, whatif_results):
        """Extract what-if comparison metrics."""
        scenarios = []
        best_scenario = None
        worst_scenario = None
        
        for scenario_key, scenario_data in whatif_results.items():
            multiplier = scenario_data['multiplier']
            metrics = scenario_data['metrics']
            
            scenario_info = {
                'multiplier': multiplier,
                'demand_label': f'{multiplier:.0%} Demand',
                'avg_wait_time': metrics.get('avg_waiting_time', 0),
                'avg_queue_length': metrics.get('avg_queue_length', 0),
                'utilization': metrics.get('server_utilization', 0),
            }
            scenarios.append(scenario_info)
            
            if best_scenario is None or metrics.get('avg_waiting_time', 0) < best_scenario['avg_wait_time']:
                best_scenario = scenario_info.copy()
            
            if worst_scenario is None or metrics.get('avg_waiting_time', 0) > worst_scenario['avg_wait_time']:
                worst_scenario = scenario_info.copy()
        
        return {
            'scenario_comparisons': sorted(scenarios, key=lambda x: x['multiplier']),
            'best_performer': best_scenario,
            'worst_performer': worst_scenario,
            'recommendations': self._generate_whatif_recommendations(scenarios),
        }
    
    def _generate_whatif_recommendations(self, scenarios):
        """Generate recommendations from what-if analysis."""
        recommendations = []
        
        baseline = next((s for s in scenarios if s['multiplier'] == 1.0), None)
        if not baseline:
            return recommendations
        
        for scenario in scenarios:
            if scenario['multiplier'] > 1.0:
                wait_increase = scenario['avg_wait_time'] - baseline['avg_wait_time']
                if wait_increase > 2:
                    recommendations.append({
                        'scenario': scenario['demand_label'],
                        'finding': f"Demand at {scenario['multiplier']:.0%} increases wait times by {wait_increase:.1f} seconds",
                        'action': 'Consider capacity expansion for higher demand scenarios',
                    })
        
        return recommendations


def get_simulator(simulation_type, params, num_replications=100, **kwargs):
    """Factory function to get the appropriate simulator for a category.
    
    Args:
        simulation_type: Type of simulation ('room_usage', 'equipment_usage', etc.)
        params: Simulation parameters
        num_replications: Number of replications
        **kwargs: Optional arguments (e.g., multipliers for what_if)
    
    Returns:
        Instance of appropriate simulator class
    """
    simulators = {
        'room_usage': RoomUsageSimulator,
        'equipment_usage': EquipmentUsageSimulator,
        'peak_hour': PeakHourSimulator,
        'shortage': ShortageSimulator,
        'what_if': WhatIfSimulator,
    }
    
    simulator_class = simulators.get(simulation_type, RoomUsageSimulator)
    
    if simulation_type == 'what_if':
        return simulator_class(params, num_replications, kwargs.get('multipliers'))
    else:
        return simulator_class(params, num_replications)
