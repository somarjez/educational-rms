"""Decision-support helpers for simulation outputs."""


def _severity_from_value(value, warn_threshold, critical_threshold):
    numeric = float(value or 0)
    if numeric >= critical_threshold:
        return 'critical'
    if numeric >= warn_threshold:
        return 'warning'
    return 'good'


def _recommendation(title, severity, message, action):
    return {
        'title': title,
        'severity': severity,
        'message': message,
        'action': action,
    }


def build_decision_support_payload(simulation_type, metrics, category_metrics=None):
    """Build category-aware recommendation payload for simulation output."""
    category_metrics = category_metrics or {}
    simulation_type = str(simulation_type or 'general').replace('-', '_')

    avg_wait = float(metrics.get('avg_waiting_time') or 0)
    avg_queue = float(metrics.get('avg_queue_length') or 0)
    utilization = float(metrics.get('server_utilization') or 0)

    health_score = max(0, 100 - (avg_wait * 12) - (avg_queue * 8) - (max(0, utilization - 0.75) * 120))

    recommendations = []

    wait_severity = _severity_from_value(avg_wait, 2.0, 5.0)
    if wait_severity != 'good':
        recommendations.append(
            _recommendation(
                title='Reduce wait time pressure',
                severity=wait_severity,
                message=f'Average waiting time is {avg_wait:.2f}s and may impact user experience.',
                action='Increase active servers during heavy windows or rebalance arrivals across time slots.',
            )
        )

    util_severity = _severity_from_value(utilization, 0.80, 0.90)
    if util_severity != 'good':
        recommendations.append(
            _recommendation(
                title='Prevent capacity saturation',
                severity=util_severity,
                message=f'Server utilization is {(utilization * 100):.1f}%, close to capacity limits.',
                action='Add short-term capacity or trim service-time variance to avoid instability.',
            )
        )

    if simulation_type == 'room_usage':
        peak_hour = category_metrics.get('peak_utilization_hour') or {}
        peak_util = float(peak_hour.get('occupancy_rate') or 0)
        if peak_util >= 85:
            recommendations.append(
                _recommendation(
                    title='Mitigate room bottlenecks',
                    severity='critical',
                    message=f'Peak room occupancy hits {peak_util:.1f}%, which risks booking contention.',
                    action='Open additional rooms or shift non-urgent sessions from peak periods.',
                )
            )

    elif simulation_type == 'equipment_usage':
        equip_util = float(category_metrics.get('avg_equipment_utilization') or 0)
        if equip_util >= 0.85:
            recommendations.append(
                _recommendation(
                    title='Scale equipment availability',
                    severity='critical',
                    message=f'Equipment utilization is {(equip_util * 100):.1f}% and queueing can escalate quickly.',
                    action='Add backup units for high-demand equipment and prioritize critical requests.',
                )
            )

    elif simulation_type == 'peak_hour':
        stress = category_metrics.get('system_stress_level') or 'moderate'
        peak_wait = float(category_metrics.get('peak_stress_value') or 0)
        if stress in ('high', 'critical'):
            recommendations.append(
                _recommendation(
                    title='Peak-hour mitigation required',
                    severity='critical' if stress == 'critical' else 'warning',
                    message=f'Peak-hour stress is {stress} with {peak_wait:.2f}s worst-hour waiting time.',
                    action='Apply staffing bursts and route flexible demand away from the peak hour.',
                )
            )

    elif simulation_type == 'shortage':
        impact = category_metrics.get('shortage_impact') or {}
        combined = impact.get('combined_impact') or {}
        combined_wait_increase = float(combined.get('wait_time_increase_pct') or 0)
        if combined_wait_increase >= 150:
            recommendations.append(
                _recommendation(
                    title='Address compound shortages',
                    severity='critical',
                    message=f'Combined shortage increases wait time by {combined_wait_increase:.1f}%.',
                    action='Prioritize restoring both room and equipment availability in parallel.',
                )
            )

    elif simulation_type == 'what_if':
        best = category_metrics.get('best_performer') or {}
        worst = category_metrics.get('worst_performer') or {}
        best_label = best.get('demand_label') or 'best case'
        worst_label = worst.get('demand_label') or 'worst case'
        if best and worst:
            recommendations.append(
                _recommendation(
                    title='Plan around demand envelope',
                    severity='warning',
                    message=f'Best performance appears at {best_label}, while {worst_label} drives highest pressure.',
                    action='Anchor daily planning near best-case demand and pre-define overflow actions.',
                )
            )

    if not recommendations:
        recommendations.append(
            _recommendation(
                title='System operating within target range',
                severity='good',
                message='Current simulated metrics do not indicate critical bottlenecks.',
                action='Continue monitoring and rerun simulations when demand pattern changes.',
            )
        )

    return {
        'health_score': round(health_score, 1),
        'priority': max((r['severity'] for r in recommendations), key=lambda s: {'good': 0, 'warning': 1, 'critical': 2}[s]),
        'recommendations': recommendations,
    }
