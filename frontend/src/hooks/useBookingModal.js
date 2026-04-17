import { useState } from 'react';

const useBookingModal = () => {
  const [showCreateBooking, setShowCreateBooking] = useState(false);

  const openModal = () => setShowCreateBooking(true);
  const closeModal = () => setShowCreateBooking(false);

  return {
    showCreateBooking,
    openModal,
    closeModal
  };
};

export default useBookingModal;
