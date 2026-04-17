import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './FeatureLanding.css';

const CalendarLanding = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [currentView, setCurrentView] = useState('month');

  useEffect(() => {
    fetchCalendarStats();
  }, []);

  const fetchCalendarStats = async () => {
    try {
      const response = await api.get('/scheduling/bookings/');
      // Handle paginated responses
      const bookingsData = Array.isArray(response.data) ? response.data : (response.data.results || []);
      
      setStats({
        totalBookings: bookingsData.length,
        todayBookings: bookingsData.filter(b => 
          new Date(b.booking_date).toDateString() === new Date().toDateString()
        ).length,
        upcomingBookings: bookingsData.filter(b => 
          new Date(b.booking_date) >= new Date()
        ).length,
      });
      setError(null);
    } catch (err) {
      setError('Failed to load calendar data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="feature-landing loading">Loading calendar...</div>;

  return (
    <div className="feature-landing">
      <div className="feature-header">
        <div className="feature-title-section">
          <h1>📆 Calendar & Scheduling</h1>
          <p className="feature-subtitle">View schedules in day, week, or month view • Drag-and-drop scheduling</p>
        </div>
        <div className="view-controls">
          {['day', 'week', 'month'].map(view => (
            <button
              key={view}
              className={`btn ${currentView === view ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCurrentView(view)}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)} View
            </button>
          ))}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="feature-stats">
        <div className="stat-card">
          <div className="stat-number">{stats.totalBookings}</div>
          <div className="stat-label">Total Bookings</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.todayBookings}</div>
          <div className="stat-label">Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.upcomingBookings}</div>
          <div className="stat-label">Upcoming</div>
        </div>
      </div>

      <div className="calendar-container">
        <div className="calendar-placeholder">
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📅</div>
          <h3>{currentView.charAt(0).toUpperCase() + currentView.slice(1)} View</h3>
          <p>Interactive calendar with drag-and-drop scheduling</p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.href = '/admin-scheduling?tab=calendar'}
          >
            Open Full Calendar
          </button>
        </div>
      </div>

      <div className="feature-info">
        <h3>Calendar Features</h3>
        <div className="feature-grid">
          <div className="feature-item">
            <h4>📅 Day View</h4>
            <p>See all bookings for a specific day with hourly slots</p>
          </div>
          <div className="feature-item">
            <h4>📊 Week View</h4>
            <p>Overview of bookings across a 7-day period</p>
          </div>
          <div className="feature-item">
            <h4>🗓️ Month View</h4>
            <p>High-level overview of the entire month</p>
          </div>
          <div className="feature-item">
            <h4>🖱️ Drag & Drop</h4>
            <p>Click and drag to reschedule bookings directly on the calendar</p>
          </div>
        </div>
      </div>

      <div className="tips-section">
        <h3>💡 Quick Tips</h3>
        <ul>
          <li>Click on a time slot to create a new booking</li>
          <li>Drag existing events to reschedule them</li>
          <li>Use the navigation arrows to move between dates</li>
          <li>Color coding shows different booking statuses</li>
        </ul>
      </div>
    </div>
  );
};

export default CalendarLanding;
