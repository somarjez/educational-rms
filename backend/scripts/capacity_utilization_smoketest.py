#!/usr/bin/env python
"""Manual smoke test for capacity utilization endpoint."""


def main() -> int:
    import requests

    try:
        r = requests.get('http://127.0.0.1:8000/api/v1/capacity/current_utilization/?date=2026-02-02')
        data = r.json()
        print(f"Status Code: {r.status_code}")
        print(f"Rooms returned: {len(data.get('room_utilization', []))}")
        print(f"Equipment returned: {len(data.get('equipment_usage', []))}")
        print("\nFirst 3 rooms:")
        for room in data.get('room_utilization', [])[:3]:
            print(f"  - {room['room_name']}: {room['utilization_pct']}%")
        print("\nAll equipment:")
        for eq in data.get('equipment_usage', []):
            print(f"  - {eq['equipment_name']}: {eq['usage_pct']}%")
    except Exception as e:
        print(f"Error: {e}")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
