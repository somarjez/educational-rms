import React from 'react';
import { DashboardUserIcon } from '../../icons/DashboardIcons';

const buttonStyle = { background: '#cfa25a', color: '#ffffff' };
const iconStyle = { background: 'rgba(255, 255, 255, 0.2)' };
const titleStyle = { color: '#ffffff' };
const descriptionStyle = { color: '#f8dc72' };

const EditProfileActionClean = ({ onClick }) => (
  <button className="action-btn" onClick={onClick} type="button" style={buttonStyle}>
    <div className="action-icon" style={iconStyle}>
      <DashboardUserIcon />
    </div>
    <div className="action-text">
      <div className="action-title" style={titleStyle}>Edit Profile</div>
      <div className="action-description" style={descriptionStyle}>Update your information</div>
    </div>
  </button>
);

export default EditProfileActionClean;
