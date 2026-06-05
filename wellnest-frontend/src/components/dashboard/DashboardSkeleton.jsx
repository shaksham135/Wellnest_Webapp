import React from 'react';

const Skeleton = ({ width, height, borderRadius = '12px', marginBottom = '12px' }) => (
  <div className="skeleton-pulse" style={{ 
    width, height, borderRadius, marginBottom,
    background: 'var(--card-border)',
    opacity: 0.1
  }} />
);

const DashboardSkeleton = () => {
  return (
    <div className="dashboard-container" style={{ opacity: 0.7 }}>
      <div className="dashboard-header">
        <Skeleton width="250px" height="32px" />
        <Skeleton width="350px" height="20px" />
      </div>

      <div className="dashboard-grid">
        {/* Main Stats Row */}
        <div className="dash-box" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <Skeleton width="150px" height="24px" />
            <Skeleton width="80px" height="24px" borderRadius="20px" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i}>
                <Skeleton width="100%" height="60px" />
                <Skeleton width="60%" height="16px" />
              </div>
            ))}
          </div>
        </div>

        {/* Small boxes */}
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="dash-box">
             <Skeleton width="40px" height="40px" borderRadius="50%" />
             <Skeleton width="70%" height="24px" />
             <Skeleton width="100%" height="80px" />
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0% { opacity: 0.05; }
          50% { opacity: 0.15; }
          100% { opacity: 0.05; }
        }
        .skeleton-pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};

export default DashboardSkeleton;
