import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiArrowRight,
  FiBookOpen,
  FiBookmark,
  FiCalendar,
  FiCheckCircle,
  FiClipboard,
  FiClock,
  FiHelpCircle,
  FiHome,
  FiMousePointer,
  FiRefreshCcw,
  FiSettings,
} from 'react-icons/fi';
import DashboardHeader from '../../../features/dashboard/core/DashboardHeader';
import { useAuthStore } from '../../../stores/authStore';
import calendarIcon from '../../../assets/scheduling/CalendarBlank.svg';
import gearIcon from '../../../assets/scheduling/Gear.svg';
import houseIcon from '../../../assets/scheduling/House.svg';
import subtractIcon from '../../../assets/scheduling/Subtract.svg';
import './styles/AdminScheduling.css';

const RoomManagement = lazy(() => import('../RoomManagement/RoomManagement'));
const BookingManagement = lazy(() => import('../BookingManagement/BookingManagement'));
const SchedulingCalendar = lazy(() => import('../SchedulingCalendar/SchedulingCalendar'));
const ResourceSettings = lazy(() => import('../ResourceSettings/ResourceSettings'));

const AdminScheduling = () => {
  const [activeTab, setActiveTab] = useState('calendar');
  const [showGuide, setShowGuide] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestedTab = location.state?.tab || params.get('tab');

    if (['calendar', 'bookings', 'rooms', 'resources'].includes(requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [location.search, location.state]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const tabs = [
    {
      id: 'calendar',
      label: 'Calendar View',
      icon: <img src={calendarIcon} alt="" />,
      description: 'View, create, and manage bookings with day/week/month calendar views.',
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: <img src={subtractIcon} alt="" />,
      description: 'Manage all bookings, recurring schedules, and approval requests.',
    },
    {
      id: 'rooms',
      label: 'Rooms',
      icon: <img src={houseIcon} alt="" />,
      description: 'Create, edit, and delete room or lab resources.',
    },
    {
      id: 'resources',
      label: 'Equipment & Time Slots',
      icon: <img src={gearIcon} alt="" />,
      description: 'Configure equipment inventory and time slot templates.',
    },
  ];

  const features = [{
    category: 'Scheduling & Resource Management',
    items: [
      { icon: <FiHome />, title: 'Create, edit, and delete room/lab resources', tab: 'rooms', location: 'Rooms tab' },
      { icon: <FiSettings />, title: 'Configure equipment linked to rooms', tab: 'resources', location: 'Equipment & Time Slots tab' },
      { icon: <FiClock />, title: 'Manage time slot definitions (hourly, daily, weekly)', tab: 'resources', location: 'Equipment & Time Slots tab' },
      { icon: <FiClipboard />, title: 'Create, modify, and cancel any booking', tab: 'bookings', location: 'Bookings tab' },
      { icon: <FiCheckCircle />, title: 'Approve or reject booking requests', tab: 'bookings', location: 'Bookings tab - Filter by "Pending"' },
      { icon: <FiRefreshCcw />, title: 'Manage recurring bookings', tab: 'bookings', location: 'Bookings tab - Look for recurring bookings' },
      { icon: <FiAlertTriangle />, title: 'Override conflict detection rules when necessary', tab: 'bookings', location: 'Bookings tab - Override Conflict' },
      { icon: <FiBookmark />, title: 'Manage waitlists and prioritize requests', tab: 'bookings', location: 'Bookings tab - Waitlist section' },
      { icon: <FiCalendar />, title: 'View all calendar views (day, week, month)', tab: 'calendar', location: 'Calendar View tab - Toggle view buttons' },
      { icon: <FiMousePointer />, title: 'Use drag-and-drop scheduling for all resources', tab: 'calendar', location: 'Calendar View tab' },
    ],
  }];

  return (
    <div className="admin-scheduling">
      <DashboardHeader
        user={user || {}}
        onLogout={handleLogout}
        onProfileClick={() => navigate('/profile')}
      />

      <div className="scheduling-header">
        <div className="header-content">
          <div className="header-copy">
            <h1 className="scheduling-title">Scheduling &amp; Resource Management</h1>
            <p className="subtitle">Resource inventory currently available.</p>
          </div>
          <button
            className="guide-btn"
            onClick={() => setShowGuide(!showGuide)}
            aria-label="Open scheduling guide"
            title="Guide"
          >
            <FiHelpCircle />
            <span>Guide</span>
          </button>
        </div>
      </div>

      <div className="tab-navigation">
        {tabs.map((tab) => (
          <div key={tab.id} className="tab-wrapper">
            <button
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
            <div className="tab-tooltip">{tab.description}</div>
          </div>
        ))}
      </div>

      <div className="tab-content">
        {showGuide && (
          <div className="modal-overlay feature-guide-overlay" onClick={() => setShowGuide(false)}>
            <div className="modal-window feature-guide-modal" onClick={(e) => e.stopPropagation()}>
              <div className="guide-header">
                <h3><FiBookOpen /> Feature Guide</h3>
                <button className="close-btn" onClick={() => setShowGuide(false)}>x</button>
              </div>
              <div className="guide-content">
                {features.map((section, idx) => (
                  <div key={idx} className="guide-section">
                    <h4>{section.category}</h4>
                    <div className="features-list">
                      {section.items.map((item, i) => (
                        <button
                          key={i}
                          type="button"
                          className="feature-item"
                          onClick={() => {
                            setActiveTab(item.tab);
                            setShowGuide(false);
                          }}
                        >
                          <span className="feature-icon">{item.icon}</span>
                          <span className="feature-info">
                            <span className="feature-title">{item.title}</span>
                            <span className="feature-location">Go to: <strong>{item.location}</strong></span>
                          </span>
                          <span className="feature-arrow"><FiArrowRight /></span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <Suspense fallback={<div className="loading">Loading section...</div>}>
          {activeTab === 'calendar' && <SchedulingCalendar />}
          {activeTab === 'bookings' && <BookingManagement />}
          {activeTab === 'rooms' && <RoomManagement />}
          {activeTab === 'resources' && <ResourceSettings />}
        </Suspense>
      </div>
    </div>
  );
};

export default AdminScheduling;
