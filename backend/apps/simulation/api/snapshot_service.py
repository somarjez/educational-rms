"""System snapshot builders for simulation API."""

from apps.scheduling.models import Room, Equipment, Booking

from .payload_mappers import serialize_room, serialize_equipment


def build_system_snapshot_payload(start_date=None, end_date=None):
    rooms = Room.objects.all().prefetch_related('room_equipment__equipment')
    equipment = Equipment.objects.all()

    room_payload = [serialize_room(room) for room in rooms]
    equipment_payload = [serialize_equipment(eq) for eq in equipment]

    booking_summary = {}
    bookings = Booking.objects.select_related('room', 'time_slot')
    if start_date:
        bookings = bookings.filter(date__gte=start_date)
    if end_date:
        bookings = bookings.filter(date__lte=end_date)

    for booking in bookings:
        duration = (
            (booking.time_slot.end_time.hour + booking.time_slot.end_time.minute / 60)
            - (booking.time_slot.start_time.hour + booking.time_slot.start_time.minute / 60)
        )
        room_id = booking.room_id
        if room_id not in booking_summary:
            booking_summary[room_id] = {
                'room_id': room_id,
                'room_name': booking.room.name,
                'total_bookings': 0,
                'total_hours': 0.0,
            }
        booking_summary[room_id]['total_bookings'] += 1
        booking_summary[room_id]['total_hours'] += max(duration, 0.0)

    return {
        'rooms': room_payload,
        'equipment': equipment_payload,
        'booking_summary': list(booking_summary.values()),
    }
