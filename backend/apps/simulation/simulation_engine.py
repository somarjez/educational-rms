"""Core simulation engine utilities used by API views."""

import math
import random
from collections import deque


def get_rng(prng, seed):
    if prng == 'system':
        return random.SystemRandom()
    rng = random.Random()
    if seed is not None:
        rng.seed(seed)
    return rng


def service_time(rng, service_distribution, service_rate, service_time_value):
    if service_distribution == 'fixed':
        return service_time_value
    return rng.expovariate(service_rate)


def simulate_replication(params):
    arrival_rate = params.get('arrival_rate')
    service_distribution = params.get('service_distribution', 'exponential')
    service_rate = params.get('service_rate', 1.0)
    service_time_value = params.get('service_time')
    num_servers = int(params.get('num_servers') or 1)
    simulation_hours = float(params.get('simulation_hours') or 8)
    prng = params.get('prng', 'mt19937')
    seed = params.get('seed')
    track_time_slots = params.get('track_time_slots', False)  # New: track hourly metrics
    shortage_multiplier = params.get('shortage_multiplier', 1.0)  # New: simulate shortage by reducing capacity

    rng = get_rng(prng, seed)

    if arrival_rate is None or arrival_rate <= 0:
        raise ValueError('arrival_rate must be greater than 0')

    if service_distribution == 'exponential' and (service_rate is None or service_rate <= 0):
        raise ValueError('service_rate must be greater than 0 for exponential distribution')

    if service_distribution == 'fixed' and (service_time_value is None or service_time_value <= 0):
        raise ValueError('service_time must be greater than 0 for fixed distribution')

    # Apply shortage multiplier to effective capacity
    effective_num_servers = max(1, int(num_servers * shortage_multiplier))

    t = 0.0
    max_time = simulation_hours

    next_arrival = rng.expovariate(arrival_rate)
    busy_end_times = []
    queue = deque()

    total_wait = 0.0
    total_system = 0.0
    total_service = 0.0
    served_count = 0
    rejected_count = 0  # New: track unmet demand
    max_queue_length = 0
    last_event_time = 0.0
    area_queue = 0.0
    
    # New: time-slot tracking (hourly buckets)
    time_slot_data = []
    current_hour = 0
    current_hour_arrivals = 0
    current_hour_served = 0
    current_hour_rejected = 0
    current_hour_max_queue = 0
    current_hour_total_wait = 0.0
    
    # Queue capacity for shortage scenarios (unlimited if not specified)
    max_queue_size = params.get('max_queue_size')

    while t < max_time:
        # New: check if we crossed an hour boundary for time-slot tracking
        if track_time_slots:
            new_hour = int(t)
            if new_hour > current_hour and current_hour < int(max_time):
                # Record time-slot data
                hour_utilization = 0
                if current_hour_served > 0:
                    hour_utilization = (current_hour_total_wait / current_hour_served) if current_hour_served > 0 else 0
                
                time_slot_data.append({
                    'hour': current_hour,
                    'arrivals': current_hour_arrivals,
                    'served': current_hour_served,
                    'rejected': current_hour_rejected,
                    'max_queue_length': current_hour_max_queue,
                    'avg_wait_time': (current_hour_total_wait / current_hour_served) if current_hour_served > 0 else 0,
                    'queue_length_at_hour_end': len(queue),
                })
                
                # Reset hour counters
                current_hour = new_hour
                current_hour_arrivals = 0
                current_hour_served = 0
                current_hour_rejected = 0
                current_hour_max_queue = 0
                current_hour_total_wait = 0.0

        next_departure = min(busy_end_times) if busy_end_times else math.inf
        next_event = min(next_arrival, next_departure)

        if next_event > max_time:
            area_queue += len(queue) * (max_time - last_event_time)
            if track_time_slots:
                # Record final hour
                time_slot_data.append({
                    'hour': current_hour,
                    'arrivals': current_hour_arrivals,
                    'served': current_hour_served,
                    'rejected': current_hour_rejected,
                    'max_queue_length': current_hour_max_queue,
                    'avg_wait_time': (current_hour_total_wait / current_hour_served) if current_hour_served > 0 else 0,
                    'queue_length_at_hour_end': len(queue),
                })
            break

        area_queue += len(queue) * (next_event - last_event_time)
        t = next_event
        last_event_time = t

        if next_arrival <= next_departure:
            current_hour_arrivals += 1
            
            # Check if arrival should be accepted or rejected
            should_reject = (max_queue_size is not None and 
                           len(queue) >= max_queue_size and 
                           len(busy_end_times) >= effective_num_servers)
            
            if len(busy_end_times) < effective_num_servers:
                service_duration = service_time(rng, service_distribution, service_rate, service_time_value)
                total_system += service_duration
                total_service += service_duration
                served_count += 1
                current_hour_served += 1
                busy_end_times.append(t + service_duration)
            elif should_reject:
                # Reject if queue is full
                rejected_count += 1
                current_hour_rejected += 1
            else:
                queue.append(t)
                max_queue_length = max(max_queue_length, len(queue))
                current_hour_max_queue = max(current_hour_max_queue, len(queue))

            next_arrival = t + rng.expovariate(arrival_rate)
        else:
            busy_end_times.remove(next_departure)
            if queue:
                arrival_time = queue.popleft()
                wait_time = t - arrival_time
                service_duration = service_time(rng, service_distribution, service_rate, service_time_value)
                total_wait += wait_time
                total_system += wait_time + service_duration
                total_service += service_duration
                served_count += 1
                current_hour_served += 1
                current_hour_total_wait += wait_time
                busy_end_times.append(t + service_duration)

    avg_queue_length = area_queue / max_time if max_time > 0 else 0.0
    avg_waiting_time = total_wait / served_count if served_count > 0 else 0.0
    avg_system_time = total_system / served_count if served_count > 0 else 0.0
    server_utilization = total_service / (effective_num_servers * max_time) if max_time > 0 else 0.0

    result = {
        'avg_queue_length': avg_queue_length,
        'avg_waiting_time': avg_waiting_time,
        'avg_system_time': avg_system_time,
        'server_utilization': server_utilization,
        'max_queue_length': max_queue_length,
        'served_count': served_count,
    }
    
    # Add new metrics if they were tracked
    if track_time_slots:
        result['time_slot_breakdown'] = time_slot_data
    
    if rejected_count > 0 or shortage_multiplier < 1.0:
        result['rejected_count'] = rejected_count
        result['shortage_multiplier'] = shortage_multiplier
        result['effective_num_servers'] = effective_num_servers
        result['unmet_demand_percentage'] = (rejected_count / (served_count + rejected_count) * 100) if (served_count + rejected_count) > 0 else 0.0
    
    return result


def factorial(n):
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result


def estimate_mm_c(params):
    arrival_rate = params.get('arrival_rate')
    service_distribution = params.get('service_distribution', 'exponential')
    service_rate = params.get('service_rate')
    service_time_value = params.get('service_time')
    num_servers = int(params.get('num_servers', 1))
    simulation_hours = float(params.get('simulation_hours', 8))

    if arrival_rate is None or arrival_rate <= 0:
        raise ValueError('arrival_rate must be greater than 0')
    if service_distribution == 'fixed':
        if service_time_value is None or service_time_value <= 0:
            raise ValueError('service_time must be greater than 0 for fixed distribution')
        service_rate = 1.0 / service_time_value
    if service_rate is None or service_rate <= 0:
        raise ValueError('service_rate must be greater than 0')
    if num_servers < 1:
        raise ValueError('num_servers must be at least 1')

    capacity = num_servers * service_rate
    if arrival_rate >= capacity:
        raise ValueError('System is unstable: arrival_rate must be less than num_servers * service_rate')

    a = arrival_rate / service_rate
    rho = arrival_rate / capacity

    sum_terms = 0.0
    for k in range(num_servers):
        sum_terms += (a ** k) / factorial(k)
    last_term = (a ** num_servers) / (factorial(num_servers) * (1 - rho))
    p0 = 1.0 / (sum_terms + last_term)

    lq = (p0 * (a ** num_servers) * rho) / (factorial(num_servers) * (1 - rho) ** 2)
    wq = lq / arrival_rate
    w = wq + 1.0 / service_rate

    served_count = arrival_rate * simulation_hours

    return {
        'avg_queue_length': lq,
        'avg_waiting_time': wq,
        'avg_system_time': w,
        'server_utilization': rho,
        'max_queue_length': 0,
        'served_count': served_count,
    }


def run_shortage_analysis(params, num_replications=100):
    """
    Analyze shortage impact by running simulations with different shortage scenarios.
    
    Returns:
        dict with keys 'normal', 'room_shortage', 'equipment_shortage', 'combined'
        Each containing aggregated metrics from simulations.
    """
    results = {}
    
    # Normal scenario (no shortage)
    normal_params = dict(params)
    normal_params['shortage_multiplier'] = 1.0
    normal_params['track_time_slots'] = True
    normal_metrics = []
    for _ in range(num_replications):
        normal_metrics.append(simulate_replication(normal_params))
    results['normal'] = _aggregate_metrics(normal_metrics)
    
    # Room shortage scenario (65% capacity)
    room_shortage_params = dict(params)
    room_shortage_params['shortage_multiplier'] = 0.65
    room_shortage_params['track_time_slots'] = True
    room_metrics = []
    for _ in range(num_replications):
        room_metrics.append(simulate_replication(room_shortage_params))
    results['room_shortage'] = _aggregate_metrics(room_metrics)
    
    # Equipment shortage scenario (70% capacity)
    equipment_shortage_params = dict(params)
    equipment_shortage_params['shortage_multiplier'] = 0.70
    equipment_shortage_params['track_time_slots'] = True
    equipment_metrics = []
    for _ in range(num_replications):
        equipment_metrics.append(simulate_replication(equipment_shortage_params))
    results['equipment_shortage'] = _aggregate_metrics(equipment_metrics)
    
    # Combined shortage (50% capacity)
    combined_shortage_params = dict(params)
    combined_shortage_params['shortage_multiplier'] = 0.50
    combined_shortage_params['track_time_slots'] = True
    combined_metrics = []
    for _ in range(num_replications):
        combined_metrics.append(simulate_replication(combined_shortage_params))
    results['combined'] = _aggregate_metrics(combined_metrics)
    
    # Calculate impact metrics
    results['impact'] = {
        'room_shortage_impact': {
            'wait_time_increase_pct': ((results['room_shortage'].get('avg_waiting_time', 0) - 
                                       results['normal'].get('avg_waiting_time', 0)) / 
                                      max(results['normal'].get('avg_waiting_time', 1), 0.001) * 100),
            'queue_length_increase_pct': ((results['room_shortage'].get('avg_queue_length', 0) - 
                                          results['normal'].get('avg_queue_length', 0)) / 
                                         max(results['normal'].get('avg_queue_length', 1), 0.001) * 100),
            'unmet_demand': results['room_shortage'].get('rejected_count', 0),
        },
        'equipment_shortage_impact': {
            'wait_time_increase_pct': ((results['equipment_shortage'].get('avg_waiting_time', 0) - 
                                       results['normal'].get('avg_waiting_time', 0)) / 
                                      max(results['normal'].get('avg_waiting_time', 1), 0.001) * 100),
            'queue_length_increase_pct': ((results['equipment_shortage'].get('avg_queue_length', 0) - 
                                          results['normal'].get('avg_queue_length', 0)) / 
                                         max(results['normal'].get('avg_queue_length', 1), 0.001) * 100),
            'unmet_demand': results['equipment_shortage'].get('rejected_count', 0),
        },
        'combined_impact': {
            'wait_time_increase_pct': ((results['combined'].get('avg_waiting_time', 0) - 
                                       results['normal'].get('avg_waiting_time', 0)) / 
                                      max(results['normal'].get('avg_waiting_time', 1), 0.001) * 100),
            'queue_length_increase_pct': ((results['combined'].get('avg_queue_length', 0) - 
                                          results['normal'].get('avg_queue_length', 0)) / 
                                         max(results['normal'].get('avg_queue_length', 1), 0.001) * 100),
            'unmet_demand': results['combined'].get('rejected_count', 0),
        }
    }
    
    return results


def _aggregate_metrics(metrics_list):
    """Aggregate metrics from multiple replications."""
    if not metrics_list:
        return {}
    
    aggregated = {
        'avg_queue_length': sum(m.get('avg_queue_length', 0) for m in metrics_list) / len(metrics_list),
        'avg_waiting_time': sum(m.get('avg_waiting_time', 0) for m in metrics_list) / len(metrics_list),
        'avg_system_time': sum(m.get('avg_system_time', 0) for m in metrics_list) / len(metrics_list),
        'server_utilization': sum(m.get('server_utilization', 0) for m in metrics_list) / len(metrics_list),
        'max_queue_length': max((m.get('max_queue_length', 0) for m in metrics_list), default=0),
        'served_count': sum(m.get('served_count', 0) for m in metrics_list) / len(metrics_list),
        'rejected_count': sum(m.get('rejected_count', 0) for m in metrics_list),
    }
    
    # Aggregate time-slot data if available
    replications_with_timeslots = [m for m in metrics_list if m.get('time_slot_breakdown')]
    if replications_with_timeslots:
        try:
            num_hours = len(replications_with_timeslots[0].get('time_slot_breakdown', []))
            time_slot_breakdown = []
            for hour_idx in range(num_hours):
                hour_values = []
                for m in replications_with_timeslots:
                    if hour_idx < len(m.get('time_slot_breakdown', [])):
                        hour_values.append(m['time_slot_breakdown'][hour_idx])
                
                if hour_values:
                    hour_data = {
                        'hour': hour_idx,
                        'avg_arrivals': sum(h.get('arrivals', 0) for h in hour_values) / len(hour_values),
                        'avg_served': sum(h.get('served', 0) for h in hour_values) / len(hour_values),
                        'avg_rejected': sum(h.get('rejected', 0) for h in hour_values) / len(hour_values),
                        'avg_max_queue': sum(h.get('max_queue_length', 0) for h in hour_values) / len(hour_values),
                        'avg_wait_time': sum(h.get('avg_wait_time', 0) for h in hour_values) / len(hour_values),
                    }
                    time_slot_breakdown.append(hour_data)
            
            if time_slot_breakdown:
                aggregated['time_slot_breakdown'] = time_slot_breakdown
        except (IndexError, KeyError, TypeError):
            # If time-slot aggregation fails, skip it
            pass
    
    return aggregated


def run_comparative_scenarios(base_params, multipliers, num_replications=100):
    """
    Run multiple what-if scenarios with different demand multipliers.
    
    Args:
        base_params: Base simulation parameters
        multipliers: List of multipliers (e.g., [0.5, 0.75, 1.0, 1.25, 1.5])
        num_replications: Number of replications per scenario
    
    Returns:
        dict with results for each multiplier scenario
    """
    results = {}
    
    for multiplier in multipliers:
        scenario_params = dict(base_params)
        scenario_params['arrival_rate'] = base_params.get('arrival_rate', 1.0) * multiplier
        scenario_params['track_time_slots'] = True
        
        metrics_list = []
        for _ in range(num_replications):
            metrics_list.append(simulate_replication(scenario_params))
        
        aggregated = _aggregate_metrics(metrics_list)
        results[f'multiplier_{multiplier}'] = {
            'multiplier': multiplier,
            'metrics': aggregated,
            'num_replications': num_replications,
        }
    
    return results

