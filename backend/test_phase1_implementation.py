#!/usr/bin/env python
"""
Test script for Phase 1 implementation - Backend Metrics Enhancement
Tests:
1. Time-slot tracking in simulate_replication()
2. Shortage metrics calculation
3. Batch comparison runner
4. Category-specific metrics collection
"""

import os
import sys
import django
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.simulation.simulation_engine import (
    simulate_replication,
    run_shortage_analysis,
    run_comparative_scenarios,
)
from apps.simulation.models import SimulationScenario, SimulationResult

print("=" * 80)
print("PHASE 1 IMPLEMENTATION TEST")
print("=" * 80)

# Test 1: Time-slot tracking
print("\n[TEST 1] Time-slot tracking in simulate_replication()")
print("-" * 80)

test_params = {
    'arrival_rate': 2.0,
    'service_distribution': 'exponential',
    'service_rate': 1.0,
    'num_servers': 3,
    'simulation_hours': 8,
    'track_time_slots': True,  # Enable time-slot tracking
}

try:
    result = simulate_replication(test_params)
    if 'time_slot_breakdown' in result:
        print("✓ Time-slot tracking enabled")
        print(f"  Number of hours tracked: {len(result['time_slot_breakdown'])}")
        print(f"  Sample hour data (hour 0): {result['time_slot_breakdown'][0]}")
    else:
        print("✗ Time-slot breakdown not found in result")
    print(f"  Standard metrics: queue_length={result['avg_queue_length']:.2f}, "
          f"wait_time={result['avg_waiting_time']:.2f}")
except Exception as e:
    print(f"✗ Error in time-slot tracking: {str(e)}")

# Test 2: Shortage metrics
print("\n[TEST 2] Shortage metrics calculation")
print("-" * 80)

shortage_params = {
    'arrival_rate': 3.0,
    'service_distribution': 'exponential',
    'service_rate': 1.0,
    'num_servers': 2,
    'simulation_hours': 8,
    'shortage_multiplier': 0.65,  # 65% capacity
    'max_queue_size': 10,
}

try:
    result = simulate_replication(shortage_params)
    print("✓ Shortage multiplier applied")
    print(f"  Effective servers: {result.get('effective_num_servers', 'N/A')}")
    print(f"  Rejected count: {result.get('rejected_count', 0)}")
    print(f"  Unmet demand %: {result.get('unmet_demand_percentage', 0):.2f}%")
    print(f"  Server utilization: {result['server_utilization']:.2%}")
except Exception as e:
    print(f"✗ Error in shortage metrics: {str(e)}")

# Test 3: Shortage analysis
print("\n[TEST 3] Shortage analysis (room vs equipment vs combined)")
print("-" * 80)

analysis_params = {
    'arrival_rate': 2.5,
    'service_distribution': 'exponential',
    'service_rate': 1.0,
    'num_servers': 3,
    'simulation_hours': 8,
}

try:
    shortage_results = run_shortage_analysis(analysis_params, num_replications=30)
    
    print("✓ Shortage analysis completed")
    print(f"\n  Normal scenario:")
    print(f"    Avg wait time: {shortage_results['normal']['avg_waiting_time']:.2f}s")
    print(f"    Avg queue length: {shortage_results['normal']['avg_queue_length']:.2f}")
    
    print(f"\n  Room shortage (65% capacity):")
    print(f"    Avg wait time: {shortage_results['room_shortage']['avg_waiting_time']:.2f}s")
    room_impact = shortage_results['impact']['room_shortage_impact']
    print(f"    Wait time increase: {room_impact['wait_time_increase_pct']:.2f}%")
    
    print(f"\n  Equipment shortage (70% capacity):")
    print(f"    Avg wait time: {shortage_results['equipment_shortage']['avg_waiting_time']:.2f}s")
    equip_impact = shortage_results['impact']['equipment_shortage_impact']
    print(f"    Wait time increase: {equip_impact['wait_time_increase_pct']:.2f}%")
    
    print(f"\n  Combined shortage (50% capacity):")
    print(f"    Avg wait time: {shortage_results['combined']['avg_waiting_time']:.2f}s")
    combined_impact = shortage_results['impact']['combined_impact']
    print(f"    Wait time increase: {combined_impact['wait_time_increase_pct']:.2f}%")
    
except Exception as e:
    print(f"✗ Error in shortage analysis: {str(e)}")

# Test 4: Comparative scenarios (what-if)
print("\n[TEST 4] Comparative scenarios (what-if analysis)")
print("-" * 80)

whatif_params = {
    'arrival_rate': 2.0,
    'service_distribution': 'exponential',
    'service_rate': 1.0,
    'num_servers': 3,
    'simulation_hours': 8,
}

try:
    multipliers = [0.75, 1.0, 1.25]
    whatif_results = run_comparative_scenarios(whatif_params, multipliers, num_replications=30)
    
    print("✓ Comparative scenarios generated")
    print(f"\n  Comparing {len(whatif_results)} scenarios:")
    
    for scenario_key, scenario_data in whatif_results.items():
        multiplier = scenario_data['multiplier']
        metrics = scenario_data['metrics']
        print(f"\n  Multiplier {multiplier}x:")
        print(f"    Wait time: {metrics['avg_waiting_time']:.2f}s")
        print(f"    Queue length: {metrics['avg_queue_length']:.2f}")
        print(f"    Utilization: {metrics['server_utilization']:.2%}")
    
except Exception as e:
    print(f"✗ Error in comparative scenarios: {str(e)}")

# Test 5: Database models
print("\n[TEST 5] Database models with new category_metrics field")
print("-" * 80)

try:
    # Create a test scenario
    scenario = SimulationScenario.objects.create(
        name='Phase 1 Test Scenario',
        description='Test scenario for Phase 1 validation',
        parameters={
            'arrival_rate': 2.0,
            'service_rate': 1.0,
            'num_servers': 3,
            'simulation_hours': 8,
            'simulation_type': 'peak_hour'
        },
        simulation_type='peak_hour',
        num_replications=100,
    )
    print(f"✓ Scenario created: ID {scenario.id}, Type: {scenario.simulation_type}")
    
    # Create a test result with category metrics
    category_metrics_data = {
        'peak_hours_data': [
            {'hour': 0, 'arrivals': 5, 'avg_wait_time': 2.5},
            {'hour': 1, 'arrivals': 8, 'avg_wait_time': 3.2},
        ]
    }
    
    result = SimulationResult.objects.create(
        scenario=scenario,
        metrics={
            'avg_queue_length': 2.5,
            'avg_waiting_time': 3.0,
            'server_utilization': 0.75,
        },
        category_metrics=category_metrics_data,
    )
    print(f"✓ Result created: ID {result.id}")
    print(f"  Category metrics saved: {bool(result.category_metrics)}")
    print(f"  Peak hours data: {result.category_metrics['peak_hours_data'] if result.category_metrics else 'None'}")
    
    # Cleanup
    result.delete()
    scenario.delete()
    print("✓ Test data cleaned up")
    
except Exception as e:
    print(f"✗ Error in database models: {str(e)}")

print("\n" + "=" * 80)
print("PHASE 1 TESTING COMPLETE")
print("=" * 80)
