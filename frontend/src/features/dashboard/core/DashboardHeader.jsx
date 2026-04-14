import React from 'react';
import { FaChalkboardTeacher } from 'react-icons/fa';
import { getInitials } from '../../../utils/userUtils';
import Notifications from '../../../components/Common/Notifications';
import './styles/Dashboard.css';

const DashboardHeader = ({ user, onLogout, onProfileClick }) => {
  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'User';
  const avatarSrc = user?.avatar || user?.avatar_url || '';

  return (
    <div className="dashboard-header">
      <div className="header-content">
        <div className="header-brand">
          <div className="brand-logo">
            <FaChalkboardTeacher size={32} color="#2563eb" />
          </div>
          <div className="brand-info">
            <h1>Educational Resource Management</h1>
            <p>Your comprehensive resource management platform</p>
          </div>
        </div>

        <div className="header-user">
          <div className="header-notifications">
            <Notifications />
          </div>
          <button
            type="button"
            className="account-trigger"
            onClick={onProfileClick}
            onKeyDown={(e) => e.key === 'Enter' && onProfileClick()}
          >
            <span className="avatar-shell">
              {avatarSrc ? (
                <img src={avatarSrc} alt={fullName} className="avatar-image" />
              ) : (
                <span className="avatar-initials">
                  {getInitials(user.first_name, user.last_name, user.username)}
                </span>
              )}
              <span className="avatar-status-dot" aria-hidden="true" />
            </span>

            <span className="account-meta">
              <span className="user-name">{fullName}</span>
              <span className="user-role role-pill">{user?.role || 'User'}</span>
            </span>
          </button>

          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;

