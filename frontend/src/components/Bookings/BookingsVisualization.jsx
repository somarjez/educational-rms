import React, { useEffect, useRef, useState } from 'react';
import { FiCalendar, FiRefreshCw, FiDownload, FiAlertCircle, FiX } from 'react-icons/fi';
import { getBooking, getBookings } from '../../services/schedulingApi';
import { exportElementToPdf } from '../../utils/pdfExport';
import {
  BookingsList,
  BookingsStatusFilter,
  BookingsSummaryStats,
} from './components';
import { normalizeBookingsResponse } from './utils/bookingViewUtils';
import './styles/BookingsVisualization.css';

const BookingsVisualization = () => {
  const exportContainerRef = useRef(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedBookingLoading, setSelectedBookingLoading] = useState(false);
  const [selectedBookingError, setSelectedBookingError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState('');

  useEffect(() => {
    fetchBookings();
  }, [filterStatus]);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;

      const response = await getBookings(params);

      setBookings(normalizeBookingsResponse(response));
    } catch (err) {
      setError('Failed to fetch bookings');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (booking) => {
    setSelectedBooking(booking);
    setSelectedBookingError('');
    setSelectedBookingLoading(true);

    try {
      const bookingDetails = await getBooking(booking.id);
      setSelectedBooking(bookingDetails);
    } catch (err) {
      setSelectedBookingError('Unable to load the full booking details. Showing the summary information available on this page.');
    } finally {
      setSelectedBookingLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedBooking(null);
    setSelectedBookingError('');
    setSelectedBookingLoading(false);
  };

  const handleExport = async () => {
    setExportNotice('');
    setIsExporting(true);

    try {
      await exportElementToPdf({
        element: exportContainerRef.current,
        fileName: `bookings_report_${new Date().toISOString().slice(0, 10)}.pdf`,
      });
      setExportNotice('Bookings report downloaded successfully.');
    } catch (err) {
      setExportNotice('Failed to export bookings report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const selectedBookingDetails = selectedBooking || {};

  const detailRows = [
    { label: 'Booking ID', value: selectedBookingDetails.id ? `#${selectedBookingDetails.id}` : 'N/A' },
    { label: 'Requester', value: selectedBookingDetails.user_name || selectedBookingDetails.user_email || 'N/A' },
    { label: 'Room', value: selectedBookingDetails.room_name || selectedBookingDetails.room_details?.name || 'N/A' },
    { label: 'Date', value: selectedBookingDetails.date || 'N/A' },
    {
      label: 'Time',
      value: selectedBookingDetails.time_slot_details
        ? `${selectedBookingDetails.time_slot_details.start_time} - ${selectedBookingDetails.time_slot_details.end_time}`
        : 'N/A',
    },
    { label: 'Status', value: selectedBookingDetails.status || 'N/A' },
    { label: 'Priority', value: selectedBookingDetails.priority || 'N/A' },
    { label: 'Participants', value: selectedBookingDetails.participants_count ?? 'N/A' },
    { label: 'Recurring', value: selectedBookingDetails.is_recurring ? 'Yes' : 'No' },
    { label: 'Purpose', value: selectedBookingDetails.purpose || 'N/A' },
    { label: 'Notes', value: selectedBookingDetails.notes || 'N/A' },
  ];

  return (
    <div className="bookings-visualization" ref={exportContainerRef}>
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

      <BookingsStatusFilter filterStatus={filterStatus} setFilterStatus={setFilterStatus} />

      <BookingsSummaryStats bookings={bookings} />

      <BookingsList
        loading={loading}
        bookings={bookings}
        filterStatus={filterStatus}
        onViewDetails={handleViewDetails}
      />

      {exportNotice ? <div className="export-notice">{exportNotice}</div> : null}

      {/* Export Button */}
      <div className="export-section">
        <button className="btn-export" onClick={handleExport} disabled={isExporting}>
          <FiDownload /> {isExporting ? 'Exporting...' : 'Export Bookings Report'}
        </button>
      </div>

      {selectedBooking && (
        <div className="modal-overlay" onClick={closeDetails}>
          <div className="modal-content booking-details-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Booking Details</h3>
              <button className="modal-close" onClick={closeDetails} type="button">
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              {selectedBookingLoading ? (
                <div className="loading">Loading booking details...</div>
              ) : (
                <>
                  {selectedBookingError ? <div className="detail-warning">{selectedBookingError}</div> : null}
                  <div className="booking-detail-grid">
                    {detailRows.map((row) => (
                      <div key={row.label} className="booking-detail-item">
                        <span className="booking-detail-label">{row.label}</span>
                        <span className="booking-detail-value">{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="booking-detail-footer">
                    <span className={`status-badge status-${String(selectedBookingDetails.status || 'default').toLowerCase()}`}>
                      {selectedBookingDetails.status || 'UNKNOWN'}
                    </span>
                    {selectedBookingDetails.is_recurring ? (
                      <span className="badge-recurring">Recurring</span>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsVisualization;

