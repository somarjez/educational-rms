import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getInitials } from '../../../utils/userUtils';
import { DashboardBellIcon } from '../icons/DashboardIcons';
import './styles/Dashboard.css';

const DashboardHeader = ({ user, onLogout, onProfileClick }) => {
  const navigate = useNavigate();
  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'User';
  const avatarSrc = user?.avatar || user?.avatar_url || '';
  const normalizedRole = String(user?.role || 'user').toLowerCase();
  const roleKey = normalizedRole.includes('faculty')
    ? 'faculty'
    : normalizedRole.includes('admin')
      ? 'admin'
      : normalizedRole.includes('student')
        ? 'student'
        : 'user';
  const avatarRoleClass =
    roleKey === 'faculty'
      ? 'faculty-avatar-shell'
      : roleKey === 'admin'
        ? 'admin-avatar-shell'
        : roleKey === 'student'
          ? 'student-avatar-shell'
          : '';

  return (
    <div className="dashboard-header">
      <div className="dashboard-header-inner">
        <div className="dashboard-header-cluster">
          <div className="dashboard-header-controls">
            <button
              type="button"
              className="header-icon-button"
              aria-label="Notifications"
              onClick={() => navigate('/notifications')}
            >
              <DashboardBellIcon />
            </button>
            <button className="logout-btn" onClick={onLogout}>
              Log Out
            </button>

            <span className={`header-role-pill role-${normalizedRole}`}>{user?.role || 'User'}</span>

            <button
              type="button"
              className="account-trigger"
              aria-label="Open profile"
              onClick={onProfileClick}
              onKeyDown={(e) => e.key === 'Enter' && onProfileClick()}
            >
              <span className={`avatar-shell ${avatarRoleClass}`.trim()}>
                {avatarSrc ? (
                  <img src={avatarSrc} alt={fullName} className="avatar-image" />
                ) : (
                <span className="avatar-initials">
                  {getInitials(user.first_name, user.last_name, user.username)}
                </span>
                )}
              </span>
            </button>
          </div>

          <div className="dashboard-header-brand">
            <div className="dashboard-breadcrumb">Educational Resource Management</div>
            <div className="dashboard-brand-subtitle">Your comprehensive resource management platform.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;

