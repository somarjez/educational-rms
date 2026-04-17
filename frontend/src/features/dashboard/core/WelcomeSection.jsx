import React from 'react';
import styles from './styles/WelcomeSection.module.css';

const WelcomeSection = ({ userName }) => {
  return (
    <div className={styles.welcomeSection}>
      <h2 className={styles.welcomeTitle}>Welcome back, {userName}!</h2>
      <p className={styles.welcomeText}>Here's what's happening with your resources today.</p>
    </div>
  );
};

export default WelcomeSection;
