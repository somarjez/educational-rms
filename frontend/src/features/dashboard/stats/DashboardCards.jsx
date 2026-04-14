import React from 'react';
import BookingStatCard from './DashboardCards/BookingStatCard';
import { DASHBOARD_CARD_CONFIGS } from './constants/dashboardCardConfigs';
import styles from './styles/DashboardCards.module.css';

const DashboardCards = ({ bookingStats }) => {
  return (
    <div className={styles.statsGrid}>
      {DASHBOARD_CARD_CONFIGS.map((card) => {
        const Icon = card.Icon;
        return (
          <BookingStatCard
            key={card.key}
            label={card.label}
            icon={<Icon size={card.iconSize} color={card.iconColor} />}
            value={bookingStats?.[card.valueKey] ?? card.fallback}
            change={card.change}
            period={card.period}
            transition={{ duration: card.duration }}
            styles={styles}
          />
        );
      })}
    </div>
  );
};

export default DashboardCards;
