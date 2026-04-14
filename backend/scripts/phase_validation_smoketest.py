#!/usr/bin/env python
"""
Manual smoke test for Phase 1 & 2 end-to-end validation.
"""

import os


def main() -> int:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

    import django

    django.setup()

    from apps.simulation.simulation_categories import get_simulator

    print("\n" + "=" * 80)
    print("END-TO-END VALIDATION SMOKE TEST - PHASE 1 & 2")
    print("=" * 80)

    try:
        params = {
            'arrival_rate': 2.5,
            'service_distribution': 'exponential',
            'service_rate': 1.0,
            'num_servers': 5,
            'simulation_hours': 8,
        }
        simulator = get_simulator('room_usage', params, num_replications=30)
        results = simulator.run()
        print("✅ Room Usage Simulator executed")
        print(f"   Standard metrics: queue={results['standard_metrics'].get('avg_queue_length', 0):.2f}, "
              f"wait={results['standard_metrics'].get('avg_waiting_time', 0):.2f}s")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

    try:
        params = {
            'arrival_rate': 3.0,
            'service_distribution': 'exponential',
            'service_rate': 1.0,
            'num_servers': 3,
            'simulation_hours': 8,
        }
        simulator = get_simulator('equipment_usage', params, num_replications=30)
        results = simulator.run()
        print("✅ Equipment Usage Simulator executed")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

    try:
        params = {
            'arrival_rate': 2.0,
            'service_distribution': 'exponential',
            'service_rate': 1.0,
            'num_servers': 4,
            'simulation_hours': 8,
        }
        simulator = get_simulator('peak_hour', params, num_replications=30)
        results = simulator.run()
        print("✅ Peak Hour Simulator executed")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

    try:
        params = {
            'arrival_rate': 2.5,
            'service_distribution': 'exponential',
            'service_rate': 1.0,
            'num_servers': 3,
            'simulation_hours': 8,
        }
        simulator = get_simulator('shortage', params, num_replications=30)
        results = simulator.run()
        print("✅ Shortage Simulator executed")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

    try:
        params = {
            'arrival_rate': 2.0,
            'service_distribution': 'exponential',
            'service_rate': 1.0,
            'num_servers': 3,
            'simulation_hours': 8,
        }
        multipliers = [0.75, 1.0, 1.25, 1.5]
        simulator = get_simulator('what_if', params, num_replications=30, multipliers=multipliers)
        results = simulator.run()
        print("✅ What-If Simulator executed")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

    print("\n" + "=" * 80)
    print("VALIDATION SMOKE TEST COMPLETE")
    print("=" * 80)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
