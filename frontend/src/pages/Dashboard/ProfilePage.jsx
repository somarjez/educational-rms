import React, { useEffect, useState } from 'react';
import { authApi } from '../../services/authApi';
import { useAuthStore } from '../../stores/authStore';
import './LandingPages.css';

const ProfilePage = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await authApi.getProfile();
        setProfile(data);
      } catch (err) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <div className="landing-page">
      <div className="landing-header">
        <div>
          <h1 className="landing-title">Profile</h1>
          <p className="landing-subtitle">User information and account summary.</p>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Loading profile...</div>
      ) : (
        <div className="profile-grid">
          <div className="profile-card">
            <h3>Account Details</h3>
            <div className="profile-row">
              <span className="profile-label">Username</span>
              <span className="profile-value">{user?.username || 'N/A'}</span>
            </div>
            <div className="profile-row">
              <span className="profile-label">Full Name</span>
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

          <div className="profile-card">
            <h3>Profile Details</h3>
            <div className="profile-row">
              <span className="profile-label">Phone</span>
              <span className="profile-value">{profile?.phone_number || 'N/A'}</span>
            </div>
            <div className="profile-row">
              <span className="profile-label">Department</span>
              <span className="profile-value">{profile?.department || 'N/A'}</span>
            </div>
            <div className="profile-row">
              <span className="profile-label">Bio</span>
              <span className="profile-value">{profile?.bio || 'No bio provided.'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
