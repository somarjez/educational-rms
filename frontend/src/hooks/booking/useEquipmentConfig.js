import { useState, useCallback } from 'react';
import axios from 'axios';

const useEquipmentConfig = (baseURL = 'http://localhost:8000/api/scheduling') => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const configureRoomEquipment = useCallback(
    async (roomId, equipmentIds) => {
      try {
        setLoading(true);
        clearMessages();
        const response = await axios.post(
          `${baseURL}/equipment-config/configure_room_equipment/`,
          {
            room_id: roomId,
            equipment_ids: equipmentIds,
          }
        );
        setSuccess(response.data.message);
        return response.data;
      } catch (err) {
        const errorMsg =
          err.response?.data?.error || err.message || 'Failed to configure equipment';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [baseURL, clearMessages]
  );

  return {
    loading,
    error,
    success,
    configureRoomEquipment,
    clearMessages,
  };
};

export default useEquipmentConfig;
