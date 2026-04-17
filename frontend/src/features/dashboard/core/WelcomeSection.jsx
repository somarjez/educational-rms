import React from 'react';
import adminDashboardArt from '../../../assets/dashboard/admin-dashboard.svg';
import facultyDashboardArt from '../../../assets/dashboard/faculty-dashboard.svg';
import studentDashboardArt from '../../../assets/dashboard/student-dashboard.svg';
import styles from './styles/WelcomeSection.module.css';

const normalizeRole = (role) => String(role || '').toUpperCase();

const roleConfig = {
  ADMIN: {
    eyebrow: 'Educational Resource Management',
    image: adminDashboardArt,
    alt: 'Admin dashboard illustration',
    subtitle: 'Monitor approvals, schedules, rooms, and utilization from one admin workspace.',
  },
  FACULTY: {
    eyebrow: 'Educational Resource Management',
    image: facultyDashboardArt,
    alt: 'Faculty dashboard illustration',
    subtitle: 'Manage schedules, reservations, and classroom activity from one faculty workspace.',
  },
  STUDENT: {
    eyebrow: 'Educational Resource Management',
    image: studentDashboardArt,
    alt: 'Student dashboard illustration',
    subtitle: "Here's what's happening with your resources today.",
  },
};

const WelcomeSection = ({ userName, userRole }) => {
  const role = normalizeRole(userRole);
  const config = roleConfig[role] || roleConfig.STUDENT;

  return (
    <div className={styles.welcomeSection}>
      <div className={styles.welcomeContent}>
        <div className={styles.textContent}>
          <span className={styles.eyebrow}>{config.eyebrow}</span>
          <h2 className={styles.welcomeTitle}>WELCOME BACK, {String(userName || 'USERNAME').toUpperCase()}!</h2>
          <p className={styles.welcomeText}>{config.subtitle}</p>
          <span className={styles.welcomeIndicator} aria-hidden="true" />
        </div>
        <div className={styles.visualWrap}>
          <img src={config.image} alt={config.alt} className={styles.heroArt} />
        </div>
      </div>
    </div>
  );
};

export default WelcomeSection;
