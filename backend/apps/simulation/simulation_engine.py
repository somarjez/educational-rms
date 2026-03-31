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

    rng = get_rng(prng, seed)

    if arrival_rate is None or arrival_rate <= 0:
        raise ValueError('arrival_rate must be greater than 0')

    if service_distribution == 'exponential' and (service_rate is None or service_rate <= 0):
        raise ValueError('service_rate must be greater than 0 for exponential distribution')

    if service_distribution == 'fixed' and (service_time_value is None or service_time_value <= 0):
        raise ValueError('service_time must be greater than 0 for fixed distribution')

    t = 0.0
    max_time = simulation_hours

    next_arrival = rng.expovariate(arrival_rate)
    busy_end_times = []
    queue = deque()

    total_wait = 0.0
    total_system = 0.0
    total_service = 0.0
    served_count = 0
    max_queue_length = 0
    last_event_time = 0.0
    area_queue = 0.0

    while t < max_time:
        next_departure = min(busy_end_times) if busy_end_times else math.inf
        next_event = min(next_arrival, next_departure)

        if next_event > max_time:
            area_queue += len(queue) * (max_time - last_event_time)
            break

        area_queue += len(queue) * (next_event - last_event_time)
        t = next_event
        last_event_time = t

        if next_arrival <= next_departure:
            if len(busy_end_times) < num_servers:
                service_duration = service_time(rng, service_distribution, service_rate, service_time_value)
                total_system += service_duration
                total_service += service_duration
                served_count += 1
                busy_end_times.append(t + service_duration)
            else:
                queue.append(t)
                max_queue_length = max(max_queue_length, len(queue))

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
                busy_end_times.append(t + service_duration)

    avg_queue_length = area_queue / max_time if max_time > 0 else 0.0
    avg_waiting_time = total_wait / served_count if served_count > 0 else 0.0
    avg_system_time = total_system / served_count if served_count > 0 else 0.0
    server_utilization = total_service / (num_servers * max_time) if max_time > 0 else 0.0

    return {
        'avg_queue_length': avg_queue_length,
        'avg_waiting_time': avg_waiting_time,
        'avg_system_time': avg_system_time,
        'server_utilization': server_utilization,
        'max_queue_length': max_queue_length,
        'served_count': served_count,
    }


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
