/**
 * Equipment Configuration API Service
 * 
 * Centralized service for all equipment configuration API calls
 * Provides a clean interface for interacting with the backend
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1/scheduling';

const equipmentConfigService = {
  /**
   * Configure all equipment for a room
   * @param {number} roomId - The room ID
   * @param {number[]} equipmentIds - Array of equipment IDs
   * @returns {Promise} Response with configuration details
   */
  configureRoomEquipment: async (roomId, equipmentIds) => {
    const response = await axios.post(
      `${API_BASE_URL}/equipment-config/configure_room_equipment/`,
      {
        room_id: roomId,
        equipment_ids: equipmentIds,
      }
    );
    return response.data;
  },

  /**
   * Add a single equipment item to a room
   * @param {number} roomId - The room ID
   * @param {number} equipmentId - The equipment ID
   * @returns {Promise} Response with added equipment details
   */
  addEquipmentToRoom: async (roomId, equipmentId) => {
    const response = await axios.post(
      `${API_BASE_URL}/equipment-config/add_equipment/`,
      {
        room_id: roomId,
        equipment_id: equipmentId,
      }
    );
    return response.data;
  },

  /**
   * Remove equipment from a room
   * @param {number} roomId - The room ID
   * @param {number} equipmentId - The equipment ID
   * @returns {Promise} Response confirming removal
   */
  removeEquipmentFromRoom: async (roomId, equipmentId) => {
    const response = await axios.post(
      `${API_BASE_URL}/equipment-config/remove_equipment/`,
      {
        room_id: roomId,
        equipment_id: equipmentId,
      }
    );
    return response.data;
  },

  /**
   * Get all equipment linked to a room with summary
   * @param {number} roomId - The room ID
   * @returns {Promise} Room details with equipment and summary
   */
  getRoomEquipment: async (roomId) => {
    const response = await axios.get(
      `${API_BASE_URL}/equipment-config/get_room_equipment/?room_id=${roomId}`
    );
    return response.data;
  },

  /**
   * Get all equipment not yet linked to a room
   * @param {number} roomId - The room ID
   * @returns {Promise} Array of unlinked equipment
   */
  getUnlinkedEquipment: async (roomId) => {
    const response = await axios.get(
      `${API_BASE_URL}/equipment-config/get_unlinked_equipment/?room_id=${roomId}`
    );
    return Array.isArray(response.data) ? response.data : response.data.results || [];
  },

  /**
   * Get distribution of equipment across all rooms
   * @returns {Promise} Array of equipment with room distribution
   */
  getEquipmentDistribution: async () => {
    const response = await axios.get(
      `${API_BASE_URL}/equipment-config/equipment_distribution/`
    );
    return Array.isArray(response.data) ? response.data : response.data.results || [];
  },

  /**
   * Get matrix view of rooms and equipment
   * @returns {Promise} Matrix data with rooms and equipment arrays
   */
  getRoomEquipmentMatrix: async () => {
    const response = await axios.get(
      `${API_BASE_URL}/equipment-config/room_equipment_matrix/`
    );
    return response.data;
  },

  /**
   * Bulk update equipment configuration for multiple rooms
   * @param {Object} updates - Mapping of room IDs to equipment ID arrays
   * @returns {Promise} Update results with success/error information
   */
  bulkUpdateEquipment: async (updates) => {
    const response = await axios.post(
      `${API_BASE_URL}/equipment-config/bulk_update/`,
      { updates }
    );
    return response.data;
  },

  /**
   * Get all rooms (with optional filters)
   * @param {Object} filters - Query filters (optional)
   * @returns {Promise} Array of rooms
   */
  getRooms: async (filters = {}) => {
    const response = await axios.get(`${API_BASE_URL}/rooms/`, { params: filters });
    return response.data.results || response.data || [];
  },

  /**
   * Get all equipment (with optional filters)
   * @param {Object} filters - Query filters (optional)
   * @returns {Promise} Array of equipment
   */
  getEquipment: async (filters = {}) => {
    const response = await axios.get(`${API_BASE_URL}/equipment/`, { params: filters });
    return response.data.results || response.data || [];
  },

  /**
   * Create new equipment
   * @param {Object} equipmentData - Equipment details
   * @returns {Promise} Created equipment
   */
  createEquipment: async (equipmentData) => {
    const response = await axios.post(
      `${API_BASE_URL}/equipment/`,
      equipmentData
    );
    return response.data;
  },

  /**
   * Update equipment
   * @param {number} equipmentId - The equipment ID
   * @param {Object} equipmentData - Equipment details to update
   * @returns {Promise} Updated equipment
   */
  updateEquipment: async (equipmentId, equipmentData) => {
    const response = await axios.patch(
      `${API_BASE_URL}/equipment/${equipmentId}/`,
      equipmentData
    );
    return response.data;
  },

  /**
   * Delete equipment
   * @param {number} equipmentId - The equipment ID
   * @returns {Promise} Deletion confirmation
   */
  deleteEquipment: async (equipmentId) => {
    const response = await axios.delete(
      `${API_BASE_URL}/equipment/${equipmentId}/`
    );
    return response.data;
  },

  /**
   * Create a new room
   * @param {Object} roomData - Room details
   * @returns {Promise} Created room
   */
  createRoom: async (roomData) => {
    const response = await axios.post(
      `${API_BASE_URL}/rooms/`,
      roomData
    );
    return response.data;
  },

  /**
   * Update room
   * @param {number} roomId - The room ID
   * @param {Object} roomData - Room details to update
   * @returns {Promise} Updated room
   */
  updateRoom: async (roomId, roomData) => {
    const response = await axios.patch(
      `${API_BASE_URL}/rooms/${roomId}/`,
      roomData
    );
    return response.data;
  },
};

export default equipmentConfigService;
