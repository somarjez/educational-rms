import React from 'react';
import './FeatureLanding.css';

const ApprovalLanding = () => {
  return (
    <div className="feature-landing">
      <div className="feature-header">
        <div className="feature-title-section">
          <h1>✅ Booking Approval</h1>
          <p className="feature-subtitle">Manage pending booking requests with approval or rejection</p>
        </div>
        <button className="btn btn-primary" onClick={() => window.location.href = '/admin-scheduling?tab=bookings&filter=pending'}>
          View Pending Requests
        </button>
      </div>

      <div className="feature-stats">
        <div className="info-card">
          <h3>How It Works</h3>
          <ol>
            <li>Users submit booking requests that are initially in PENDING status</li>
            <li>Admins review the requests for conflicts and resource availability</li>
            <li>Click "Approve" to confirm the booking or "Reject" to decline</li>
            <li>Users receive notifications about the approval status</li>
          </ol>
        </div>
      </div>

      <div className="feature-info">
        <h3>Approval Features</h3>
        <div className="feature-grid">
          <div className="feature-item">
            <h4>🔍 Review Requests</h4>
            <p>See all pending bookings in one place</p>
          </div>
          <div className="feature-item">
            <h4>✅ Quick Approve</h4>
            <p>One-click approval for validated bookings</p>
          </div>
          <div className="feature-item">
            <h4>❌ Reject with Reason</h4>
            <p>Decline requests and provide feedback</p>
          </div>
          <div className="feature-item">
            <h4>📧 Notifications</h4>
            <p>Users are notified of approval decisions</p>
          </div>
        </div>
      </div>

      <div className="tips-section">
        <h3>💡 Approval Workflow</h3>
        <ul>
          <li>Check room availability before approving</li>
          <li>Verify equipment requirements are met</li>
          <li>Consider user role and permissions</li>
          <li>Document rejection reasons for rejected requests</li>
          <li>Process approvals promptly to maintain user satisfaction</li>
        </ul>
      </div>

      <button className="btn btn-large btn-primary" onClick={() => window.location.href = '/admin-scheduling?tab=bookings'}>
        Go to Booking Management
      </button>
    </div>
  );
};

export default ApprovalLanding;
