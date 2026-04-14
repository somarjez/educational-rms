import React, { useEffect, useMemo, useState } from 'react';
import { getBookings } from '../../services/schedulingApi';
import './LandingPages.css';

const toList = (data) => (Array.isArray(data) ? data : data?.results || []);

const NotificationsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const data = await getBookings();
        setBookings(toList(data));
        setError('');
      } catch (err) {
        setBookings([]);
        setError('Failed to load notifications.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const notifications = useMemo(() => {
    const items = [];

    bookings
      .filter((item) => String(item.status).toUpperCase() === 'PENDING')
      .slice(0, 5)
      .forEach((item) => {
        items.push({
          id: `pending-${item.id}`,
          title: 'Booking Pending Approval',
          message: `Booking for ${item.room_name || item.room?.name || 'resource'} is still pending.`,
          status: 'PENDING',
        });
      });

    bookings
      .filter((item) => ['CONFIRMED', 'APPROVED'].includes(String(item.status).toUpperCase()))
      .slice(0, 5)
      .forEach((item) => {
        items.push({
          id: `confirmed-${item.id}`,
          title: 'Booking Confirmed',
          message: `Booking for ${item.room_name || item.room?.name || 'resource'} is confirmed.`,
          status: 'CONFIRMED',
        });
      });

    return items.slice(0, 8);
  }, [bookings]);

  return (
    <div className="landing-page">
      <div className="landing-header">
        <div>
          <h1 className="landing-title">Notifications</h1>
          <p className="landing-subtitle">Recent booking updates and reminders.</p>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Loading notifications...</div>
      ) : error ? (
        <div className="empty-state">{error}</div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">No notifications yet.</div>
      ) : (
        <div className="landing-list">
          <div className="landing-list-header">
            <span>Type</span>
            <span>Message</span>
            <span>Status</span>
            <span>Section</span>
          </div>
          {notifications.map((item) => (
            <div key={item.id} className="landing-list-item">
              <span>{item.title}</span>
              <span>{item.message}</span>
              <span>
                <span className={String(item.status).toUpperCase() === 'PENDING' ? 'status-pill status-pending' : 'status-pill status-confirmed'}>
                  {item.status}
                </span>
              </span>
              <span>Bookings</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
