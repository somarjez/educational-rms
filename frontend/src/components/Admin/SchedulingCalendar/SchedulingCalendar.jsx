import React, { useEffect, useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { getCalendarEvents, getRooms } from '../../../services/schedulingApi';
import classroomIcon from '../../../assets/scheduling/HouseFilled.svg';
import './styles/SchedulingCalendar.css';

const SchedulingCalendar = () => {
  const [events, setEvents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (rooms.length > 0 && selectedRooms.length === 0) {
      setSelectedRooms(rooms.map((room) => room.id));
    }
  }, [rooms, selectedRooms.length]);

  useEffect(() => {
    if (selectedRooms.length > 0) {
      fetchEvents();
    } else if (rooms.length > 0) {
      setEvents([]);
      setLoading(false);
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
      setEvents(Array.isArray(data) ? data : data.results || []);
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
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      end.setTime(start.getTime());
      end.setDate(end.getDate() + 6);
    } else if (view === 'month') {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  const navigateDate = (direction) => {
    const nextDate = new Date(currentDate);

    if (view === 'day') {
      nextDate.setDate(nextDate.getDate() + direction);
    } else if (view === 'week') {
      nextDate.setDate(nextDate.getDate() + direction * 7);
    } else {
      nextDate.setMonth(nextDate.getMonth() + direction);
    }

    setCurrentDate(nextDate);
  };

  const toggleRoom = (roomId) => {
    setSelectedRooms((prev) => (
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId]
    ));
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: '#ffb234',
      APPROVED: '#5ca9de',
      CONFIRMED: '#80c4eb',
      REJECTED: '#414b8c',
      CANCELLED: '#caa05b',
      COMPLETED: '#ffec7a',
    };
    return colors[status] || '#414b8c';
  };

  const getPaletteIndex = (value) => {
    const key = String(value || '');
    const numericValue = Number(key);

    if (Number.isFinite(numericValue)) {
      return Math.abs(numericValue);
    }

    return key.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  };

  const getEventPaletteIndex = (event, visibleIndex = 0) => {
    const colorKey = [
      event.id,
      event.booking_id,
      event.resource_id,
      event.room_id,
      event.resource_name,
      event.start,
      visibleIndex,
    ].filter(Boolean).join('-');

    return getPaletteIndex(colorKey) % 6;
  };

  const getRoomColor = (event, visibleIndex = 0) => {
    const palette = ['#414b8c', '#5ca9de', '#80c4eb', '#ffec7a', '#ffb234', '#caa05b'];
    return palette[getEventPaletteIndex(event, visibleIndex)];
  };

  const isLightEventColor = (color) => ['#80c4eb', '#ffec7a', '#ffb234', '#caa05b'].includes(color);

  const getEventHoverColors = (color) => {
    const colors = {
      '#414b8c': { background: '#c8cdec', text: '#1f2659' },
      '#5ca9de': { background: '#b8dcf3', text: '#155f95' },
      '#80c4eb': { background: '#c6e7f8', text: '#1a6e9e' },
      '#ffec7a': { background: '#fff1a8', text: '#7f5d0f' },
      '#ffb234': { background: '#ffd48a', text: '#835000' },
      '#caa05b': { background: '#e4c995', text: '#654617' },
    };

    return colors[color] || { background: '#c8cdec', text: '#1f2659' };
  };

  const getEventColorStyle = (event, visibleIndex = 0) => {
    const backgroundColor = getRoomColor(event, visibleIndex);
    const isLightColor = isLightEventColor(backgroundColor);
    const hoverColors = getEventHoverColors(backgroundColor);

    return {
      '--event-color': backgroundColor,
      '--event-status-color': getStatusColor(event.status),
      '--event-text-color': isLightColor ? '#17204f' : '#ffffff',
      '--event-muted-text-color': isLightColor ? 'rgba(23, 32, 79, 0.72)' : 'rgba(255, 255, 255, 0.76)',
      '--event-hover-color': hoverColors.background,
      '--event-hover-text-color': hoverColors.text,
      '--event-hover-muted-text-color': `${hoverColors.text}cc`,
      color: 'var(--event-text-color)',
    };
  };

  const getEventPositionStyle = (event, cellHeight) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const durationHours = Math.max((end - start) / 3600000, 1);
    const calculatedHeight = Math.max(durationHours * cellHeight - 10, cellHeight - 10);

    return {
      top: `${(start.getMinutes() / 60) * cellHeight}px`,
      height: `${Math.min(calculatedHeight, cellHeight * 1.55)}px`,
    };
  };

  const formatDateHeader = () => {
    if (view === 'day') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    if (view === 'week') {
      const { startDate, endDate } = getDateRange();
      return `${new Date(startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${new Date(endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    }

    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const renderWeekView = () => {
    const { startDate } = getDateRange();
    const weekStart = new Date(startDate);
    const days = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + index);
      return day;
    });
    const hours = Array.from({ length: 13 }, (_, index) => index + 7);
    const hourRowHeight = 68;

    return (
      <div className="calendar-week-view">
        <div className="calendar-grid">
          <div className="calendar-header">
            <div className="time-column">Time</div>
            {days.map((day) => (
              <div key={day.toISOString()} className="day-column">
                <div className="day-name">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div className="day-date">{day.getDate()}</div>
              </div>
            ))}
          </div>

          <div className="calendar-body">
            {hours.map((hour) => (
              <div key={hour} className="calendar-row">
                <div className="time-cell">{hour.toString().padStart(2, '0')}:00</div>
                {days.map((day) => {
                  const dayStr = day.toISOString().split('T')[0];
                  const dayEvents = events.filter((event) => {
                    const eventDate = event.start?.split('T')[0];
                    return eventDate === dayStr && new Date(event.start).getHours() === hour;
                  });

                  return (
                    <div key={`${dayStr}-${hour}`} className="calendar-cell">
                      {dayEvents.map((event, index) => {
                        const width = 100 / dayEvents.length;
                        return (
                          <button
                            key={event.id}
                            type="button"
                            className={`calendar-event palette-${getEventPaletteIndex(event, index)} ${dayEvents.length >= 4 ? 'is-compact' : ''} ${dayEvents.length >= 6 ? 'is-tiny' : ''}`}
                            style={{
                              ...getEventPositionStyle(event, hourRowHeight),
                              ...getEventColorStyle(event, index),
                              left: `calc(${index * width}% + 3px)`,
                              width: `calc(${width}% - 6px)`,
                            }}
                            onClick={() => setSelectedEvent(event)}
                            title={`${event.resource_name}: ${event.purpose}`}
                          >
                            <span className="event-title">{event.resource_name}</span>
                            <span className="event-user">{event.user_name}</span>
                          </button>
                        );
                      })}
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
    const dayStr = currentDate.toISOString().split('T')[0];
    const dayEvents = events.filter((event) => event.start?.split('T')[0] === dayStr);
    const hours = Array.from({ length: 13 }, (_, index) => index + 7);
    const hourRowHeight = 76;

    return (
      <div className="calendar-day-view">
        <div className="day-grid">
          {hours.map((hour) => (
            <div key={hour} className="day-row">
              <div className="time-cell">{hour.toString().padStart(2, '0')}:00</div>
              <div className="day-events-cell">
                {dayEvents
                  .filter((event) => new Date(event.start).getHours() === hour)
                  .map((event, index) => (
                    <button
                      key={event.id}
                      type="button"
                      className={`day-event palette-${getEventPaletteIndex(event, index)}`}
                      style={{
                        ...getEventColorStyle(event, index),
                        ...getEventPositionStyle(event, hourRowHeight),
                      }}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <strong>{event.resource_name}</strong>
                      <span>{event.user_name}</span>
                      <span className="text-muted">{event.purpose}</span>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startPadding = firstDay === 0 ? 6 : firstDay - 1;
    const days = [
      ...Array.from({ length: startPadding }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];

    return (
      <div className="calendar-month-view">
        <div className="month-grid">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="month-header-cell">{day}</div>
          ))}

          {days.map((day, index) => {
            if (!day) return <div key={`empty-${index}`} className="month-cell empty" />;

            const dayDate = new Date(year, month, day);
            const dateStr = dayDate.toISOString().split('T')[0];
            const dayEvents = events.filter((event) => event.start?.split('T')[0] === dateStr);

            return (
              <div key={day} className="month-cell">
                <div className="month-day-number">{day}</div>
                <div className="month-events">
                  {dayEvents.slice(0, 3).map((event, index) => (
                    <button
                      key={event.id}
                      type="button"
                      className={`month-event palette-${getEventPaletteIndex(event, index)}`}
                      style={getEventColorStyle(event, index)}
                      onClick={() => setSelectedEvent(event)}
                    >
                      {event.resource_name}
                    </button>
                  ))}
                  {dayEvents.length > 3 && <div className="month-event-more">+{dayEvents.length - 3} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMiniCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startPadding = firstDay === 0 ? 6 : firstDay - 1;
    const cells = [
      ...Array.from({ length: startPadding }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];

    while (cells.length < 42) cells.push(null);

    return (
      <aside className="calendar-side-panel">
        <div className="mini-calendar-card">
          <div className="mini-calendar-top">
            <strong>{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong>
            <span className="mini-calendar-dots" aria-hidden="true"><i /><i /></span>
          </div>
          <div className="mini-weekdays">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="mini-calendar-grid">
            {cells.map((day, index) => {
              const isSelected = day === currentDate.getDate();
              return (
                <button
                  key={`${day || 'empty'}-${index}`}
                  type="button"
                  className={`mini-day ${day ? '' : 'empty'} ${isSelected ? 'selected' : ''}`}
                  disabled={!day}
                  onClick={() => day && setCurrentDate(new Date(year, month, day))}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        <div className="room-selector-card">
          <div className="room-selector-heading">
            <img src={classroomIcon} alt="" aria-hidden="true" />
            <span>Classroom</span>
          </div>
          <div className="room-selector-list">
            {rooms.map((room) => (
              <label key={room.id} className="room-selector-row">
                <input
                  type="checkbox"
                  checked={selectedRooms.includes(room.id)}
                  onChange={() => toggleRoom(room.id)}
                />
                <span>{room.name}</span>
              </label>
            ))}
          </div>
        </div>
      </aside>
    );
  };

  return (
    <div className="scheduling-calendar">
      <div className="calendar-toolbar">
        <div className="toolbar-left">
          <button className="btn btn-secondary" onClick={() => setCurrentDate(new Date())}>Today</button>
          <div className="date-chip">
            <button className="date-nav" onClick={() => navigateDate(-1)} aria-label="Previous date range">
              <FiChevronLeft />
            </button>
            <span>{formatDateHeader()}</span>
            <button className="date-nav" onClick={() => navigateDate(1)} aria-label="Next date range">
              <FiChevronRight />
            </button>
          </div>
        </div>

        <div className="view-switcher">
          {['day', 'week', 'month'].map((item) => (
            <button
              key={item}
              className={`btn ${view === item ? 'active' : ''}`}
              onClick={() => setView(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)} className="alert-close">x</button>
        </div>
      )}

      <div className="calendar-workspace">
        <div className="calendar-main-panel">
          {loading ? (
            <div className="loading">Loading calendar...</div>
          ) : (
            <>
              {view === 'day' && renderDayView()}
              {view === 'week' && renderWeekView()}
              {view === 'month' && renderMonthView()}
            </>
          )}
        </div>
        {renderMiniCalendar()}
      </div>

      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Booking Details</h3>
              <button className="modal-close" onClick={() => setSelectedEvent(null)}>x</button>
            </div>
            <div className="modal-body">
              <p><strong>Room:</strong> {selectedEvent.resource_name}</p>
              <p><strong>User:</strong> {selectedEvent.user_name}</p>
              <p><strong>Status:</strong> <span className={`badge badge-${String(selectedEvent.status || '').toLowerCase()}`}>{selectedEvent.status}</span></p>
              <p><strong>Priority:</strong> {selectedEvent.priority}</p>
              <p><strong>Participants:</strong> {selectedEvent.participants_count}</p>
              <p><strong>Purpose:</strong> {selectedEvent.purpose}</p>
              <p><strong>Time:</strong> {new Date(selectedEvent.start).toLocaleString()} - {new Date(selectedEvent.end).toLocaleTimeString()}</p>
              {selectedEvent.is_recurring && <p><span className="badge badge-info">Recurring Booking</span></p>}
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setSelectedEvent(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulingCalendar;
