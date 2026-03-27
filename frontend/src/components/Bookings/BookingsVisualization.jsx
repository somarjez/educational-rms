import React, { useState, useEffect } from 'react';
import { FiCalendar, FiRefreshCw, FiDownload, FiAlertCircle, FiRepeat } from 'react-icons/fi';
import { getBookings } from '../../services/schedulingApi';
import './styles/BookingsVisualization.css';

const BookingsVisualization = () => {
  const [bookings, setBookings] = useState([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchBookings();
  }, [filterStatus]);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page_size: 100 };
      if (filterStatus) params.status = filterStatus;

      const response = await getBookings(params);
      
      // Handle paginated response
      let allBookings = [];
      let totalCount = 0;
      if (response.results) {
        allBookings = response.results;
        totalCount = Number(response.count || allBookings.length);
      } else if (Array.isArray(response)) {
        allBookings = response;
        totalCount = allBookings.length;
      } else {
        allBookings = response ? [response] : [];
        totalCount = allBookings.length;
      }

      setBookings(allBookings);
      setTotalBookings(totalCount);
    } catch (err) {
      setError('Failed to fetch bookings');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString.substring(0, 5); // "HH:MM:SS" -> "HH:MM"
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'LOW': return '#10b981';
      case 'MEDIUM': return '#f59e0b';
      case 'HIGH': return '#ef4444';
      case 'URGENT': return '#8b0000';
      default: return '#6b7280';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'APPROVED': return 'status-approved';
      case 'PENDING': return 'status-pending';
      case 'REJECTED': return 'status-rejected';
      case 'CANCELLED': return 'status-cancelled';
      default: return 'status-default';
    }
  };

  return (
    <div className="bookings-visualization">
      <div className="viz-header">
        <div className="header-content">
          <h1>
            <FiCalendar /> Bookings Overview
          </h1>
          <p>View and manage all resource bookings</p>
        </div>
        <button className="btn-refresh" onClick={fetchBookings} disabled={loading}>
          <FiRefreshCw /> {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <FiAlertCircle /> {error}
        </div>
      )}

      {/* Status Filter */}
      <div className="filter-section">
        <label>Filter by Status:</label>
        <div className="status-buttons">
          <button
            className={`status-filter-btn ${filterStatus === '' ? 'active' : ''}`}
            onClick={() => setFilterStatus('')}
          >
            All
          </button>
          {['PENDING', 'APPROVED', 'REJECTED', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].map(status => (
            <button
              key={status}
              className={`status-filter-btn ${filterStatus === status ? 'active' : ''}`}
              onClick={() => setFilterStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="summary-stats">
        <div className="stat-card">
          <div className="stat-value">{totalBookings}</div>
          <div className="stat-label">Total Bookings</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{bookings.filter(b => b.participants_count).reduce((sum, b) => sum + b.participants_count, 0)}</div>
          <div className="stat-label">Total Participants</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{bookings.filter(b => b.is_recurring).length}</div>
          <div className="stat-label">Recurring Bookings</div>
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="loading">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="no-data">
          <FiAlertCircle /> No {filterStatus.toLowerCase()} bookings found
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map(booking => (
            <div key={booking.id} className="booking-card">
              <div className="booking-header">
                <div className="booking-course">
                  <span className="course-code">{booking.notes?.split(': ')[1] || booking.purpose || 'N/A'}</span>
                  {booking.is_recurring && (
                    <span className="badge-recurring">
                      <FiRepeat style={{ fontSize: '0.9rem', marginRight: '0.25rem' }} />
                      Recurring
                    </span>
                  )}
                </div>
                <span className={`status-badge ${getStatusBadgeClass(booking.status)}`}>
                  {booking.status}
                </span>
              </div>

              <div className="booking-details">
                <div className="detail-row">
                  <span className="detail-label">Instructor:</span>
                  <span className="detail-value">{booking.user_name || booking.user_email || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date:</span>
                  <span className="detail-value">{formatDate(booking.date)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Time:</span>
                  <span className="detail-value">
                    {booking.time_slot_details 
                      ? `${formatTime(booking.time_slot_details.start_time)} - ${formatTime(booking.time_slot_details.end_time)}` 
                      : 'N/A'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Room:</span>
                  <span className="detail-value">{booking.room_name || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Participants:</span>
                  <span className="detail-value">{booking.participants_count || 0}</span>
                </div>
              </div>

              <div className="booking-footer">
                <div
                  className="priority-indicator"
                  style={{ backgroundColor: getPriorityColor(booking.priority) }}
                  title={`Priority: ${booking.priority}`}
                >
                  {booking.priority}
                </div>
                <button className="btn-view">View Details</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Export Button */}
      <div className="export-section">
        <button className="btn-export">
          <FiDownload /> Export Bookings Report
        </button>
      </div>
    </div>
  );
};

export default BookingsVisualization;

