import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import './LandingPages.css';

const SettingsPage = () => {
  const { user } = useAuthStore();

  return (
    <div className="landing-page">
      <div className="landing-header">
        <div>
          <h1 className="landing-title">Settings</h1>
          <p className="landing-subtitle">Account and application preferences.</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="settings-card">
          <h3>Account</h3>
          <p>Manage identity and profile details connected to your account.</p>
          <div className="profile-row">
            <span className="profile-label">Name</span>
            <span className="profile-value">{`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'N/A'}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Email</span>
            <span className="profile-value">{user?.email || 'N/A'}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Role</span>
            <span className="profile-value">{user?.role || 'N/A'}</span>
          </div>
        </div>

        <div className="settings-card">
          <h3>Security</h3>
          <p>Password changes and session controls are available from your account endpoints.</p>
          <div className="profile-row">
            <span className="profile-label">Password</span>
            <span className="profile-value">Managed in account security</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Active Session</span>
            <span className="profile-value">Current device session</span>
          </div>
        </div>

        <div className="settings-card">
          <h3>Display</h3>
          <p>Dashboard and navigation preferences can be applied as frontend options.</p>
          <div className="profile-row">
            <span className="profile-label">Sidebar</span>
            <span className="profile-value">Collapsible navigation</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Landing Pages</span>
            <span className="profile-value">Connected to dashboard sections</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
