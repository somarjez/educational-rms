import React from 'react';
import './FeatureLanding.css';

const RecurringLanding = () => {
  return (
    <div className="feature-landing">
      <div className="feature-header">
        <div className="feature-title-section">
          <h1>🔄 Recurring Bookings</h1>
          <p className="feature-subtitle">Manage bookings that repeat on a regular schedule</p>
        </div>
        <button className="btn btn-primary" onClick={() => window.location.href = '/admin-scheduling?tab=bookings&recurring=true'}>
          View Recurring Bookings
        </button>
      </div>

      <div className="feature-stats">
        <div className="info-card">
          <h3>What Are Recurring Bookings?</h3>
          <p>Recurring bookings allow you to schedule resources for regular, repeating patterns such as weekly classes, daily lab sessions, or monthly meetings without creating individual bookings each time.</p>
        </div>
      </div>

      <div className="feature-info">
        <h3>Recurring Patterns</h3>
        <div className="feature-grid">
          <div className="feature-item">
            <h4>📅 Daily</h4>
            <p>Schedule bookings that repeat every day</p>
          </div>
          <div className="feature-item">
            <h4>📆 Weekly</h4>
            <p>Repeat on the same day(s) each week</p>
          </div>
          <div className="feature-item">
            <h4>📊 Bi-weekly</h4>
            <p>Repeat every two weeks</p>
          </div>
          <div className="feature-item">
            <h4>📈 Monthly</h4>
            <p>Repeat on the same date each month</p>
          </div>
        </div>
      </div>

      <div className="tips-section">
        <h3>💡 Managing Recurring Bookings</h3>
        <ul>
          <li><strong>Set Duration:</strong> Define when the recurring pattern should start and end</li>
          <li><strong>Edit All or One:</strong> Modify all instances or individual occurrences</li>
          <li><strong>Cancel Series:</strong> Remove an entire recurring booking series at once</li>
          <li><strong>Exceptions:</strong> Make changes to specific dates in a recurring series</li>
          <li><strong>Conflict Detection:</strong> System warns of conflicts when creating recurring bookings</li>
        </ul>
      </div>

      <div className="feature-example">
        <h3>Example: Weekly Lab Classes</h3>
        <div className="example-box">
          <p><strong>Scenario:</strong> Computer Lab needs to be booked for classes every Monday and Wednesday, 10 AM - 12 PM for the entire semester</p>
          <p><strong>Solution:</strong> Create one recurring booking with:</p>
          <ul>
            <li>Pattern: Weekly on Monday and Wednesday</li>
            <li>Time: 10:00 AM - 12:00 PM</li>
            <li>Start Date: First day of semester</li>
            <li>End Date: Last day of semester</li>
          </ul>
          <p><strong>Result:</strong> All instances are automatically created and managed as a single booking</p>
        </div>
      </div>

      <button className="btn btn-large btn-primary" onClick={() => window.location.href = '/admin-scheduling?tab=bookings'}>
        Go to Booking Management
      </button>
    </div>
  );
};

export default RecurringLanding;
