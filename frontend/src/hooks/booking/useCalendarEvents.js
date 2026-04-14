import { useState, useEffect, useCallback } from 'react';
import { getCalendarEvents } from '../../services/schedulingApi';

const useCalendarEvents = (selectedDate) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      // Fetch events for the selected day by passing same start and end date
      const response = await getCalendarEvents(dateStr, dateStr);
      setEvents(Array.isArray(response) ? response : response.results || []);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const refetch = useCallback(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, refetch };
};

export default useCalendarEvents;
