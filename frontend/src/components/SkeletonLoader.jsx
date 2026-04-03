import React from 'react';
import './SkeletonLoader.css';

const SkeletonLoader = ({ variant = 'detail' }) => {
  if (variant === 'member-detail' || variant === 'enquiry-detail') {
    return (
      <div className="skeleton-container">
        {/* Profile Card Skeleton */}
        <div className="skeleton-card profile">
          <div className="skeleton-avatar" />
          <div className="skeleton-info">
            <div className="skeleton-line title" />
            <div className="skeleton-line subtitle" />
          </div>
          <div className="skeleton-badge" />
        </div>

        {/* Quick Actions Skeleton */}
        <div className="skeleton-actions">
          <div className="skeleton-btn" />
          <div className="skeleton-btn" />
          <div className="skeleton-btn" />
        </div>

        {/* Tabs Skeleton */}
        <div className="skeleton-tabs">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-tab-item" />
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="skeleton-content-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton-info-item">
              <div className="skeleton-icon-box" />
              <div className="skeleton-text-group">
                <div className="skeleton-line label" />
                <div className="skeleton-line value" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default / List Skeleton
  return (
    <div className="skeleton-list">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="skeleton-list-item">
          <div className="skeleton-avatar-small" />
          <div className="skeleton-line-full" />
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
