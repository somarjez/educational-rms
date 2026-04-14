import React from 'react';
import { FaUserCircle, FaChalkboardTeacher } from 'react-icons/fa';
import { getInitials } from '../../../utils/userUtils';
import Notifications from '../../../components/Common/Notifications';
import './styles/Dashboard.css';

const DashboardHeader = ({ user, onLogout }) => {
  return (
    <div className="dashboard-header">
      <div className="header-content">
        <div className="header-brand">
          <div className="brand-logo">
            <FaChalkboardTeacher size={32} color="#2563eb" />
          </div>
          <div className="brand-info">
            <h1 style={{ fontWeight: 700, fontSize: '2rem', color: '#1e3a8a', fontFamily: 'Roboto, Arial, Helvetica, sans-serif' }}>
              Educational Resource Management
            </h1>
            <p style={{ color: '#64748b', fontSize: '1rem', fontFamily: 'Roboto, Arial, Helvetica, sans-serif' }}>
              Your comprehensive resource management platform
            </p>
          </div>
        </div>
        <div className="header-user">
          <div className="header-notifications">
            <Notifications />
          </div>
          <div className="user-avatar">
            <FaUserCircle size={32} color="#2563eb" style={{ marginRight: '0.5em' }} />
            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
              {getInitials(user.first_name, user.last_name, user.username)}
            </span>
          </div>
          <div className="user-info">
            <p className="user-name" style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>
              {user.first_name} {user.last_name}
            </p>
            <p className="user-role" style={{ color: '#64748b', fontSize: '0.95rem' }}>{user.role || 'User'}</p>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;

