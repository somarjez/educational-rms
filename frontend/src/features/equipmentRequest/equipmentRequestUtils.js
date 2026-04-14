export const EQUIPMENT_REQUEST_PREFIX = '[EQUIPMENT_REQUEST]';

export const isEquipmentRequestBooking = (booking) =>
  String(booking?.purpose || '').startsWith(EQUIPMENT_REQUEST_PREFIX);

export const buildEquipmentRequestPayload = ({
  roomId,
  timeSlotId,
  date,
  purpose,
  equipment,
  quantity,
  remarks,
  userId,
}) => {
  const normalizedQuantity = Number(quantity || 0);
  const safePurpose = String(purpose || '').trim();
  const safeRemarks = String(remarks || '').trim();

  const requestMeta = [
    `equipment_id=${equipment?.id}`,
    `equipment_name=${equipment?.name || 'Unknown'}`,
    `quantity=${normalizedQuantity}`,
    safeRemarks ? `remarks=${safeRemarks}` : null,
  ]
    .filter(Boolean)
    .join(' | ');

  return {
    room: Number(roomId),
    time_slot: Number(timeSlotId),
    date,
    purpose: `${EQUIPMENT_REQUEST_PREFIX} ${safePurpose}`,
    participants_count: 1,
    notes: requestMeta,
    user: userId,
    is_recurring: false,
  };
};

export const extractEquipmentRequestDetails = (booking) => {
  const notes = String(booking?.notes || '');
  const map = {};

  notes.split('|').forEach((part) => {
    const [rawKey, ...rest] = part.trim().split('=');
    if (!rawKey || rest.length === 0) return;
    map[rawKey.trim()] = rest.join('=').trim();
  });

  return {
    equipmentId: map.equipment_id || '',
    equipmentName: map.equipment_name || 'N/A',
    quantity: map.quantity || 'N/A',
    remarks: map.remarks || '',
  };
};
