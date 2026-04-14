"""Capacity analysis views for resource management."""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models
from django.db.models import Count, Q, Sum
from django.core.cache import cache
from datetime import datetime, timedelta
import csv
from io import StringIO
from apps.scheduling.models import Room, Equipment, RoomEquipment, Booking, TimeSlot
from ..scenario_models import SavedScenario, CapacitySnapshot


class CapacityAnalysisViewSet(viewsets.ViewSet):
    """ViewSet for capacity and utilization analysis."""
    permission_classes = [IsAuthenticated]
    CACHE_TTL_SECONDS = 60

    def _format_percent(self, value):
        """Format numeric values as percentage strings with one decimal place."""
        try:
            numeric_value = float(value or 0)
        except (TypeError, ValueError):
            numeric_value = 0.0
        return f"{numeric_value:.1f}%"

    def _parse_percent(self, value):
        """Parse percent-like strings such as '12.3%' into float values."""
        try:
            return float(str(value or '').replace('%', ''))
        except (TypeError, ValueError):
            return 0.0

    def _build_decision_support_recommendations(self, current_utilization, peak_hours, conflict_summary):
        """Assemble dashboard decision support cards from existing capacity metrics."""
        room_utilization = list(current_utilization.get('room_utilization') or [])
        equipment_usage = list(current_utilization.get('equipment_usage') or [])

        room_utilization.sort(key=lambda item: float(item.get('utilization_pct') or 0))
        equipment_usage.sort(key=lambda item: float(item.get('assignment_pct') or 0), reverse=True)

        best_room = room_utilization[0] if room_utilization else None
        peak_slots = peak_hours.get('peak_slots') if isinstance(peak_hours, dict) else []
        underutilized_slots = peak_hours.get('underutilized_slots') if isinstance(peak_hours, dict) else []
        peak_slot = peak_slots[0] if isinstance(peak_slots, list) and peak_slots else None
        low_slot = underutilized_slots[0] if isinstance(underutilized_slots, list) and underutilized_slots else None

        summary = conflict_summary.get('summary') if isinstance(conflict_summary, dict) else {}
        conflict_rate = self._parse_percent(summary.get('conflict_rate'))
        most_conflicted_resource = summary.get('most_conflicted_resource') or 'N/A'

        overloaded_equipment = None
        for item in equipment_usage:
            assignment_pct = float(item.get('assignment_pct') or 0)
            available_quantity = int(item.get('available_quantity') or 0)
            if assignment_pct >= 80 and available_quantity <= 1:
                overloaded_equipment = item
                break

        recommendations = [
            {
                'id': 'room-allocation',
                'title': 'Recommend optimal room allocation',
                'tone': 'good' if best_room else 'neutral',
                'headline': (
                    f"Use {best_room['room_name']} for flexible bookings."
                    if best_room and float(best_room.get('utilization_pct') or 0) <= 35
                    else f"Prefer {best_room['room_name']} for lower-priority sessions."
                    if best_room
                    else 'No room utilization data available yet.'
                ),
                'details': (
                    f"{best_room['room_name']} is currently the least utilized room at "
                    f"{self._format_percent(best_room.get('utilization_pct'))} with "
                    f"{best_room.get('booked_slots', 0)}/{best_room.get('total_slots', 0)} booked slots."
                    if best_room
                    else 'The current utilization endpoint did not return room-level data.'
                ),
            },
            {
                'id': 'schedule-improvements',
                'title': 'Suggest scheduling improvements',
                'tone': 'watch' if peak_slot else 'neutral',
                'headline': (
                    f"Move non-urgent bookings away from {peak_slot.get('time_slot', 'peak slots')}."
                    if peak_slot
                    else 'No peak slot concentration detected.'
                ),
                'details': (
                    (
                        f"Peak demand is concentrated in {peak_slot.get('time_slot')}, while "
                        f"{low_slot.get('time_slot')} remains underused. "
                        "Stagger approvals toward quieter slots."
                    )
                    if peak_slot and low_slot
                    else (
                        f"Peak demand is concentrated in {peak_slot.get('time_slot')}."
                        if peak_slot
                        else 'Peak-hour data is not available right now.'
                    )
                ),
            },
            {
                'id': 'bottlenecks',
                'title': 'Identify resource bottlenecks',
                'tone': 'alert' if conflict_rate >= 10 else 'watch',
                'headline': (
                    f"Resource bottlenecks are elevated at {summary.get('conflict_rate') or '0%'} conflict rate."
                    if conflict_rate >= 10
                    else 'No major bottleneck is currently visible.'
                ),
                'details': (
                    f"{most_conflicted_resource} is the most conflicted resource. "
                    f"{int(summary.get('high_risk_slots') or 0)} high-risk slots are flagged."
                    if summary
                    else 'Conflict summary data is not available right now.'
                ),
            },
            {
                'id': 'equipment',
                'title': 'Recommend additional equipment',
                'tone': 'alert' if overloaded_equipment else 'good',
                'headline': (
                    f"Add more {overloaded_equipment.get('equipment_name')} units."
                    if overloaded_equipment
                    else 'No immediate equipment additions are needed.'
                ),
                'details': (
                    f"{overloaded_equipment.get('equipment_name')} is at "
                    f"{self._format_percent(overloaded_equipment.get('assignment_pct'))} assignment with only "
                    f"{int(overloaded_equipment.get('available_quantity') or 0)} spare unit(s) left."
                    if overloaded_equipment
                    else (
                        'Current equipment allocation leaves enough spare capacity across the active inventory.'
                        if equipment_usage
                        else 'Equipment utilization data is not available right now.'
                    )
                ),
            },
        ]

        return recommendations

    @action(detail=False, methods=['get'])
    def current_utilization(self, request):
        """Get current utilization across all rooms and equipment."""
        date_str = request.query_params.get('date')
        if not date_str:
            date = datetime.today().date()
        else:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()

        cache_key = f"capacity:current_utilization:{date.isoformat()}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        # Optimize queries with select_related and prefetch_related
        rooms = Room.objects.filter(is_active=True).only('id', 'name', 'capacity', 'room_type')
        time_slots_count = TimeSlot.objects.count()
        
        # Total available slot-hours
        total_slot_hours = rooms.count() * time_slots_count
        
        # Actual bookings - fetch once with room info
        bookings = Booking.objects.filter(
            date=date, 
            status__in=['CONFIRMED', 'APPROVED']
        ).values('room_id').annotate(count=Count('id'))
        
        # Create lookup dict for fast access
        booking_counts = {b['room_id']: b['count'] for b in bookings}
        booked_slots = sum(booking_counts.values())
        
        # Utilization by room - single loop, no repeated queries
        room_utilization = []
        for room in rooms:
            room_bookings = booking_counts.get(room.id, 0)
            util_pct = (room_bookings / time_slots_count * 100) if time_slots_count > 0 else 0
            room_utilization.append({
                'room_id': room.id,
                'room_name': room.name,
                'room_type': room.room_type,
                'capacity': room.capacity,
                'booked_slots': room_bookings,
                'total_slots': time_slots_count,
                'utilization_pct': round(util_pct, 1),
            })
        
        # Equipment usage - simplified: show assigned vs available (no daily booking lookup)
        equipment_data = Equipment.objects.filter(is_active=True).annotate(
            assigned_total=Sum('equipment_rooms__quantity'),
            num_rooms=Count('equipment_rooms')
        ).values('id', 'name', 'quantity', 'assigned_total', 'num_rooms')
        
        equipment_usage = []
        for eq in equipment_data:
            total_qty = eq['quantity']
            assigned_qty = eq['assigned_total'] or 0
            available_qty = total_qty - assigned_qty
            assignment_pct = (assigned_qty / total_qty * 100) if total_qty > 0 else 0
            
            equipment_usage.append({
                'equipment_id': eq['id'],
                'equipment_name': eq['name'],
                'total_quantity': total_qty,
                'assigned_quantity': assigned_qty,
                'available_quantity': available_qty,
                'assignment_pct': round(assignment_pct, 1),
                'room_assignments': eq['num_rooms'] or 0,
            })
        
        overall_util = (booked_slots / total_slot_hours * 100) if total_slot_hours > 0 else 0
        
        payload = {
            'date': date,
            'overall_utilization_pct': round(overall_util, 1),
            'total_available_slots': total_slot_hours,
            'total_booked_slots': booked_slots,
            'room_utilization': room_utilization,
            'equipment_usage': equipment_usage,
        }
        cache.set(cache_key, payload, self.CACHE_TTL_SECONDS)
        return Response(payload)

    @action(detail=False, methods=['get'])
    def decision_support(self, request):
        """Return backend-computed recommendation cards for Decision Support UI."""
        date_str = request.query_params.get('date')
        peak_days = int(request.query_params.get('peak_days', 14))
        conflict_days = int(request.query_params.get('conflict_days', 120))

        if not date_str:
            date = datetime.today().date()
        else:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()

        cache_key = f"capacity:decision_support:{date.isoformat()}:{peak_days}:{conflict_days}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        current_utilization_payload = self.current_utilization(request).data

        start_peak_date = datetime.today().date() - timedelta(days=peak_days)
        end_peak_date = datetime.today().date()
        peak_counts = Booking.objects.filter(
            date__gte=start_peak_date,
            date__lte=end_peak_date,
            status__in=['CONFIRMED', 'APPROVED']
        ).values(
            'time_slot_id',
            'time_slot__name',
            'time_slot__start_time',
            'time_slot__end_time',
        ).annotate(count=Count('id'))

        peak_slot_usage = {
            f"{item['time_slot__name']}: {item['time_slot__start_time'].strftime('%H:%M')} - {item['time_slot__end_time'].strftime('%H:%M')}": item['count']
            for item in peak_counts
        }
        for ts in TimeSlot.objects.all().only('id', 'name', 'start_time', 'end_time'):
            label = f"{ts.name}: {ts.start_time.strftime('%H:%M')} - {ts.end_time.strftime('%H:%M')}"
            peak_slot_usage.setdefault(label, 0)

        sorted_slots = sorted(peak_slot_usage.items(), key=lambda x: x[1], reverse=True)
        peak_payload = {
            'peak_slots': [{'time_slot': k, 'booking_count': v} for k, v in sorted_slots[:5]],
            'underutilized_slots': [{'time_slot': k, 'booking_count': v} for k, v in sorted_slots[-5:]],
        }

        conflict_start_date = datetime.today().date() - timedelta(days=conflict_days)
        conflict_end_date = datetime.today().date()
        active_statuses = ['PENDING', 'APPROVED', 'CONFIRMED']
        conflict_base = Booking.objects.filter(
            date__gte=conflict_start_date,
            date__lte=conflict_end_date,
            status__in=active_statuses,
        )

        grouped_slots = list(
            conflict_base.values(
                'date',
                'room_id',
                'room__name',
                'time_slot_id',
                'time_slot__name',
                'time_slot__start_time',
                'time_slot__end_time',
            ).annotate(count=Count('id'))
        )

        room_conflicts = {}
        slot_conflicts = {}
        for item in grouped_slots:
            if item['count'] > 1:
                room_name = item['room__name'] or f"Room {item['room_id']}"
                room_conflicts[room_name] = room_conflicts.get(room_name, 0) + 1

                slot_label = (
                    f"{item['time_slot__name']}: "
                    f"{item['time_slot__start_time'].strftime('%H:%M')} - "
                    f"{item['time_slot__end_time'].strftime('%H:%M')}"
                )
                slot_conflicts[slot_label] = slot_conflicts.get(slot_label, 0) + 1

        high_risk_slots = [
            {
                'slot': label,
                'conflicts': count,
                'probability': 'High' if count >= 8 else 'Medium' if count >= 4 else 'Low',
            }
            for label, count in sorted(slot_conflicts.items(), key=lambda x: x[1], reverse=True)[:8]
        ]

        total_active_bookings = conflict_base.count()
        total_conflicts = sum(1 for item in grouped_slots if item['count'] > 1)
        conflict_rate = round((total_conflicts / total_active_bookings * 100), 1) if total_active_bookings else 0.0
        most_conflicted_resource = (
            sorted(room_conflicts.items(), key=lambda x: x[1], reverse=True)[0][0]
            if room_conflicts else 'N/A'
        )
        conflict_payload = {
            'summary': {
                'total_conflicts': total_conflicts,
                'high_risk_slots': len([s for s in high_risk_slots if s['probability'] == 'High']),
                'conflict_rate': f"{conflict_rate:.1f}%",
                'most_conflicted_resource': most_conflicted_resource,
            }
        }

        recommendations = self._build_decision_support_recommendations(
            current_utilization_payload,
            peak_payload,
            conflict_payload,
        )

        payload = {
            'date': date,
            'peak_days': peak_days,
            'conflict_days': conflict_days,
            'recommendations': recommendations,
            'sources': {
                'current_utilization': {
                    'overall_utilization_pct': current_utilization_payload.get('overall_utilization_pct', 0),
                    'total_available_slots': current_utilization_payload.get('total_available_slots', 0),
                    'total_booked_slots': current_utilization_payload.get('total_booked_slots', 0),
                },
                'conflict_summary': conflict_payload.get('summary', {}),
            },
        }

        cache.set(cache_key, payload, self.CACHE_TTL_SECONDS)
        return Response(payload)

    @action(detail=False, methods=['post'])
    def scenario_analysis(self, request):
        """Analyze capacity under demand scaling scenarios."""
        date_str = request.data.get('date')
        demand_multiplier = float(request.data.get('demand_multiplier', 1.3))
        
        if not date_str:
            date = datetime.today().date()
        else:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        if demand_multiplier < 1.0:
            return Response({'error': 'demand_multiplier must be >= 1.0'}, status=status.HTTP_400_BAD_REQUEST)
        
        rooms = Room.objects.filter(is_active=True)
        time_slots = TimeSlot.objects.all()
        
        # Current state
        bookings = Booking.objects.filter(date=date, status__in=['CONFIRMED', 'APPROVED'])
        current_booked = bookings.count()
        total_slots = rooms.count() * time_slots.count()
        current_util = (current_booked / total_slots * 100) if total_slots > 0 else 0
        
        # Projected demand
        projected_bookings = int(current_booked * demand_multiplier)
        projected_util = (projected_bookings / total_slots * 100) if total_slots > 0 else 0
        
        # Analysis
        remaining_slots = total_slots - current_booked
        additional_demand = projected_bookings - current_booked
        can_handle = additional_demand <= remaining_slots
        
        # Recommendations
        recommendations = []
        if projected_util > 90:
            needed_slots = int(projected_bookings * 1.1)
            current_capacity = total_slots
            new_rooms_needed = max(0, int((needed_slots - current_capacity) / time_slots.count()))
            if new_rooms_needed > 0:
                recommendations.append({
                    'type': 'add_rooms',
                    'message': f'Add {new_rooms_needed} more room(s) to maintain <90% utilization',
                    'estimated_rooms': new_rooms_needed,
                })
            else:
                recommendations.append({
                    'type': 'optimize',
                    'message': 'Current rooms OK, but consider adding time slots or staggering bookings',
                })
        elif projected_util > 70:
            recommendations.append({
                'type': 'monitor',
                'message': f'System at {round(projected_util, 1)}% utilization - approaching capacity',
            })
        else:
            recommendations.append({
                'type': 'ok',
                'message': f'System has sufficient capacity at {round(projected_util, 1)}% utilization',
            })
        
        return Response({
            'date': date,
            'current_bookings': current_booked,
            'current_utilization_pct': round(current_util, 1),
            'demand_multiplier': demand_multiplier,
            'projected_bookings': projected_bookings,
            'projected_utilization_pct': round(projected_util, 1),
            'total_available_slots': total_slots,
            'remaining_slots_current': remaining_slots,
            'additional_demand': additional_demand,
            'can_handle_demand': can_handle,
            'recommendations': recommendations,
        })

    @action(detail=False, methods=['get'])
    def peak_hours(self, request):
        """Identify peak booking times and underutilized periods."""
        date_range_days = int(request.query_params.get('days', 7))
        start_date = datetime.today().date() - timedelta(days=date_range_days)
        end_date = datetime.today().date()

        cache_key = f"capacity:peak_hours:{start_date.isoformat()}:{end_date.isoformat()}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)
        
        booking_counts = Booking.objects.filter(
            date__gte=start_date,
            date__lte=end_date,
            status__in=['CONFIRMED', 'APPROVED']
        ).values(
            'time_slot_id',
            'time_slot__name',
            'time_slot__start_time',
            'time_slot__end_time',
        ).annotate(count=Count('id'))

        slot_usage = {
            f"{item['time_slot__name']}: {item['time_slot__start_time'].strftime('%H:%M')} - {item['time_slot__end_time'].strftime('%H:%M')}": item['count']
            for item in booking_counts
        }
        for ts in TimeSlot.objects.all().only('id', 'name', 'start_time', 'end_time'):
            label = f"{ts.name}: {ts.start_time.strftime('%H:%M')} - {ts.end_time.strftime('%H:%M')}"
            slot_usage.setdefault(label, 0)
        
        sorted_slots = sorted(slot_usage.items(), key=lambda x: x[1], reverse=True)
        
        peak_slots = [{'time_slot': k, 'booking_count': v} for k, v in sorted_slots[:5]]
        underutilized = [{'time_slot': k, 'booking_count': v} for k, v in sorted_slots[-5:]]
        
        payload = {
            'date_range_days': date_range_days,
            'start_date': start_date,
            'end_date': end_date,
            'total_bookings': sum(slot_usage.values()),
            'peak_slots': peak_slots,
            'underutilized_slots': underutilized,
            'all_slots': slot_usage,
        }
        cache.set(cache_key, payload, self.CACHE_TTL_SECONDS)
        return Response(payload)

    @action(detail=False, methods=['get'])
    def trend_analysis(self, request):
        """Get utilization trends over time."""
        days = int(request.query_params.get('days', 30))
        start_date = datetime.today().date() - timedelta(days=days)
        end_date = datetime.today().date()

        cache_key = f"capacity:trend_analysis:{start_date.isoformat()}:{end_date.isoformat()}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)
        
        rooms = Room.objects.filter(is_active=True)
        time_slots = TimeSlot.objects.all()
        total_possible_slots = rooms.count() * time_slots.count()
        
        bookings_by_date = Booking.objects.filter(
            date__gte=start_date,
            date__lte=end_date,
            status__in=['CONFIRMED', 'APPROVED']
        ).values('date').annotate(bookings=Count('id'))
        booking_lookup = {item['date']: item['bookings'] for item in bookings_by_date}

        trend_data = []
        for date in (datetime.strptime(str(start_date), '%Y-%m-%d') + timedelta(days=x) for x in range(days)):
            current_date = date.date()
            bookings = booking_lookup.get(current_date, 0)
            util = (bookings / total_possible_slots * 100) if total_possible_slots > 0 else 0
            
            trend_data.append({
                'date': current_date,
                'utilization_pct': round(util, 1),
                'bookings': bookings,
            })
        
        avg_util = sum(t['utilization_pct'] for t in trend_data) / len(trend_data) if trend_data else 0
        max_util = max(t['utilization_pct'] for t in trend_data) if trend_data else 0
        min_util = min(t['utilization_pct'] for t in trend_data) if trend_data else 0
        
        payload = {
            'days': days,
            'start_date': start_date,
            'end_date': end_date,
            'trend_data': trend_data,
            'avg_utilization': round(avg_util, 1),
            'max_utilization': round(max_util, 1),
            'min_utilization': round(min_util, 1),
        }
        cache.set(cache_key, payload, self.CACHE_TTL_SECONDS)
        return Response(payload)

    @action(detail=False, methods=['get'])
    def conflict_summary(self, request):
        """Fast conflict summary using DB-side grouping instead of full booking payloads."""
        days = int(request.query_params.get('days', 120))
        start_date = datetime.today().date() - timedelta(days=days)
        end_date = datetime.today().date()

        cache_key = f"capacity:conflict_summary:{start_date.isoformat()}:{end_date.isoformat()}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        active_statuses = ['PENDING', 'APPROVED', 'CONFIRMED']
        base = Booking.objects.filter(
            date__gte=start_date,
            date__lte=end_date,
            status__in=active_statuses,
        )

        grouped = list(
            base.values(
                'date',
                'room_id',
                'room__name',
                'time_slot_id',
                'time_slot__name',
                'time_slot__start_time',
                'time_slot__end_time',
            ).annotate(count=Count('id'))
        )

        day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        slots_per_day = {name: 0 for name in day_names}
        conflicts_per_day = {name: 0 for name in day_names}
        room_conflicts = {}
        slot_conflicts = {}

        for item in grouped:
            day_name = item['date'].strftime('%A')
            slots_per_day[day_name] = slots_per_day.get(day_name, 0) + 1

            if item['count'] > 1:
                conflicts_per_day[day_name] = conflicts_per_day.get(day_name, 0) + 1
                room_name = item['room__name'] or f"Room {item['room_id']}"
                room_conflicts[room_name] = room_conflicts.get(room_name, 0) + 1

                slot_label = (
                    f"{item['time_slot__name']}: "
                    f"{item['time_slot__start_time'].strftime('%H:%M')} - "
                    f"{item['time_slot__end_time'].strftime('%H:%M')}"
                )
                slot_conflicts[slot_label] = slot_conflicts.get(slot_label, 0) + 1

        conflicts_by_day = []
        for day in day_names:
            slot_count = slots_per_day.get(day, 0)
            conflict_count = conflicts_per_day.get(day, 0)
            rate = (conflict_count / slot_count * 100) if slot_count else 0
            if slot_count or conflict_count:
                conflicts_by_day.append({
                    'day': day,
                    'conflicts': conflict_count,
                    'slots': slot_count,
                    'rate': round(rate, 1),
                })

        high_risk_slots = [
            {
                'slot': label,
                'conflicts': count,
                'probability': 'High' if count >= 8 else 'Medium' if count >= 4 else 'Low',
            }
            for label, count in sorted(slot_conflicts.items(), key=lambda x: x[1], reverse=True)[:8]
        ]

        total_conflicts = sum(conflicts_per_day.values())
        total_active_bookings = base.count()
        conflict_rate = round((total_conflicts / total_active_bookings * 100), 1) if total_active_bookings else 0.0
        most_conflicted_resource = (
            sorted(room_conflicts.items(), key=lambda x: x[1], reverse=True)[0][0]
            if room_conflicts else 'N/A'
        )

        payload = {
            'days': days,
            'start_date': start_date,
            'end_date': end_date,
            'summary': {
                'total_conflicts': total_conflicts,
                'high_risk_slots': len([s for s in high_risk_slots if s['probability'] == 'High']),
                'conflict_rate': f"{conflict_rate:.1f}%",
                'most_conflicted_resource': most_conflicted_resource,
            },
            'conflicts_by_day': conflicts_by_day,
            'time_slots': high_risk_slots,
        }

        cache.set(cache_key, payload, self.CACHE_TTL_SECONDS)
        return Response(payload)

    @action(detail=False, methods=['post'])
    def save_scenario(self, request):
        """Save a scenario for later comparison."""
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        name = request.data.get('name')
        description = request.data.get('description', '')
        scenario_data = request.data.get('scenario_data')
        
        if not name or not scenario_data:
            return Response({'error': 'name and scenario_data required'}, status=status.HTTP_400_BAD_REQUEST)
        
        saved = SavedScenario.objects.create(
            user=request.user,
            name=name,
            description=description,
            scenario_data=scenario_data
        )
        
        return Response({
            'id': saved.id,
            'name': saved.name,
            'created_at': saved.created_at,
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def saved_scenarios(self, request):
        """Get all saved scenarios for current user."""
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        scenarios = SavedScenario.objects.filter(user=request.user)
        return Response([{
            'id': s.id,
            'name': s.name,
            'description': s.description,
            'data': s.scenario_data,
            'created_at': s.created_at,
        } for s in scenarios])

    @action(detail=False, methods=['get'])
    def scenario_detail(self, request):
        """Get a saved scenario by ID."""
        scenario_id = request.query_params.get('id')
        if not scenario_id:
            return Response({'error': 'id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            scenario = SavedScenario.objects.get(id=scenario_id, user=request.user)
            return Response({
                'id': scenario.id,
                'name': scenario.name,
                'description': scenario.description,
                'data': scenario.scenario_data,
                'created_at': scenario.created_at,
            })
        except SavedScenario.DoesNotExist:
            return Response({'error': 'Scenario not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def custom_allocation(self, request):
        """Test custom equipment allocation and see impact on utilization."""
        date_str = request.data.get('date')
        allocations = request.data.get('allocations', {})  # {room_id: [equipment_id, ...]}
        
        if not date_str:
            date = datetime.today().date()
        else:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        bookings = Booking.objects.filter(date=date, status__in=['CONFIRMED', 'APPROVED'])
        
        # Analyze with custom allocation
        room_util = []
        for room_id, equipment_ids in allocations.items():
            room = Room.objects.get(id=int(room_id))
            room_bookings = bookings.filter(room=room).count()
            util = (room_bookings / TimeSlot.objects.count() * 100) if TimeSlot.objects.count() > 0 else 0
            
            room_util.append({
                'room_id': room.id,
                'room_name': room.name,
                'allocated_equipment': equipment_ids,
                'utilization_pct': round(util, 1),
            })
        
        return Response({
            'date': date,
            'custom_allocation': room_util,
        })

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export utilization data as CSV."""
        date_str = request.query_params.get('date')
        days = int(request.query_params.get('days', 1))
        
        if not date_str:
            end_date = datetime.today().date()
        else:
            end_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        start_date = end_date - timedelta(days=days-1)
        
        rooms = Room.objects.filter(is_active=True)
        time_slots = TimeSlot.objects.all()
        total_slots_per_day = time_slots.count()
        num_rooms = rooms.count()
        
        # Build CSV
        output = StringIO()
        writer = csv.writer(output)
        
        writer.writerow(['Date', 'Total Bookings', 'Total Possible Slots', 'Utilization %'])
        
        for date in (datetime.strptime(str(start_date), '%Y-%m-%d') + timedelta(days=x) for x in range(days)):
            current_date = date.date()
            bookings = Booking.objects.filter(date=current_date, status__in=['CONFIRMED', 'APPROVED']).count()
            total_possible = num_rooms * total_slots_per_day
            util = (bookings / total_possible * 100) if total_possible > 0 else 0
            
            writer.writerow([current_date, bookings, total_possible, round(util, 1)])
        
        csv_str = output.getvalue()
        return Response({'csv': csv_str}, status=status.HTTP_200_OK)

