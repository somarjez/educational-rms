import React from 'react';

const EventTimeline = ({ events, getStatusColor, styles }) => (
  <div className={styles.eventsTimeline}>
    {events.map((event) => (
      <div key={event.id} className={styles.timelineEvent}>
        <div 
          className={styles.eventIndicator}
          style={{ backgroundColor: getStatusColor(event.status) }}
        />
        <div className={styles.eventContent}>
          <div className={styles.eventTime}>{event.time}</div>
          <div className={styles.eventDetails}>
            <p className={styles.eventRoom}>{event.room_name}</p>
            <p className={styles.eventUser}>{event.user_name}</p>
          </div>
          <span 
            className={styles.eventStatusBadge}
            style={{ 
              backgroundColor: getStatusColor(event.status),
              color: 'white'
            }}
          >
            {event.status}
          </span>
        </div>
      </div>
    ))}
  </div>
);

export default EventTimeline;
