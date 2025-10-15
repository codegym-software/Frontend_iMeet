// components/TimeInsights.js
import React from 'react';
import './TimeInsight.css';

const TimeInsights = () => {
  return (
    <div className="time-insights">
      <h3>Time insights</h3>
      <div className="time-range">JAN: 1-31.2025</div>
      <div className="meeting-info">
        <strong>Girls in meeting</strong>
      </div>
      <div className="none-insights">
        <strong>NONE INSIGHTS</strong>
      </div>
    </div>
  );
};

export default TimeInsights;