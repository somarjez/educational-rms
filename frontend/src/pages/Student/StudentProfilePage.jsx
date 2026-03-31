import React, { useEffect, useState } from 'react';
import { authApi } from '../../services/authApi';
import { useAuthStore } from '../../stores/authStore';
import EditProfileModal from '../../components/Profile/EditProfileModal';
import './styles/StudentPages.css';

const StudentProfilePage = () => {
  const { user } = useAuthStore();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProfile = async () => {
    setLoading(true);
    setError('');

    if (!user) {
      setError('Unable to load your profile details right now.');
      setProfileData(null);
      setLoading(false);
      return;
    }

    try {
      const profile = await authApi.getProfile();

      const mergedUser = {
        ...user,
        profile: {
          ...user.profile,
          ...profile,
        },
      };

      setProfileData(mergedUser);
    } catch (loadError) {
      setError('Unable to load your profile details right now.');
      setProfileData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  return (
    <div className="student-page">
      <div className="student-page-header">
        <div>
          <h1 className="student-page-title">Student Profile</h1>
          <p className="student-page-subtitle">Review and update your profile information.</p>
        </div>
        <button className="student-btn" onClick={() => setIsEditProfileOpen(true)} disabled={loading || !profileData}>
          Edit Profile
        </button>
      </div>

      <div className="student-page-card">
        {error && <p className="student-error">{error}</p>}
        {loading ? (
          <p className="student-empty">Loading profile...</p>
        ) : !profileData ? (
          <p className="student-empty">Profile data is not available.</p>
        ) : (
          <div className="student-profile-grid">
            <div className="student-field">
              <p className="student-field-label">First Name</p>
              <p className="student-field-value">{profileData?.first_name || 'N/A'}</p>
            </div>
            <div className="student-field">
              <p className="student-field-label">Last Name</p>
              <p className="student-field-value">{profileData?.last_name || 'N/A'}</p>
            </div>
            <div className="student-field">
              <p className="student-field-label">Username</p>
              <p className="student-field-value">{profileData?.username || 'N/A'}</p>
            </div>
            <div className="student-field">
              <p className="student-field-label">Email</p>
              <p className="student-field-value">{profileData?.email || 'N/A'}</p>
            </div>
            <div className="student-field">
              <p className="student-field-label">Phone Number</p>
              <p className="student-field-value">{profileData?.profile?.phone_number || 'N/A'}</p>
            </div>
            <div className="student-field">
              <p className="student-field-label">Bio</p>
              <p className="student-field-value">{profileData?.profile?.bio || 'N/A'}</p>
            </div>
            <div className="student-field">
              <p className="student-field-label">Office Location</p>
              <p className="student-field-value">{profileData?.profile?.office_location || 'N/A'}</p>
            </div>
            <div className="student-field">
              <p className="student-field-label">Role</p>
              <p className="student-field-value">{profileData?.role || 'STUDENT'}</p>
            </div>
          </div>
        )}
      </div>

      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        onUpdate={async () => {
          await loadProfile();
        }}
      />
    </div>
  );
};

export default StudentProfilePage;
