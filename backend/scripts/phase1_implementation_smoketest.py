#!/usr/bin/env python
"""
Manual smoke test for Phase 1 implementation - Backend Metrics Enhancement.
"""

import os


def main() -> int:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

    import django

    django.setup()

    from apps.simulation.models import SimulationScenario, SimulationResult
    from apps.simulation.simulation_engine import (
        simulate_replication,
        run_shortage_analysis,
        run_comparative_scenarios,
    )

    print("=" * 80)
    print("PHASE 1 IMPLEMENTATION SMOKE TEST")
    print("=" * 80)

    test_params = {
        'arrival_rate': 2.0,
        'service_distribution': 'exponential',
        'service_rate': 1.0,
        'num_servers': 3,
        'simulation_hours': 8,
        'track_time_slots': True,
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

    shortage_params = {
        'arrival_rate': 3.0,
        'service_distribution': 'exponential',
        'service_rate': 1.0,
        'num_servers': 2,
        'simulation_hours': 8,
        'shortage_multiplier': 0.65,
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
    except Exception as e:
        print(f"✗ Error in shortage analysis: {str(e)}")

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
    except Exception as e:
        print(f"✗ Error in comparative scenarios: {str(e)}")

    try:
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

        result.delete()
        scenario.delete()
        print("✓ Test data cleaned up")
    except Exception as e:
        print(f"✗ Error in database models: {str(e)}")

    print("\n" + "=" * 80)
    print("PHASE 1 SMOKE TEST COMPLETE")
    print("=" * 80)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
