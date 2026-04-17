import React from 'react';
import '../AdminScheduling/styles/AdminScheduling.css';

const QuickReference = ({ onClose }) => {
  const shortcuts = [
    {
      icon: '📅',
      title: 'Calendar View',
      shortcuts: [
        'Toggle between Day, Week, Month views',
        'Filter bookings by room',
        'Drag & drop to reschedule events',
        'Click on event for details'
      ]
    },
    {
      icon: '📋',
      title: 'Booking Management',
      shortcuts: [
        'Filter: Status, Room, Date Range',
        'Bulk approve/reject/cancel',
        'Override conflict rules',
        'Create new bookings',
        'Manage recurring patterns'
      ]
    },
    {
      icon: '🏢',
      title: 'Room Management',
      shortcuts: [
        'Create new rooms/labs',
        'Add equipment to rooms',
        'Set room capacity & features',
        'Activate/deactivate rooms'
      ]
    },
    {
      icon: '⚙️',
      title: 'Equipment & Time Slots',
      shortcuts: [
        'Add equipment inventory',
        'Create time slot templates',
        'Define slot types: Hourly, Daily, Weekly',
        'Set available days of week'
      ]
    }
  ];

  return (
    <div className="quick-reference-modal">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-window">
        <div className="modal-header">
          <h2>⚡ Quick Reference</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="shortcuts-grid">
          {shortcuts.map((section, idx) => (
            <div key={idx} className="shortcut-card">
              <div className="shortcut-icon">{section.icon}</div>
              <h3>{section.title}</h3>
              <ul>
                {section.shortcuts.map((shortcut, sidx) => (
                  <li key={sidx}>{shortcut}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button className="close-modal-btn" onClick={onClose}>Got it!</button>
        </div>
      </div>
    </div>
  );
};

export default QuickReference;

