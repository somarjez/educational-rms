import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import './styles/StudentPages.css';

const StudentSettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="student-page">
      <div className="student-page-header">
        <div>
          <h1 className="student-page-title">Settings</h1>
          <p className="student-page-subtitle">Student-safe account preferences and profile navigation.</p>
        </div>
      </div>

      <div className="student-page-card student-profile-grid">
        <div className="student-field">
          <p className="student-field-label">Account Name</p>
          <p className="student-field-value">{user?.first_name} {user?.last_name}</p>
        </div>
        <div className="student-field">
          <p className="student-field-label">Username</p>
          <p className="student-field-value">{user?.username || 'N/A'}</p>
        </div>
        <div className="student-field">
          <p className="student-field-label">Email</p>
          <p className="student-field-value">{user?.email || 'N/A'}</p>
        </div>
        <div className="student-field">
          <p className="student-field-label">Role</p>
          <p className="student-field-value">{user?.role || 'STUDENT'}</p>
        </div>
      </div>

      <div className="student-page-card">
        <h2 className="student-page-title" style={{ fontSize: '1.2rem' }}>Profile and Security</h2>
        <p className="student-page-subtitle">
          Manage profile details and related account information from your profile page.
        </p>
        <div className="student-inline-actions" style={{ marginTop: '0.75rem' }}>
          <button className="student-btn" onClick={() => navigate('/student/profile')}>Go to Profile</button>
        </div>
      </div>
    </div>
  );
};

export default StudentSettingsPage;
