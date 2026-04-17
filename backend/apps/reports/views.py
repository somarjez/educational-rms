from datetime import datetime
import csv
import io

from django.http import HttpResponse
from django.utils import timezone
from django.db.models import Sum, F, IntegerField, ExpressionWrapper
from django.db.models.functions import Coalesce
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication

from api.permissions import IsFacultyOrAdmin
from apps.scheduling.models import Booking, Room, Equipment


VALID_REPORT_TYPES = {'room', 'equipment', 'activity'}
VALID_FORMATS = {'pdf', 'excel'}
EQUIPMENT_REQUEST_PREFIX = '[EQUIPMENT_REQUEST]'


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, '%Y-%m-%d').date()
    except ValueError:
        return None


def _booking_scope_for_user(user):
    if user.is_admin():
        return Booking.objects.select_related('room', 'time_slot', 'user')
    return Booking.objects.select_related('room', 'time_slot', 'user').filter(user=user)


def _apply_filters(queryset, request):
    status_param = request.query_params.get('status')
    room_id = request.query_params.get('room_id')
    start_date = _parse_date(request.query_params.get('start_date'))
    end_date = _parse_date(request.query_params.get('end_date'))

    if status_param:
        queryset = queryset.filter(status=str(status_param).upper())
    if room_id:
        queryset = queryset.filter(room_id=room_id)
    if start_date:
        queryset = queryset.filter(date__gte=start_date)
    if end_date:
        queryset = queryset.filter(date__lte=end_date)

    return queryset


def _duration_hours(slot):
    if not slot or not slot.start_time or not slot.end_time:
        return 0
    start_minutes = slot.start_time.hour * 60 + slot.start_time.minute
    end_minutes = slot.end_time.hour * 60 + slot.end_time.minute
    diff = end_minutes - start_minutes
    return (diff / 60) if diff > 0 else 0


def _parse_request_notes(notes):
    metadata = {}
    for part in str(notes or '').split('|'):
        key, _, value = part.strip().partition('=')
        if key and value:
            metadata[key.strip()] = value.strip()
    return metadata


def _is_equipment_request(booking):
    return str(booking.purpose or '').startswith(EQUIPMENT_REQUEST_PREFIX)


def _room_rows(bookings):
    grouped = {}
    for booking in bookings:
        key = booking.room_id
        if key not in grouped:
            grouped[key] = {
                'room': booking.room.name,
                'bookings': 0,
                'approved': 0,
                'pending': 0,
                'cancelled': 0,
                'hours': 0,
                'last_used': None,
            }

        row = grouped[key]
        row['bookings'] += 1
        row['hours'] += _duration_hours(booking.time_slot)

        status_name = str(booking.status).upper()
        if status_name in ['APPROVED', 'CONFIRMED']:
            row['approved'] += 1
        elif status_name == 'PENDING':
            row['pending'] += 1
        elif status_name == 'CANCELLED':
            row['cancelled'] += 1

        if not row['last_used'] or booking.date > row['last_used']:
            row['last_used'] = booking.date

    rows = []
    for row in grouped.values():
        rows.append([
            row['room'],
            row['bookings'],
            row['approved'],
            row['pending'],
            row['cancelled'],
            f"{row['hours']:.1f}",
            row['last_used'].isoformat() if row['last_used'] else '',
        ])
    return ['Room', 'Bookings', 'Approved', 'Pending', 'Cancelled', 'Total Hours Used', 'Last Used'], rows


def _equipment_rows(bookings, equipment_id=None):
    equipment_map = {
        item.id: {
            'name': item.name,
            'requests': 0,
            'requested_quantity': 0,
            'approved_quantity': 0,
            'pending_quantity': 0,
            'available': getattr(item, 'available_total', None),
            'last_used': None,
        }
        for item in Equipment.objects.annotate(
            assigned_total=Coalesce(Sum('equipment_rooms__quantity'), 0),
            available_total=ExpressionWrapper(
                F('quantity') - Coalesce(Sum('equipment_rooms__quantity'), 0),
                output_field=IntegerField()
            ),
        )
    }

    for booking in bookings:
        if not _is_equipment_request(booking):
            continue

        metadata = _parse_request_notes(booking.notes)
        eq_id = metadata.get('equipment_id')
        qty = metadata.get('quantity')

        try:
            eq_id = int(eq_id)
            qty = int(qty)
        except (TypeError, ValueError):
            continue

        if equipment_id and str(eq_id) != str(equipment_id):
            continue

        if eq_id not in equipment_map:
            equipment_map[eq_id] = {
                'name': metadata.get('equipment_name', f'Equipment #{eq_id}'),
                'requests': 0,
                'requested_quantity': 0,
                'approved_quantity': 0,
                'pending_quantity': 0,
                'available': None,
                'last_used': None,
            }

        row = equipment_map[eq_id]
        row['requests'] += 1
        row['requested_quantity'] += qty

        status_name = str(booking.status).upper()
        if status_name in ['APPROVED', 'CONFIRMED']:
            row['approved_quantity'] += qty
        elif status_name == 'PENDING':
            row['pending_quantity'] += qty

        if not row['last_used'] or booking.date > row['last_used']:
            row['last_used'] = booking.date

    rows = []
    for row in equipment_map.values():
        rows.append([
            row['name'],
            row['requests'],
            row['requested_quantity'],
            row['approved_quantity'],
            row['pending_quantity'],
            row['available'] if row['available'] is not None else '',
            row['last_used'].isoformat() if row['last_used'] else '',
        ])

    rows.sort(key=lambda item: (item[2], item[1]), reverse=True)
    return ['Equipment', 'Requests', 'Requested Quantity', 'Approved Quantity', 'Pending Quantity', 'Available Quantity', 'Last Used'], rows


def _activity_rows(bookings):
    grouped = {}
    for booking in bookings:
        key = booking.user_id
        if key not in grouped:
            full_name = booking.user.get_full_name().strip() if hasattr(booking.user, 'get_full_name') else ''
            grouped[key] = {
                'user': full_name or booking.user.username,
                'role': booking.user.role,
                'bookings': 0,
                'approved': 0,
                'cancelled': 0,
                'rejected': 0,
                'last': None,
            }

        row = grouped[key]
        row['bookings'] += 1
        status_name = str(booking.status).upper()

        if status_name in ['APPROVED', 'CONFIRMED']:
            row['approved'] += 1
        elif status_name == 'CANCELLED':
            row['cancelled'] += 1
        elif status_name == 'REJECTED':
            row['rejected'] += 1

        if not row['last'] or booking.date > row['last']:
            row['last'] = booking.date

    rows = []
    for row in grouped.values():
        rows.append([
            row['user'],
            row['role'],
            row['bookings'],
            row['approved'],
            row['cancelled'],
            row['rejected'],
            row['last'].isoformat() if row['last'] else '',
        ])

    rows.sort(key=lambda item: item[2], reverse=True)
    return ['User', 'Role', 'Bookings Created', 'Approved', 'Cancelled', 'Rejected', 'Last Activity'], rows


def _build_report_rows(report_type, bookings, equipment_id=None):
    if report_type == 'room':
        return _room_rows(bookings)
    if report_type == 'equipment':
        return _equipment_rows(bookings, equipment_id=equipment_id)
    return _activity_rows(bookings)


def _csv_response(headers, rows, filename):
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(headers)
    writer.writerows(rows)

    response = HttpResponse(buffer.getvalue(), content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{filename}.csv"'
    return response


def _escape_pdf_text(text):
    return str(text).replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')


def _simple_pdf_response(headers, rows, filename):
    lines = [', '.join(headers)] + [', '.join(str(value) for value in row) for row in rows[:120]]

    y = 800
    content_lines = ['BT', '/F1 10 Tf', '50 820 Td']
    for index, line in enumerate(lines):
        if index > 0:
            y -= 12
            if y < 40:
                break
            content_lines.append(f'1 0 0 1 50 {y} Tm')
        content_lines.append(f'({_escape_pdf_text(line)}) Tj')

    content_lines.append('ET')
    content_stream = '\n'.join(content_lines).encode('latin-1', errors='replace')

    objects = []
    objects.append(b'1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n')
    objects.append(b'2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n')
    objects.append(b'3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>endobj\n')
    objects.append(b'4 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n')
    objects.append(f'5 0 obj<< /Length {len(content_stream)} >>stream\n'.encode('latin-1') + content_stream + b'\nendstream\nendobj\n')

    pdf = b'%PDF-1.4\n'
    offsets = []
    for obj in objects:
        offsets.append(len(pdf))
        pdf += obj

    xref_offset = len(pdf)
    pdf += f'xref\n0 {len(objects) + 1}\n'.encode('latin-1')
    pdf += b'0000000000 65535 f \n'
    for offset in offsets:
        pdf += f'{offset:010d} 00000 n \n'.encode('latin-1')

    pdf += f'trailer<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF'.encode('latin-1')

    response = HttpResponse(pdf, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}.pdf"'
    return response


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated, IsFacultyOrAdmin])
def export_report(request):
    report_type = str(request.query_params.get('report_type', 'room')).lower()
    export_format = str(request.query_params.get('export_format', 'excel')).lower()
    equipment_id = request.query_params.get('equipment_id')

    if report_type not in VALID_REPORT_TYPES:
        return Response({'error': 'Invalid report_type'}, status=status.HTTP_400_BAD_REQUEST)

    if export_format not in VALID_FORMATS:
        return Response({'error': 'Invalid format'}, status=status.HTTP_400_BAD_REQUEST)

    queryset = _booking_scope_for_user(request.user)
    queryset = _apply_filters(queryset, request).order_by('-date', '-created_at')

    headers, rows = _build_report_rows(report_type, queryset, equipment_id=equipment_id)
    timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
    filename = f'{report_type}_report_{timestamp}'

    if export_format == 'excel':
        return _csv_response(headers, rows, filename)

    return _simple_pdf_response(headers, rows, filename)
