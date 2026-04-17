import React from 'react';

const EditProfileAction = ({ onClick }) => (
  <button className="action-btn" onClick={onClick}>
    <div className="action-icon">👤</div>
    <div className="action-text">
      <div className="action-title">Edit Profile</div>
      <div className="action-description">Update your information</div>
    </div>
  </button>
);

export default EditProfileAction;
