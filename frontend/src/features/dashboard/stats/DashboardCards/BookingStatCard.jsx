import React from 'react';
import { motion } from 'framer-motion';

const BookingStatCard = ({ label, icon, value, change, period, transition, styles }) => (
  <motion.div className={styles.statCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={transition}>
    <div className={styles.statHeader}>
      <p className={styles.statLabel}>{label}</p>
      <div className={styles.statIcon}>{icon}</div>
    </div>
    <p className={styles.statValue}>{value}</p>
    <div className={styles.statFooter}>
      <span className={`${styles.statChange} ${change === 'neutral' ? styles.neutral : styles.positive}`}>{change === 'neutral' ? '—' : change}</span>
      <span className={styles.statPeriod}>{period}</span>
    </div>
  </motion.div>
);

export default BookingStatCard;
