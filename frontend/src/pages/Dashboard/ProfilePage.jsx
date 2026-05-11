import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../services/authApi';
import { useAuthStore } from '../../stores/authStore';
import { getInitials } from '../../utils/userUtils';
import EditProfileModal from '../../components/Profile/EditProfileModal';
import { DashboardBellIcon } from '../../features/dashboard/icons/DashboardIcons';
import profileUserIcon from '../../assets/profile/profile-user.svg';
import profileLockIcon from '../../assets/profile/profile-lock.svg';
import './LandingPages.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout, initAuth } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await authApi.getProfile();
      setProfile(data);
    } catch (err) {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleProfileUpdate = async () => {
    await Promise.all([fetchProfile(), initAuth()]);
  };

  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'N/A';
  const displayName = fullName !== 'N/A' ? fullName : user?.username || 'USERNAME';
  const role = user?.role || 'Student';
  const normalizedRole = String(role).toLowerCase();
  const avatarSrc = user?.avatar || user?.avatar_url || profile?.avatar || profile?.avatar_url || '';
  const phoneNumber = profile?.phone_number || user?.phone_number || 'N/A';
  const department = profile?.department || user?.department || 'N/A';
  const bio = profile?.bio || user?.bio || 'No bio provided.';

  const FieldValue = ({ children, multiline = false }) => (
    <span className={`profile-reference-field-value${multiline ? ' multiline' : ''}`}>
      {children}
    </span>
  );

  return (
    <div className="profile-reference-dashboard">
      <header className="settings-topbar">
        <div className="settings-topbar-cluster">
          <button
            type="button"
            className="settings-notification-button"
            aria-label="Notifications"
            onClick={() => navigate('/notifications')}
          >
            <DashboardBellIcon />
          </button>
          <button type="button" className="settings-logout-button" onClick={handleLogout}>
            Log Out
          </button>
          <span className="settings-role-pill">{role}</span>
          <button
            type="button"
            className="settings-avatar-button"
            aria-label="Open profile"
            onClick={() => navigate('/profile')}
          >
            <span className={`settings-avatar role-${normalizedRole}`}>
              {avatarSrc ? (
                <img src={avatarSrc} alt={displayName} />
              ) : (
                <span>{getInitials(user?.first_name, user?.last_name, user?.username)}</span>
              )}
            </span>
          </button>
          <div className="settings-brand-lockup">
            <strong>Educational Resource Management</strong>
            <span>Your comprehensive resource management platform.</span>
          </div>
        </div>
      </header>

      <main className="profile-reference-page">
        <section className="profile-reference-heading" aria-labelledby="profile-title">
          <h1 id="profile-title">MY PROFILE</h1>
          <p>User information and account summary.</p>
        </section>

        {loading ? (
          <div className="profile-reference-empty">Loading profile...</div>
        ) : (
          <section className="profile-reference-shell" aria-label="Profile details">
            <div className="profile-reference-cover" aria-hidden="true" />
            <div className="profile-reference-summary">
              <div className={`profile-reference-avatar role-${normalizedRole}`}>
                {avatarSrc ? (
                  <img src={avatarSrc} alt={displayName} />
                ) : (
                  <span>{getInitials(user?.first_name, user?.last_name, user?.username)}</span>
                )}
              </div>
              <h2>{user?.username || displayName}</h2>
              <button
                type="button"
                className="profile-reference-edit-button"
                onClick={() => setIsEditOpen(true)}
              >
                <span>Edit Profile</span>
                <small>Update your information</small>
              </button>
            </div>

            <div className="profile-reference-card">
              <section className="profile-reference-section">
                <header className="profile-reference-section-header">
                  <img src={profileUserIcon} alt="" aria-hidden="true" />
                  <h3>Account Details</h3>
                </header>
                <div className="profile-reference-fields two-column">
                  <label>
                    <span>Username</span>
                    <FieldValue>{user?.username || 'N/A'}</FieldValue>
                  </label>
                  <label>
                    <span>Role</span>
                    <FieldValue>{role}</FieldValue>
                  </label>
                </div>
                <div className="profile-reference-fields">
                  <label>
                    <span>Full Name</span>
                    <FieldValue>{fullName}</FieldValue>
                  </label>
                  <label>
                    <span>Email</span>
                    <FieldValue>{user?.email || 'N/A'}</FieldValue>
                  </label>
                </div>
              </section>

              <section className="profile-reference-section">
                <header className="profile-reference-section-header">
                  <img src={profileLockIcon} alt="" aria-hidden="true" />
                  <h3>Personal Details</h3>
                </header>
                <div className="profile-reference-fields">
                  <label>
                    <span>Cellphone Number</span>
                    <FieldValue>{phoneNumber}</FieldValue>
                  </label>
                  <label>
                    <span>Department</span>
                    <FieldValue>{department}</FieldValue>
                  </label>
                  <label>
                    <span>Bio</span>
                    <FieldValue multiline>{bio}</FieldValue>
                  </label>
                </div>
              </section>
            </div>
          </section>
        )}
      </main>

      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onUpdate={handleProfileUpdate}
      />
    </div>
  );
};

export default ProfilePage;
