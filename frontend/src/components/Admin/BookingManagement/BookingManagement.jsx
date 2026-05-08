import React, { useState, useEffect } from 'react';
import { FiCalendar, FiPlus } from 'react-icons/fi';
import {
  getBookings, approveBooking, rejectBooking, cancelBooking,
  overrideConflict, bulkCancelBookings, bulkDeleteBookings, deleteBooking,
  modifyBooking, getRooms, getTimeSlots
} from '../../../services/schedulingApi';
import QuickCreateBooking from '../../../features/dashboard/QuickCreateBooking';
import PromptModal from '../../Common/Modal/PromptModal';
import ConfirmModal from '../../Common/Modal/ConfirmModal';
import AlertModal from '../../Common/Modal/AlertModal';
import './styles/BookingManagement.css';

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(15);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [showCreateBooking, setShowCreateBooking] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [roomOptions, setRoomOptions] = useState([]);
  const [timeSlotOptions, setTimeSlotOptions] = useState([]);
  const [modifyingBooking, setModifyingBooking] = useState(null);
  const [modifyForm, setModifyForm] = useState({
    room: '',
    time_slot: '',
    date: '',
    purpose: '',
    participants_count: 1,
    priority: 'MEDIUM',
    change_reason: ''
  });
  
  // Modal states
  const [promptModal, setPromptModal] = useState({ isOpen: false, title: '', label: '', placeholder: '', onConfirm: null });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, isDangerous: false });
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  
  const [filters, setFilters] = useState({
    status: '',
    room_id: '',
    start_date: '',
    end_date: '',
    is_recurring: ''
  });

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Declined' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'COMPLETED', label: 'Completed' }
  ];

  const priorityBadge = {
    LOW: 'badge-low',
    MEDIUM: 'badge-medium',
    HIGH: 'badge-high',
    URGENT: 'badge-urgent'
  };

  const getStatusLabel = (status) => {
    if (status === 'REJECTED') return 'DECLINED';
    return status;
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    fetchBookings();
  }, [filters, currentPage]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.room_id) params.room_id = filters.room_id;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.is_recurring) params.is_recurring = filters.is_recurring;

      params.page = currentPage;
      params.page_size = pageSize;
      const response = await getBookings(params);

      if (response && Array.isArray(response.results)) {
        setBookings(response.results);
        setTotalBookings(Number(response.count || 0));
        setTotalPages(Math.max(1, Math.ceil(Number(response.count || 0) / pageSize)));
      } else if (Array.isArray(response)) {
        setBookings(response);
        setTotalBookings(response.length);
        setTotalPages(1);
      } else {
        const items = response ? [response] : [];
        setBookings(items);
        setTotalBookings(items.length);
        setTotalPages(1);
      }

      setSelectedBookings([]);
      setError(null);
    } catch (err) {
      setError('Failed to fetch bookings');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const fetchModifyOptions = async () => {
    try {
      const [roomsResponse, timeSlotsResponse] = await Promise.all([
        getRooms({ is_active: true }),
        getTimeSlots({ is_active: true })
      ]);

      const normalizedRooms = Array.isArray(roomsResponse?.results)
        ? roomsResponse.results
        : (Array.isArray(roomsResponse) ? roomsResponse : []);
      const normalizedTimeSlots = Array.isArray(timeSlotsResponse?.results)
        ? timeSlotsResponse.results
        : (Array.isArray(timeSlotsResponse) ? timeSlotsResponse : []);

      setRoomOptions(normalizedRooms);
      setTimeSlotOptions(normalizedTimeSlots);
    } catch (err) {
      console.error('Error loading modify options:', err);
      setError('Failed to load room/time slot options');
    }
  };

  const openModifyModal = async (booking) => {
    setModifyingBooking(booking);
    setModifyForm({
      room: booking.room || '',
      time_slot: booking.time_slot || '',
      date: booking.date || '',
      purpose: booking.purpose || '',
      participants_count: booking.participants_count || 1,
      priority: booking.priority || 'MEDIUM',
      change_reason: ''
    });

    if (roomOptions.length === 0 || timeSlotOptions.length === 0) {
      await fetchModifyOptions();
    }

    setShowModifyModal(true);
  };

  const handleModifyFieldChange = (e) => {
    const { name, value } = e.target;
    setModifyForm((prev) => ({
      ...prev,
      [name]: name === 'participants_count' ? Number(value) : value
    }));
  };

  const handleModifySubmit = async () => {
    if (!modifyingBooking) return;

    if (!modifyForm.room || !modifyForm.time_slot || !modifyForm.date || !modifyForm.purpose.trim()) {
      setAlertModal({
        isOpen: true,
        title: 'Missing Fields',
        message: 'Room, time slot, date, and purpose are required for modification.',
        type: 'warning'
      });
      return;
    }

    try {
      await modifyBooking(modifyingBooking.id, {
        room: Number(modifyForm.room),
        time_slot: Number(modifyForm.time_slot),
        date: modifyForm.date,
        purpose: modifyForm.purpose,
        participants_count: Number(modifyForm.participants_count),
        priority: modifyForm.priority,
        change_reason: modifyForm.change_reason || ''
      });

      setShowModifyModal(false);
      setModifyingBooking(null);
      setSuccess('Booking modified successfully');
      fetchBookings();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.response?.data?.error;
      setError(detail || 'Failed to modify booking');
      console.error('Error modifying booking:', err);
    }
  };

  const handleApprove = async (bookingId) => {
    try {
      await approveBooking(bookingId);
      setSuccess('Booking approved successfully');
      fetchBookings();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to approve booking');
      console.error('Error approving booking:', err);
    }
  };

  const handleReject = async (bookingId) => {
    setPromptModal({
      isOpen: true,
      title: 'Reject Booking',
      label: 'Reason for rejection (optional)',
      placeholder: 'Enter rejection reason...',
      onConfirm: (notes) => rejectBookingWithNotes(bookingId, notes)
    });
  };

  const rejectBookingWithNotes = async (bookingId, notes) => {
    try {
      await rejectBooking(bookingId, notes || '');
      setSuccess('Booking rejected');
      setPromptModal({ ...promptModal, isOpen: false });
      fetchBookings();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to reject booking');
      console.error('Error rejecting booking:', err);
    }
  };

  const handleCancel = async (bookingId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Cancel Booking',
      message: 'Are you sure you want to cancel this booking? You will be asked to provide a reason.',
      isDangerous: false,
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setPromptModal({
          isOpen: true,
          title: 'Cancel Booking',
          label: 'Reason for cancellation (optional)',
          placeholder: 'Enter cancellation reason...',
          onConfirm: (notes) => cancelBookingWithNotes(bookingId, notes)
        });
      }
    });
  };

  const cancelBookingWithNotes = async (bookingId, notes) => {
    try {
      await cancelBooking(bookingId, { notes: notes || '' });
      setSuccess('Booking cancelled');
      setPromptModal(prev => ({ ...prev, isOpen: false }));
      fetchBookings();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to cancel booking');
      console.error('Error cancelling booking:', err);
    }
  };

  const handleDelete = async (bookingId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Booking',
      message: 'Delete this cancelled booking permanently? This cannot be undone.',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await deleteBooking(bookingId);
          setSuccess('Booking deleted');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          fetchBookings();
          setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
          setError('Failed to delete booking');
          console.error('Error deleting booking:', err);
        }
      }
    });
  };

  const openOverrideModal = (booking) => {
    setCurrentBooking(booking);
    setOverrideReason('');
    setShowOverrideModal(true);
  };

  const handleOverrideSubmit = async () => {
    if (!overrideReason.trim()) {
      setAlertModal({
        isOpen: true,
        title: 'Required Field',
        message: 'Please provide a reason for the override',
        type: 'warning'
      });
      return;
    }

    try {
      await overrideConflict(currentBooking.id, overrideReason);
      setShowOverrideModal(false);
      setSuccess('Conflict override applied');
      fetchBookings();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to override conflict');
      console.error('Error overriding conflict:', err);
    }
  };

  const handleBulkCancel = async () => {
    if (selectedBookings.length === 0) {
      setAlertModal({
        isOpen: true,
        title: 'No Selection',
        message: 'Please select bookings to cancel',
        type: 'warning'
      });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Bulk Cancel Bookings',
      message: `Cancel ${selectedBookings.length} selected bookings? You will be asked to provide a reason.`,
      isDangerous: false,
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setPromptModal({
          isOpen: true,
          title: 'Bulk Cancellation',
          label: 'Reason for bulk cancellation',
          placeholder: 'Enter bulk cancellation reason...',
          onConfirm: (notes) => bulkCancelWithNotes(notes)
        });
      }
    });
  };

  const bulkCancelWithNotes = async (notes) => {
    try {
      await bulkCancelBookings(selectedBookings, notes || 'Bulk cancelled by admin');
      setSuccess(`${selectedBookings.length} bookings cancelled`);
      setPromptModal(prev => ({ ...prev, isOpen: false }));
      setSelectedBookings([]);
      fetchBookings();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to bulk cancel bookings');
      console.error('Error bulk cancelling:', err);
    }
  };

  const handleBulkDelete = async () => {
    const cancelledBookings = selectedBookings.filter(id => {
      const booking = bookings.find(b => b.id === id);
      return booking && booking.status === 'CANCELLED';
    });

    if (cancelledBookings.length === 0) {
      setAlertModal({
        isOpen: true,
        title: 'No Cancelled Bookings',
        message: 'Please select only cancelled bookings to delete',
        type: 'warning'
      });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Bulk Delete Cancelled Bookings',
      message: `Permanently delete ${cancelledBookings.length} selected cancelled bookings? This cannot be undone.`,
      isDangerous: true,
      onConfirm: async () => {
        try {
          await bulkDeleteBookings(cancelledBookings);
          setSuccess(`${cancelledBookings.length} bookings deleted`);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          setSelectedBookings([]);
          fetchBookings();
          setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
          setError('Failed to bulk delete bookings');
          console.error('Error bulk deleting:', err);
        }
      }
    });
  };

  const toggleBookingSelection = (bookingId) => {
    setSelectedBookings(prev => {
      if (prev.includes(bookingId)) {
        return prev.filter(id => id !== bookingId);
      } else {
        return [...prev, bookingId];
      }
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString.substring(0, 5);
  };

  const statusCounts = {
    PENDING: bookings.filter(b => b.status === 'PENDING').length,
    APPROVED: bookings.filter(b => b.status === 'APPROVED').length,
    CONFIRMED: bookings.filter(b => b.status === 'CONFIRMED').length,
    COMPLETED: bookings.filter(b => b.status === 'COMPLETED').length,
    CANCELLED: bookings.filter(b => b.status === 'CANCELLED').length,
    REJECTED: bookings.filter(b => b.status === 'REJECTED').length
  };

  return (
    <div className="booking-management">
      <div className="booking-management-header">
        <h2>Booking Management</h2>
        <div className="header-actions">
          <button className="btn btn-sm btn-primary" type="button" disabled>
            Active Bookings
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateBooking(true)}
          >
            <FiPlus /> New Booking
          </button>
          {selectedBookings.length > 0 && (
            <>
              <button
                className="btn btn-danger"
                onClick={handleBulkCancel}
              >
                Cancel Selected ({selectedBookings.length})
              </button>
              <button
                className="btn btn-danger"
                style={{ backgroundColor: '#d32f2f', borderColor: '#d32f2f' }}
                onClick={handleBulkDelete}
              >
                Delete Selected ({selectedBookings.length})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Booking Statistics Summary */}
      {!loading && (
        <div className="booking-stats">
          <div className="stat-box">
            <div className="stat-content">
              <div className="stat-label">BOOKINGS</div>
              <div className="stat-value">{totalBookings}</div>
              <div className="stat-caption">Total all bookings</div>
            </div>
          </div>
          <div className="stat-breakdown">
            <div className="breakdown-item pending">
              <span className="breakdown-label">PENDING</span>
              <span className="breakdown-value">{statusCounts.PENDING}</span>
            </div>
            <div className="breakdown-item approved">
              <span className="breakdown-label">APPROVED</span>
                <span className="breakdown-value">{statusCounts.APPROVED}</span>
              </div>
              <div className="breakdown-item confirmed">
                <span className="breakdown-label">CONFIRMED</span>
                <span className="breakdown-value">{statusCounts.CONFIRMED}</span>
              </div>
              <div className="breakdown-item completed">
                <span className="breakdown-label">COMPLETED</span>
                <span className="breakdown-value">{statusCounts.COMPLETED}</span>
              </div>
              <div className="breakdown-item cancelled">
                <span className="breakdown-label">CANCELLED</span>
                <span className="breakdown-value">{statusCounts.CANCELLED}</span>
              </div>
              <div className="breakdown-item rejected">
                <span className="breakdown-label">DECLINED</span>
                <span className="breakdown-value">{statusCounts.REJECTED}</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            {error}
            <button onClick={() => setError(null)} className="alert-close">x</button>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
            <button onClick={() => setSuccess(null)} className="alert-close">x</button>
          </div>
        )}

        <div className="filters">
          <div className="filter-field">
            <label className="filter-field-label" htmlFor="booking-status">Status</label>
            <select
              id="booking-status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="filter-select"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label className="filter-field-label" htmlFor="start_date">Start Date</label>
            <input
              id="start_date"
              type="date"
              name="start_date"
              value={filters.start_date}
              onChange={handleFilterChange}
              className="filter-input"
            />
          </div>

          <div className="filter-field">
            <label className="filter-field-label" htmlFor="end_date">End Date</label>
            <input
              id="end_date"
              type="date"
              name="end_date"
              value={filters.end_date}
              onChange={handleFilterChange}
              className="filter-input"
            />
          </div>

          <div className="filter-field">
            <label className="filter-field-label" htmlFor="booking-type">Booking Type</label>
            <select
              id="booking-type"
              name="is_recurring"
              value={filters.is_recurring}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Availability</option>
              <option value="true">Recurring Only</option>
              <option value="false">One-time Only</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading bookings...</div>
        ) : (
          <>
            <div className="table-container">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBookings(bookings.map(b => b.id));
                          } else {
                            setSelectedBookings([]);
                          }
                        }}
                        checked={selectedBookings.length === bookings.length && bookings.length > 0}
                      />
                    </th>
                    <th>Room</th>
                    <th>User</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Purpose</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Participant</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr className="empty-table-row">
                      <td colSpan="10">
                        <div className="table-empty-message">No bookings found</div>
                      </td>
                    </tr>
                  ) : bookings.map(booking => (
                    <tr key={booking.id} className={selectedBookings.includes(booking.id) ? 'selected' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedBookings.includes(booking.id)}
                          onChange={() => toggleBookingSelection(booking.id)}
                        />
                      </td>
                      <td>
                        <strong>{booking.room_name}</strong>
                        {booking.is_recurring && !booking.parent_booking && (
                          <span className="badge badge-info ml-1" title="This is a recurring booking - approval will apply to all instances">
                            Recurring Series
                          </span>
                        )}
                        {booking.is_recurring && booking.parent_booking && (
                          <span className="badge badge-light ml-1" title="This is an instance of a recurring booking">
                            Recurring Instance
                          </span>
                        )}
                      </td>
                      <td>{booking.user_name || booking.user_email}</td>
                      <td>
                        {booking.is_recurring && !booking.parent_booking && booking.recurrence_end_date ? (
                          <>
                            {formatDate(booking.date)} - {formatDate(booking.recurrence_end_date)}
                            <br />
                            <small style={{ color: '#666' }}>
                              {booking.recurrence_pattern === 'DAILY' && 'Daily'}
                              {booking.recurrence_pattern === 'WEEKLY' && 'Weekly'}
                              {booking.recurrence_pattern === 'BIWEEKLY' && 'Bi-weekly'}
                              {booking.recurrence_pattern === 'MONTHLY' && 'Monthly'}
                            </small>
                          </>
                        ) : (
                          formatDate(booking.date)
                        )}
                      </td>
                      <td>
                        {booking.time_slot_details &&
                          `${formatTime(booking.time_slot_details.start_time)} - ${formatTime(booking.time_slot_details.end_time)}`
                        }
                      </td>
                      <td className="purpose-cell">{booking.purpose}</td>
                      <td>
                        <span className={`badge badge-${booking.status.toLowerCase()}`}>
                          {getStatusLabel(booking.status)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${priorityBadge[booking.priority]}`}>
                          {booking.priority}
                        </span>
                      </td>
                      <td>{booking.participants_count}</td>
                      <td>
                        <div className="action-buttons">
                          {booking.status === 'PENDING' && (
                            <>
                              <div className="approval-actions">
                                <button
                                  className="btn btn-sm btn-success btn-approve-text"
                                  onClick={() => handleApprove(booking.id)}
                                  aria-label="Approve booking"
                                >
                                  Accept
                                </button>
                                <button
                                  className="btn btn-sm btn-danger btn-decline-text"
                                  onClick={() => handleReject(booking.id)}
                                  aria-label="Reject booking"
                                >
                                  Decline
                                </button>
                              </div>
                              <button
                                className="btn btn-sm btn-warning"
                                onClick={() => handleCancel(booking.id)}
                                aria-label="Cancel booking"
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {['APPROVED', 'CONFIRMED'].includes(booking.status) && (
                            <>
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => openModifyModal(booking)}
                                aria-label="Modify booking"
                              >
                                Modify
                              </button>
                              {!booking.conflict_override && (
                                <button
                                  className="btn btn-sm btn-secondary btn-override"
                                  onClick={() => openOverrideModal(booking)}
                                  aria-label="Override conflict"
                                >
                                  Override
                                </button>
                              )}
                              <button
                                className="btn btn-sm btn-warning"
                                onClick={() => handleCancel(booking.id)}
                                aria-label="Cancel booking"
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {booking.status === 'CANCELLED' && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(booking.id)}
                              aria-label="Delete booking"
                            >
                              Delete
                            </button>
                          )}

                          {!['PENDING', 'APPROVED', 'CONFIRMED'].includes(booking.status) && !booking.conflict_override && (
                            <button
                              className="btn btn-sm btn-secondary btn-override"
                              onClick={() => openOverrideModal(booking)}
                              aria-label="Override conflict"
                            >
                              Override
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination-controls">
              <div className="pagination-summary">
                Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalBookings)} of {totalBookings}
              </div>
              <div className="pagination-buttons">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="page-indicator">Page {currentPage} of {totalPages}</span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}

      {/* Override Modal */}
      {showOverrideModal && (
        <div className="modal-overlay" onClick={() => setShowOverrideModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Override Conflict Detection</h3>
              <button className="modal-close" onClick={() => setShowOverrideModal(false)}>x</button>
            </div>

            <div className="modal-body">
              <p>
                <strong>Room:</strong> {currentBooking?.room_name}<br />
                <strong>Date:</strong> {formatDate(currentBooking?.date)}<br />
                <strong>User:</strong> {currentBooking?.user_name}
              </p>

              <div className="form-group">
                <label>Reason for Override *</label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  rows="4"
                  className="form-input"
                  placeholder="Provide a detailed reason for overriding the conflict detection..."
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowOverrideModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleOverrideSubmit}
              >
                Apply Override
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateBooking && (
        <QuickCreateBooking
          onCreated={fetchBookings}
          onClose={() => setShowCreateBooking(false)}
        />
      )}

      {showModifyModal && (
        <div className="modal-overlay" onClick={() => setShowModifyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Modify Booking</h3>
              <button className="modal-close" onClick={() => setShowModifyModal(false)}>x</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Room *</label>
                <select
                  name="room"
                  value={modifyForm.room}
                  onChange={handleModifyFieldChange}
                  className="form-input"
                >
                  <option value="">Select room</option>
                  {roomOptions.map((room) => (
                    <option key={room.id} value={room.id}>{room.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Time Slot *</label>
                <select
                  name="time_slot"
                  value={modifyForm.time_slot}
                  onChange={handleModifyFieldChange}
                  className="form-input"
                >
                  <option value="">Select time slot</option>
                  {timeSlotOptions.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.name || `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  name="date"
                  value={modifyForm.date}
                  onChange={handleModifyFieldChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Purpose *</label>
                <textarea
                  name="purpose"
                  value={modifyForm.purpose}
                  onChange={handleModifyFieldChange}
                  rows="3"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Participants</label>
                <input
                  type="number"
                  min="1"
                  name="participants_count"
                  value={modifyForm.participants_count}
                  onChange={handleModifyFieldChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select
                  name="priority"
                  value={modifyForm.priority}
                  onChange={handleModifyFieldChange}
                  className="form-input"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div className="form-group">
                <label>Change Reason (optional)</label>
                <textarea
                  name="change_reason"
                  value={modifyForm.change_reason}
                  onChange={handleModifyFieldChange}
                  rows="2"
                  className="form-input"
                  placeholder="Document why this booking was changed"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowModifyModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleModifySubmit}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <PromptModal
        isOpen={promptModal.isOpen}
        title={promptModal.title}
        label={promptModal.label}
        placeholder={promptModal.placeholder}
        onConfirm={promptModal.onConfirm}
        onCancel={() => setPromptModal(prev => ({ ...prev, isOpen: false }))}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        isDangerous={confirmModal.isDangerous}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      <AlertModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default BookingManagement;

