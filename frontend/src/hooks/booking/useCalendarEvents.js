import { useState, useEffect } from 'react';
import { getCalendarEvents } from '../../services/schedulingApi';

const toLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const filterEventsForStudent = (eventList, user) => {
  const firstName = normalizeText(user?.first_name);
  const lastName = normalizeText(user?.last_name);
  const fullName = normalizeText(`${user?.first_name || ''} ${user?.last_name || ''}`);
  const email = normalizeText(user?.email);
  const username = normalizeText(user?.username);

  return eventList.filter((event) => {
    const eventUserName = normalizeText(event?.user_name);

    if (!eventUserName) {
      return false;
    }

    if (email && eventUserName === email) {
      return true;
    }

    if (fullName && eventUserName === fullName) {
      return true;
    }

    if (firstName && lastName && eventUserName.includes(firstName) && eventUserName.includes(lastName)) {
      return true;
    }

    if (username && eventUserName.includes(username)) {
      return true;
    }

    return false;
  });
};

const useCalendarEvents = (selectedDate, userRole, user) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const dateStr = toLocalDateString(selectedDate);
        const response = await getCalendarEvents(dateStr, dateStr);
        const normalizedEvents = Array.isArray(response)
          ? response
          : (response?.results || response?.data || []);
        const visibleEvents = user ? filterEventsForStudent(normalizedEvents, user) : normalizedEvents;
        setEvents(visibleEvents);
      } catch (error) {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [selectedDate, userRole, user]);

  return { events, loading };
};

export default useCalendarEvents;
