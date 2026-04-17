/**
 * Custom Hook for Equipment Configuration
 * 
 * Provides reusable logic for managing equipment-room relationships
 * including fetching, updating, and error handling
 */

import { useState, useCallback } from 'react';
import axios from 'axios';

const useEquipmentConfig = (baseURL = 'http://localhost:8000/api/scheduling') => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Clear messages
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  // Configure equipment for a room
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
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [baseURL, clearMessages]
  );

  // Add single equipment to room
  const addEquipmentToRoom = useCallback(
    async (roomId, equipmentId) => {
      try {
        setLoading(true);
        clearMessages();
        const response = await axios.post(
          `${baseURL}/equipment-config/add_equipment/`,
          {
            room_id: roomId,
            equipment_id: equipmentId,
          }
        );
        setSuccess(response.data.message);
        return response.data;
      } catch (err) {
        const errorMsg =
          err.response?.data?.error || err.message || 'Failed to add equipment';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [baseURL, clearMessages]
  );

  // Remove equipment from room
  const removeEquipmentFromRoom = useCallback(
    async (roomId, equipmentId) => {
      try {
        setLoading(true);
        clearMessages();
        const response = await axios.post(
          `${baseURL}/equipment-config/remove_equipment/`,
          {
            room_id: roomId,
            equipment_id: equipmentId,
          }
        );
        setSuccess(response.data.message);
        return response.data;
      } catch (err) {
        const errorMsg =
          err.response?.data?.error || err.message || 'Failed to remove equipment';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [baseURL, clearMessages]
  );

  // Get room equipment details
  const getRoomEquipment = useCallback(
    async (roomId) => {
      try {
        setLoading(true);
        clearMessages();
        const response = await axios.get(
          `${baseURL}/equipment-config/get_room_equipment/?room_id=${roomId}`
        );
        return response.data;
      } catch (err) {
        const errorMsg =
          err.response?.data?.error || err.message || 'Failed to fetch room equipment';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [baseURL, clearMessages]
  );

  // Get unlinked equipment for a room
  const getUnlinkedEquipment = useCallback(
    async (roomId) => {
      try {
        setLoading(true);
        clearMessages();
        const response = await axios.get(
          `${baseURL}/equipment-config/get_unlinked_equipment/?room_id=${roomId}`
        );
        return Array.isArray(response.data) ? response.data : response.data.results || [];
      } catch (err) {
        const errorMsg =
          err.response?.data?.error || err.message || 'Failed to fetch unlinked equipment';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [baseURL, clearMessages]
  );

  // Get equipment distribution
  const getEquipmentDistribution = useCallback(async () => {
    try {
      setLoading(true);
      clearMessages();
      const response = await axios.get(
        `${baseURL}/equipment-config/equipment_distribution/`
      );
      return Array.isArray(response.data) ? response.data : response.data.results || [];
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || err.message || 'Failed to fetch equipment distribution';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [baseURL, clearMessages]);

  // Get room-equipment matrix
  const getRoomEquipmentMatrix = useCallback(async () => {
    try {
      setLoading(true);
      clearMessages();
      const response = await axios.get(
        `${baseURL}/equipment-config/room_equipment_matrix/`
      );
      return response.data;
    } catch (err) {
      const errorMsg =
        err.response?.data?.error || err.message || 'Failed to fetch matrix data';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [baseURL, clearMessages]);

  // Bulk update equipment
  const bulkUpdateEquipment = useCallback(
    async (updates) => {
      try {
        setLoading(true);
        clearMessages();
        const response = await axios.post(
          `${baseURL}/equipment-config/bulk_update/`,
          { updates }
        );
        setSuccess(`Successfully updated ${response.data.total_updated} rooms`);
        return response.data;
      } catch (err) {
        const errorMsg =
          err.response?.data?.error || err.message || 'Failed to bulk update equipment';
        setError(errorMsg);
        throw err;
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
    clearMessages,
    configureRoomEquipment,
    addEquipmentToRoom,
    removeEquipmentFromRoom,
    getRoomEquipment,
    getUnlinkedEquipment,
    getEquipmentDistribution,
    getRoomEquipmentMatrix,
    bulkUpdateEquipment,
  };
};

export default useEquipmentConfig;
