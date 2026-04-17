import React from 'react';
import BookingStatCardRedesign from './DashboardCards/BookingStatCardRedesign';
import { DASHBOARD_CARD_CONFIGS } from './constants/dashboardCardConfigs';
import styles from './styles/DashboardCards.module.css';

const DashboardCards = ({ bookingStats }) => {
  return (
    <div className={styles.statsGrid}>
      {DASHBOARD_CARD_CONFIGS.map((card) => {
        const Icon = card.Icon;

        return (
          <BookingStatCardRedesign
            key={card.key}
            tone={card.key}
            label={card.label}
            icon={<Icon size={card.iconSize} />}
            value={bookingStats?.[card.valueKey] ?? card.fallback}
            subtitle={card.subtitle}
            detail={card.detail}
            transition={{ duration: card.duration }}
            styles={styles}
          />
        );
      })}
    </div>
  );
};

export default DashboardCards;
