import React from 'react';
import { motion } from 'framer-motion';

const BookingStatCardRedesign = ({ label, icon, value, subtitle, detail, transition, styles, tone }) => {
  const toneClass = styles[`${tone}Card`] || '';

  return (
    <motion.div
      className={`${styles.statCard} ${toneClass}`.trim()}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
    >
      <div className={styles.statHeader}>
        <div className={styles.statIcon} aria-hidden="true">{icon}</div>
        <p className={styles.statLabel}>{label}</p>
      </div>

      <div className={styles.statBody}>
        <p className={styles.statValue}>{value}</p>
        <div className={styles.statFooter}>
          <span className={styles.statSubtitle}>{subtitle}</span>
          <span className={styles.statDetail}>{detail}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default BookingStatCardRedesign;
