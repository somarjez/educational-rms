import React, { useState, lazy, Suspense } from 'react';
import {
  FiCalendar,
  FiClipboard,
  FiHome,
  FiSettings,
  FiClock,
  FiCheckCircle,
  FiRefreshCcw,
  FiAlertTriangle,
  FiBookmark,
  FiMousePointer,
  FiHelpCircle,
  FiArrowRight,
  FiBookOpen,
  FiPlus,
} from 'react-icons/fi';
import './styles/AdminScheduling.css';
 
const RoomManagement = lazy(() => import('../RoomManagement/RoomManagement'));
const BookingManagement = lazy(() => import('../BookingManagement/BookingManagement'));
const SchedulingCalendar = lazy(() => import('../SchedulingCalendar/SchedulingCalendar'));
const ResourceSettings = lazy(() => import('../ResourceSettings/ResourceSettings'));
 
const AdminScheduling = () => {
  const [activeTab, setActiveTab] = useState('calendar');
  const [showGuide, setShowGuide] = useState(false);
 
  const tabs = [
    {
      id: 'calendar',
      label: 'Calendar View',
      icon: <FiCalendar />,
      description: 'View, create, and manage bookings with day/week/month calendar views. Drag-and-drop to reschedule bookings.'
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: <FiClipboard />,
      description: 'Manage all bookings: create, modify, cancel, approve/reject. Handle recurring bookings and override conflicts.'
    },
    {
      id: 'rooms',
      label: 'Rooms',
      icon: <FiHome />,
      description: 'Create, edit, and delete room/lab resources. Link equipment and manage room features.'
    },
    {
      id: 'resources',
      label: 'Equipment & Time Slots',
      icon: <FiSettings />,
      description: 'Configure equipment inventory and define time slot templates (hourly, daily, weekly).'
    }
  ];
 
  const features = [
    {
      category: 'Scheduling & Resource Management',
      items: [
        { icon: <FiHome />, title: 'Create, edit, and delete room/lab resources', tab: 'rooms', location: 'Rooms tab' },
        { icon: <FiSettings />, title: 'Configure equipment linked to rooms', tab: 'resources', location: 'Equipment & Time Slots tab' },
        { icon: <FiClock />, title: 'Manage time slot definitions (hourly, daily, weekly)', tab: 'resources', location: 'Equipment & Time Slots tab' },
        { icon: <FiClipboard />, title: 'Create, modify, and cancel any booking', tab: 'bookings', location: 'Bookings tab' },
        { icon: <FiCheckCircle />, title: 'Approve or reject booking requests', tab: 'bookings', location: 'Bookings tab - Filter by "Pending"' },
        { icon: <FiRefreshCcw />, title: 'Manage recurring bookings', tab: 'bookings', location: 'Bookings tab - Look for "is_recurring" filter' },
        { icon: <FiAlertTriangle />, title: 'Override conflict detection rules when necessary', tab: 'bookings', location: 'Bookings tab - Click "Override Conflict" button' },
        { icon: <FiBookmark />, title: 'Manage waitlists and prioritize requests', tab: 'bookings', location: 'Bookings tab - Waitlist section' },
        { icon: <FiCalendar />, title: 'View all calendar views (day, week, month)', tab: 'calendar', location: 'Calendar View tab - Toggle view buttons' },
        { icon: <FiMousePointer />, title: 'Use drag-and-drop scheduling for all resources', tab: 'calendar', location: 'Calendar View tab - Drag events to reschedule' }
      ]
    }
  ];
 
  return (
    <div className="admin-scheduling">
 
      {/* ── Header ── */}
      <div className="scheduling-header">
        <div className="header-content">
          <div className="header-copy">
            <h1>Scheduling & Resource Management</h1>
            <p className="subtitle">Resource inventory currently available.</p>
          </div>
          <button
            className="guide-btn"
            onClick={() => setShowGuide(!showGuide)}
            title="View feature guide"
          >
            <FiHelpCircle /> Guide
          </button>
        </div>
      </div>
 
      {/* ── Tab Navigation ── */}
      <div className="tab-navigation">
        {tabs.map(tab => (
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
 
      {/* ── Tab Content ── */}
      <div className="tab-content">
 
        {/* Feature Guide — shown inside tab content area */}
        {showGuide && (
          <div className="feature-guide">
            <div className="guide-header">
              <h3><FiBookOpen /> Feature Guide</h3>
              <button className="close-btn" onClick={() => setShowGuide(false)}>×</button>
            </div>
            <div className="guide-content">
              {features.map((section, idx) => (
                <div key={idx} className="guide-section">
                  <h4>{section.category}</h4>
                  <div className="features-list">
                    {section.items.map((item, itemIdx) => (
                      <div
                        key={itemIdx}
                        className="feature-item"
                        onClick={() => {
                          setActiveTab(item.tab);
                          setShowGuide(false);
                        }}
                      >
                        <span className="feature-icon">{item.icon}</span>
                        <div className="feature-info">
                          <div className="feature-title">{item.title}</div>
                          <div className="feature-location">
                            → Go to: <strong>{item.location}</strong>
                          </div>
                        </div>
                        <span className="feature-arrow"><FiArrowRight /></span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
 
        <Suspense fallback={<div className="loading">Loading section...</div>}>
          {activeTab === 'calendar'  && <SchedulingCalendar />}
          {activeTab === 'bookings'  && <BookingManagement />}
          {activeTab === 'rooms'     && <RoomManagement />}
          {activeTab === 'resources' && <ResourceSettings />}
        </Suspense>
 
      </div>
    </div>
  );
};
 
export default AdminScheduling;