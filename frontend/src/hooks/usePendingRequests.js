import { useState } from 'react';

const usePendingRequests = (initialRequests = [], onBookingUpdate) => {
  const [pendingRequests, setPendingRequests] = useState(initialRequests);

  const handleBookingApproved = (bookingId) => {
    setPendingRequests(prev => prev.filter(req => req.id !== bookingId));
    if (onBookingUpdate) onBookingUpdate();
  };

  const handleBookingRejected = (bookingId) => {
    setPendingRequests(prev => prev.filter(req => req.id !== bookingId));
    if (onBookingUpdate) onBookingUpdate();
  };

  return {
    pendingRequests,
    handleBookingApproved,
    handleBookingRejected
  };
};

export default usePendingRequests;
