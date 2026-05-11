import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { getInitials } from '../../utils/userUtils';
import { DashboardBellIcon } from '../../features/dashboard/icons/DashboardIcons';
import accountIcon from '../../assets/settings/account.svg';
import securityIcon from '../../assets/settings/security.svg';
import displayIcon from '../../assets/settings/display.svg';
import './LandingPages.css';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'N/A';
  const role = user?.role || 'Student';
  const normalizedRole = String(role).toLowerCase();
  const avatarSrc = user?.avatar || user?.avatar_url || '';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const settingsSections = [
    {
      title: 'Account',
      icon: accountIcon,
      description: 'Manage identity and profile details connected to your account.',
      fields: [
        ['Full Name', fullName],
        ['Email', user?.email || 'N/A'],
        ['Role', role],
      ],
    },
    {
      title: 'Security',
      icon: securityIcon,
      description: 'Password changes and session controls are available from your account endpoints.',
      fields: [
        ['Password', 'Managed in account security.'],
        ['Active Session', 'Current device session.'],
      ],
    },
    {
      title: 'Display',
      icon: displayIcon,
      description: 'Dashboard and navigation preferences can be applied as frontend options.',
      fields: [
        ['Sidebar', 'Collapsible navigation'],
        ['Landing Pages', 'Connected to dashboard sections'],
      ],
    },
  ];

  return (
    <div className="settings-dashboard">
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
                <img src={avatarSrc} alt={fullName} />
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

      <main className="settings-page">
        <section className="settings-heading" aria-labelledby="settings-title">
          <h1 id="settings-title">SETTINGS</h1>
          <p>Account and application preferences.</p>
        </section>

        <section className="settings-shell" aria-label="Settings preferences">
          <div className="settings-panel-stack">
            {settingsSections.map((section) => (
              <article className="settings-panel" key={section.title}>
                <div className="settings-panel-heading">
                  <img src={section.icon} alt="" aria-hidden="true" className="settings-panel-icon" />
                  <div>
                    <h2>{section.title}</h2>
                    <p>{section.description}</p>
                  </div>
                </div>

                <div className="settings-field-list">
                  {section.fields.map(([label, value]) => (
                    <div className="settings-field" key={label}>
                      <span className="settings-field-label">{label}</span>
                      <span className="settings-field-value">{value}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default SettingsPage;
