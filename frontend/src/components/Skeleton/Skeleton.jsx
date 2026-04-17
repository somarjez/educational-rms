import React from 'react';
import './styles/Skeleton.css';

export const SkeletonLoader = ({ width = '100%', height = '20px', borderRadius = '8px', marginBottom = '1rem' }) => (
  <div
    className="skeleton"
    style={{
      width,
      height,
      borderRadius,
      marginBottom,
    }}
  />
);

export const StatCardSkeleton = () => (
  <div className="stat-card-skeleton">
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <SkeletonLoader width="100px" height="16px" marginBottom="0" />
      <SkeletonLoader width="56px" height="56px" borderRadius="12px" marginBottom="0" />
    </div>
    <SkeletonLoader width="80px" height="32px" marginBottom="1rem" />
    <SkeletonLoader width="100%" height="1px" marginBottom="1.5rem" />
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <SkeletonLoader width="80px" height="14px" marginBottom="0" />
      <SkeletonLoader width="60px" height="14px" marginBottom="0" />
    </div>
  </div>
);

export const ActivityItemSkeleton = () => (
  <div className="activity-item-skeleton">
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
      <SkeletonLoader width="150px" height="16px" marginBottom="0" />
      <SkeletonLoader width="80px" height="24px" borderRadius="20px" marginBottom="0" />
    </div>
    <SkeletonLoader width="200px" height="14px" marginBottom="0.5rem" />
  </div>
);

export const DashboardSkeleton = () => (
  <div className="dashboard-skeleton">
    {/* Header */}
    <div style={{ padding: '2rem', background: 'linear-gradient(135deg, #1a365d 0%, #2c5282 50%, #2b6cb0 100%)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <SkeletonLoader width="56px" height="56px" borderRadius="12px" marginBottom="0" />
          <div>
            <SkeletonLoader width="300px" height="28px" marginBottom="0.5rem" />
            <SkeletonLoader width="250px" height="16px" marginBottom="0" />
          </div>
        </div>
        <SkeletonLoader width="120px" height="40px" borderRadius="10px" marginBottom="0" />
      </div>
    </div>

    {/* Content */}
    <div style={{ padding: '3rem', flex: 1 }}>
      <SkeletonLoader width="300px" height="32px" marginBottom="1rem" />
      <SkeletonLoader width="400px" height="18px" marginBottom="3rem" />

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem', marginBottom: '3rem' }}>
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Content Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        {/* Activity List */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)' }}>
          <SkeletonLoader width="200px" height="24px" marginBottom="1.75rem" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map((i) => (
              <ActivityItemSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)' }}>
          <SkeletonLoader width="150px" height="24px" marginBottom="1.75rem" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map((i) => (
              <SkeletonLoader key={i} width="100%" height="80px" borderRadius="12px" />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const LoginRegisterSkeleton = () => (
  <div className="auth-skeleton">
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', minHeight: '100vh' }}>
      {/* Brand Side */}
      <div style={{
        background: 'linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%)',
        padding: '4rem 3rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <SkeletonLoader width="120px" height="120px" borderRadius="24px" marginBottom="2rem" />
        <SkeletonLoader width="300px" height="40px" marginBottom="1rem" />
        <SkeletonLoader width="250px" height="20px" marginBottom="3rem" />
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '12px' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <SkeletonLoader width="40px" height="40px" borderRadius="10px" marginBottom="0" />
                <SkeletonLoader width="200px" height="16px" marginBottom="0" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form Side */}
      <div style={{
        background: '#f8fafc',
        padding: '4rem 3rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ width: '100%', maxWidth: '480px' }}>
          <SkeletonLoader width="200px" height="32px" marginBottom="0.5rem" />
          <SkeletonLoader width="300px" height="18px" marginBottom="2rem" />
          
          {/* Form fields */}
          {[1, 2].map((i) => (
            <div key={i}>
              <SkeletonLoader width="100px" height="16px" marginBottom="0.5rem" />
              <SkeletonLoader width="100%" height="44px" marginBottom="1.25rem" borderRadius="12px" />
            </div>
          ))}
          
          <SkeletonLoader width="100%" height="48px" marginBottom="1.5rem" borderRadius="10px" />
          <SkeletonLoader width="100%" height="18px" marginBottom="0" />
        </div>
      </div>
    </div>
  </div>
);

