export const normalizeBookingsResponse = (response) => {
  if (response?.results) {
    return response.results;
  }
  if (Array.isArray(response)) {
    return response;
  }
  return response || [];
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatTime = (timeString) => {
  if (!timeString) {
    return 'N/A';
  }
  return timeString.substring(0, 5);
};

export const getPriorityClass = (priority) => {
  switch (priority) {
    case 'LOW':
      return 'priority-low';
    case 'MEDIUM':
      return 'priority-medium';
    case 'HIGH':
      return 'priority-high';
    case 'URGENT':
      return 'priority-urgent';
    default:
      return 'priority-default';
  }
};

export const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'APPROVED':
      return 'status-approved';
    case 'PENDING':
      return 'status-pending';
    case 'REJECTED':
      return 'status-rejected';
    case 'CANCELLED':
      return 'status-cancelled';
    case 'CONFIRMED':
      return 'status-confirmed';
    case 'COMPLETED':
      return 'status-completed';
    default:
      return 'status-default';
  }
};

export const getCourseCode = (booking) => {
  return booking.notes?.split(': ')[1] || booking.purpose || 'N/A';
};

export const getTotalParticipants = (bookings) => {
  return bookings
    .filter((booking) => booking.participants_count)
    .reduce((sum, booking) => sum + booking.participants_count, 0);
};
