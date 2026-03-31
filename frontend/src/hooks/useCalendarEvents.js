import { useState, useEffect } from 'react';
import { getCalendarEvents } from '../services/schedulingApi';

const useCalendarEvents = (selectedDate) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const response = await getCalendarEvents(dateStr, dateStr);
        setEvents(response.data);
      } catch (error) {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [selectedDate]);

  return { events, loading };
};

export default useCalendarEvents;
