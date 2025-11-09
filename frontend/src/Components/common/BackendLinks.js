import React from 'react';

// Simple presentational component to show backend links side-by-side.
export default function BackendLinks() {
  const local = 'http://localhost:8081';
  const online = 'https://imeeet.onrender.com';

  const linkStyle = {
    fontSize: '12px',
    color: '#666',
    marginLeft: '8px'
  };

  return (
    <div className="backend-links" style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
      <a href={local} target="_blank" rel="noreferrer" style={linkStyle}>{local}</a>
      <span style={{color: '#bbb'}}>|</span>
      <a href={online} target="_blank" rel="noreferrer" style={linkStyle}>{online}</a>
    </div>
  );
}
