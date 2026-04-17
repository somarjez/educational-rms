"""Dashboard views and utilities for user dashboard."""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q, Count
from django.utils import timezone
from django.core.cache import cache
from datetime import timedelta
from apps.scheduling.models import Booking, Room, TimeSlot, Waitlist
from apps.simulation.models import SimulationResult
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard statistics for the current user."""
    user = request.user
    is_admin_like = user.role.upper() in ['ADMIN', 'FACULTY']

    cache_key = f"dashboard_stats:{user.id}:{'admin' if is_admin_like else 'user'}"
    cached_data = cache.get(cache_key)
    if cached_data:
        return Response(cached_data, status=status.HTTP_200_OK)
    
    # User info
    user_data = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'role': user.role,
        'department': user.department,
        'avatar_url': f"https://ui-avatars.com/api/?name={user.get_full_name() or user.username}&background=0D8ABC&color=fff"
    }
    
    # Get recent bookings (limit 5)
    # Admin/Faculty see all recent bookings, others see only their own
    booking_scope = Booking.objects.all() if is_admin_like else Booking.objects.filter(user=user)

    recent_bookings = booking_scope.select_related('room', 'time_slot', 'user').only(
        'id', 'room__name', 'time_slot__start_time', 'time_slot__end_time',
        'date', 'status', 'purpose', 'user__first_name', 'user__last_name', 'user__username'
    ).order_by('-created_at')[:5]
    
    bookings_data = [
        {
            'id': booking.id,
            'room_name': booking.room.name,
            'date': booking.date.isoformat(),
            'time': f"{booking.time_slot.start_time} - {booking.time_slot.end_time}",
            'status': booking.status,
            'purpose': booking.purpose,
            'user_name': booking.user.get_full_name() or booking.user.username if user.role.upper() in ['ADMIN', 'FACULTY'] else None,
        }
        for booking in recent_bookings
    ]
    
    # Get booking stats
    # Admin/Faculty see system-wide stats, others see only their own
    booking_aggregate = booking_scope.aggregate(
        total_bookings=Count('id'),
        confirmed_bookings=Count('id', filter=Q(status='CONFIRMED')),
        pending_bookings=Count('id', filter=Q(status='PENDING')),
        approved_bookings=Count('id', filter=Q(status='APPROVED')),
        cancelled_bookings=Count('id', filter=Q(status='CANCELLED')),
        rejected_bookings=Count('id', filter=Q(status='REJECTED')),
    )
    booking_stats = {key: int(value or 0) for key, value in booking_aggregate.items()}
    
    # Get simulation stats (if user has run simulations)
    simulation_stats = {
        'total_simulations': SimulationResult.objects.only('id').count(),
        'latest_simulation': None
    }
    
    latest_sim = SimulationResult.objects.order_by('-run_date').first()
    if latest_sim:
        simulation_stats['latest_simulation'] = {
            'scenario_name': latest_sim.scenario.name if latest_sim.scenario else 'Unknown',
            'run_date': latest_sim.run_date.isoformat(),
        }
    
    # Admin-specific scheduling stats
    scheduling_stats = None
    if is_admin_like:
        today = timezone.now().date()
        week_from_now = today + timedelta(days=7)

        scheduling_aggregate = Booking.objects.aggregate(
            pending_approvals=Count('id', filter=Q(status='PENDING')),
            upcoming_bookings=Count(
                'id',
                filter=Q(
                    date__gte=today,
                    date__lte=week_from_now,
                    status__in=['APPROVED', 'CONFIRMED']
                )
            ),
            conflicts_today=Count('id', filter=Q(date=today, conflict_override=True)),
        )
        
        scheduling_stats = {
            'pending_approvals': int(scheduling_aggregate.get('pending_approvals') or 0),
            'total_rooms': Room.objects.filter(is_active=True).count(),
            'active_time_slots': TimeSlot.objects.filter(is_active=True).count(),
            'waitlist_entries': Waitlist.objects.filter(is_fulfilled=False).count(),
            'upcoming_bookings': int(scheduling_aggregate.get('upcoming_bookings') or 0),
            'conflicts_today': int(scheduling_aggregate.get('conflicts_today') or 0),
        }
        
        # Add booking stats for faculty resource overview dashboard
        total_bookings = booking_aggregate.get('total_bookings', 0)
        confirmed_bookings = booking_aggregate.get('confirmed_bookings', 0)
        pending_bookings = booking_aggregate.get('pending_bookings', 0)
        
        scheduled_today = Booking.objects.filter(
            date=today,
            status__in=['APPROVED', 'CONFIRMED']
        ).count()
        
        scheduling_stats['total_bookings'] = int(total_bookings or 0)
        scheduling_stats['confirmed_bookings'] = int(confirmed_bookings or 0)
        scheduling_stats['pending_bookings'] = int(pending_bookings or 0)
        scheduling_stats['scheduled_for_today'] = scheduled_today
        
        # Get pending booking requests for quick approval
        pending_requests = Booking.objects.filter(status='PENDING').select_related(
            'user', 'room', 'time_slot'
        ).only(
            'id', 'user__first_name', 'user__last_name', 'user__username',
            'room__name', 'date', 'time_slot__start_time', 'time_slot__end_time',
            'purpose', 'priority', 'created_at'
        ).order_by('-created_at')[:5]
        
        scheduling_stats['pending_requests'] = [
            {
                'id': booking.id,
                'user_name': booking.user.get_full_name() or booking.user.username,
                'room_name': booking.room.name,
                'date': booking.date.isoformat(),
                'time': f"{booking.time_slot.start_time} - {booking.time_slot.end_time}",
                'purpose': booking.purpose,
                'priority': booking.priority,
                'created_at': booking.created_at.isoformat(),
            }
            for booking in pending_requests
        ]
    
    response_data = {
        'success': True,
        'user': user_data,
        'booking_stats': booking_stats,
        'recent_bookings': bookings_data,
        'simulation_stats': simulation_stats,
    }
    
    if scheduling_stats:
        response_data['scheduling_stats'] = scheduling_stats

    cache.set(cache_key, response_data, timeout=30)
    
    return Response(response_data, status=status.HTTP_200_OK)
