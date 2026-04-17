from apps.scheduling.models import Booking

TARGET_USER_ID = 3
TARGET_MONTHS = [3, 4, 5, 8, 9, 10, 11, 12]
TAG = 'MOCK_DATA_2026_MAR-MAY_AUG-DEC'

print('user_total', Booking.objects.filter(user_id=TARGET_USER_ID).count())
for month in TARGET_MONTHS:
    month_count = Booking.objects.filter(user_id=TARGET_USER_ID, date__year=2026, date__month=month).count()
    print(f'month_{month}', month_count)

print('tagged_total', Booking.objects.filter(user_id=TARGET_USER_ID, notes__startswith=TAG).count())
sample = Booking.objects.filter(user_id=TARGET_USER_ID, notes__startswith=TAG).order_by('-date').first()
if sample:
    print('sample_date', sample.date)
    print('sample_room', sample.room.name)
    print('sample_slot', sample.time_slot.name)
    print('sample_notes', sample.notes)
else:
    print('sample_notes', None)
