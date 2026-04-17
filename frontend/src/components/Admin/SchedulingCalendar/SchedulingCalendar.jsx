import React, { useState, useEffect } from 'react';
import { getCalendarEvents, getRooms, dragUpdateBooking } from '../../../services/schedulingApi';
import './styles/SchedulingCalendar.css';

const SchedulingCalendar = () => {
  const [events, setEvents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('week'); // day, week, month
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (rooms.length > 0 && selectedRooms.length === 0) {
      // Select all rooms by default
      setSelectedRooms(rooms.map(r => r.id));
    }
  }, [rooms]);

  useEffect(() => {
    if (selectedRooms.length > 0) {
      fetchEvents();
    }
  }, [currentDate, view, selectedRooms]);

  const fetchRooms = async () => {
    try {
      const data = await getRooms({ is_active: true });
      setRooms(Array.isArray(data) ? data : data.results || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch rooms. Please log in again.');
      console.error('Error fetching rooms:', err);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();
      
      const data = await getCalendarEvents(startDate, endDate, selectedRooms);
      setEvents(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch calendar events');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (view === 'day') {
      end.setDate(end.getDate() + 1);
    } else if (view === 'week') {
      // Start from Monday
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      // End is Sunday (6 days after Monday)
      end.setTime(start.getTime());
      end.setDate(end.getDate() + 6);
    } else if (view === 'month') {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + direction);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const toggleRoom = (roomId) => {
    setSelectedRooms(prev => {
      if (prev.includes(roomId)) {
        return prev.filter(id => id !== roomId);
      } else {
        return [...prev, roomId];
      }
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': '#ff9800',
      'APPROVED': '#4caf50',
      'CONFIRMED': '#2196f3',
      'REJECTED': '#f44336',
      'CANCELLED': '#9e9e9e',
      'COMPLETED': '#9c27b0'
    };
    return colors[status] || '#757575';
  };

  const getRoomColor = (roomId) => {
    const palette = [
      '#1e88e5',
      '#8e24aa',
      '#43a047',
      '#f4511e',
      '#3949ab',
      '#00897b',
      '#6d4c41',
      '#c0ca33',
      '#d81b60',
      '#546e7a'
    ];
    if (!roomId) return '#1976d2';
    return palette[roomId % palette.length];
  };

  const getEventPositionStyle = (event, cellHeight) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const durationMs = end - start;
    const durationHours = Math.max(durationMs / 3600000, 1);
    const minutes = start.getMinutes();
    const top = (minutes / 60) * cellHeight;
    const height = Math.max(durationHours * cellHeight - 6, cellHeight - 6);

    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  };

  const formatDateHeader = () => {
    const options = { year: 'numeric', month: 'long' };
    if (view === 'day') {
      options.day = 'numeric';
    } else if (view === 'week') {
      const { startDate, endDate } = getDateRange();
      return `${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return currentDate.toLocaleDateString('en-US', options);
  };

  const renderWeekView = () => {
    const { startDate } = getDateRange();
    const weekStart = new Date(startDate);
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      days.push(day);
    }

    const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM
    const hourRowHeight = 60;

    return (
      <div className="calendar-week-view">
        <div className="calendar-grid">
          <div className="calendar-header">
            <div className="time-column">Time</div>
            {days.map(day => (
              <div key={day.toISOString()} className="day-column">
                <div className="day-name">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div className="day-date">{day.getDate()}</div>
              </div>
            ))}
          </div>
          
          <div className="calendar-body">
            {hours.map(hour => (
              <div key={hour} className="calendar-row">
                <div className="time-cell">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                {days.map(day => {
                  const dayStr = day.toISOString().split('T')[0];
                  const dayEvents = events.filter(event => {
                    const eventDate = event.start.split('T')[0];
                    if (eventDate !== dayStr) return false;

                    const start = new Date(event.start);
                    const startHour = start.getHours();
                    return hour === startHour;
                  });

                  return (
                    <div key={`${day}-${hour}`} className="calendar-cell">
                      {dayEvents.length > 0 ? (
                        <div className="calendar-events-container">
                          {dayEvents.map((event, index) => {
                            const position = getEventPositionStyle(event, hourRowHeight);
                            const widthPercent = 100 / dayEvents.length;

                            return (
                              <div
                                key={event.id}
                                className="calendar-event start"
                                style={{
                                  backgroundColor: getRoomColor(event.resource_id),
                                  borderLeft: `4px solid ${getStatusColor(event.status)}`,
                                  top: position.top,
                                  height: position.height,
                                  left: `calc(${index * widthPercent}% + 2px)`,
                                  width: `calc(${widthPercent}% - 4px)`
                                }}
                                onClick={() => setSelectedEvent(event)}
                                title={`${event.resource_name}: ${event.purpose}`}
                              >
                                <div className="event-title">{event.resource_name}</div>
                                <div className="event-user">{event.user_name}</div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div></div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = events.filter(event => {
      const eventDate = event.start.split('T')[0];
      const currentDateStr = currentDate.toISOString().split('T')[0];
      return eventDate === currentDateStr;
    });

    const hours = Array.from({ length: 14 }, (_, i) => i + 7);
    const hourRowHeight = 80;

    return (
      <div className="calendar-day-view">
        <div className="day-grid">
          {hours.map(hour => {
            const hourEvents = dayEvents.filter(event => {
              const eventHour = parseInt(event.start.split('T')[1].split(':')[0]);
              return eventHour === hour;
            });

            return (
              <div key={hour} className="day-row">
                <div className="time-cell">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="day-events-cell">
                  {hourEvents.map(event => (
                    <div
                      key={event.id}
                      className="day-event"
                      style={{
                        borderLeftColor: getStatusColor(event.status),
                        ...getEventPositionStyle(event, hourRowHeight),
                      }}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <strong>{event.resource_name}</strong>
                      <div>{event.user_name}</div>
                      <div className="text-muted">{event.purpose}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    const startPadding = firstDay === 0 ? 6 : firstDay - 1;

    // Previous month padding
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return (
      <div className="calendar-month-view">
        <div className="month-grid">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="month-header-cell">{day}</div>
          ))}
          
          {days.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="month-cell empty"></div>;
            }

            const dayDate = new Date(year, month, day);
            const dayStr = dayDate.toISOString().split('T')[0];
            const dayEvents = events.filter(event => event.start.split('T')[0] === dayStr);

            return (
              <div key={day} className="month-cell">
                <div className="month-day-number">{day}</div>
                <div className="month-events">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className="month-event"
                      style={{ backgroundColor: getStatusColor(event.status) }}
                      onClick={() => setSelectedEvent(event)}
                      title={`${event.resource_name}: ${event.user_name}`}
                    >
                      {event.resource_name}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="month-event-more">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="scheduling-calendar">
      <div className="calendar-toolbar">
        <div className="toolbar-left">
          <button className="btn btn-secondary" onClick={goToToday}>
            Today
          </button>
          <div className="nav-buttons">
            <button className="btn btn-icon" onClick={() => navigateDate(-1)}>
              ‹
            </button>
            <button className="btn btn-icon" onClick={() => navigateDate(1)}>
              ›
            </button>
          </div>
          <h3 className="current-date">{formatDateHeader()}</h3>
        </div>

        <div className="toolbar-right">
          <div className="view-switcher">
            <button
              className={`btn ${view === 'day' ? 'active' : ''}`}
              onClick={() => setView('day')}
            >
              Day
            </button>
            <button
              className={`btn ${view === 'week' ? 'active' : ''}`}
              onClick={() => setView('week')}
            >
              Week
            </button>
            <button
              className={`btn ${view === 'month' ? 'active' : ''}`}
              onClick={() => setView('month')}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      <div className="calendar-filters">
        <div className="room-filters">
          <strong>Rooms:</strong>
          {rooms.map(room => (
            <label key={room.id} className="room-checkbox">
              <input
                type="checkbox"
                checked={selectedRooms.includes(room.id)}
                onChange={() => toggleRoom(room.id)}
              />
              {room.name}
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)} className="alert-close">×</button>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading calendar...</div>
      ) : (
        <>
          {view === 'day' && renderDayView()}
          {view === 'week' && renderWeekView()}
          {view === 'month' && renderMonthView()}
        </>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Booking Details</h3>
              <button className="modal-close" onClick={() => setSelectedEvent(null)}>×</button>
            </div>
            <div className="modal-body">
              <p><strong>Room:</strong> {selectedEvent.resource_name}</p>
              <p><strong>User:</strong> {selectedEvent.user_name}</p>
              <p><strong>Status:</strong> <span className={`badge badge-${selectedEvent.status.toLowerCase()}`}>{selectedEvent.status}</span></p>
              <p><strong>Priority:</strong> {selectedEvent.priority}</p>
              <p><strong>Participants:</strong> {selectedEvent.participants_count}</p>
              <p><strong>Purpose:</strong> {selectedEvent.purpose}</p>
              <p><strong>Time:</strong> {new Date(selectedEvent.start).toLocaleString()} - {new Date(selectedEvent.end).toLocaleTimeString()}</p>
              {selectedEvent.is_recurring && (
                <p><span className="badge badge-info">Recurring Booking</span></p>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setSelectedEvent(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulingCalendar;

