import React from 'react';

const SkeletonUI = ({ variant = 'card', className = '' }) => {
  const getSkeletonClass = () => {
    switch (variant) {
      case 'text':
        return 'skeleton-text';
      case 'circle':
        return 'skeleton-circle';
      case 'post':
        return 'skeleton-post-container';
      case 'card':
      default:
        return 'skeleton-card';
    }
  };

  if (variant === 'post') {
    return (
      <div className={`skeleton-pulse ${getSkeletonClass()} ${className}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div className="skeleton-pulse skeleton-circle" />
          <div style={{ flex: 1 }}>
            <div className="skeleton-pulse skeleton-text" style={{ width: '40%', height: '12px' }} />
            <div className="skeleton-pulse skeleton-text" style={{ width: '25%', height: '10px' }} />
          </div>
        </div>
        <div className="skeleton-pulse skeleton-text" style={{ width: '90%' }} />
        <div className="skeleton-pulse skeleton-text" style={{ width: '70%' }} />
        <div className="skeleton-pulse skeleton-card" style={{ height: '120px', marginTop: '16px', borderRadius: '12px' }} />
      </div>
    );
  }

  return <div className={`skeleton-pulse ${getSkeletonClass()} ${className}`} />;
};

export default SkeletonUI;
