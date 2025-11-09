import React from 'react';
import './ColorPicker.css';

const ColorPicker = ({ colors, selectedColor, onColorSelect, onClose }) => {
  const defaultColors = [
    '#4285f4', // Blue
    '#34a853', // Green
    '#fbbc04', // Yellow
    '#ea4335', // Red
    '#f37e5c', // Orange
    '#9334e6', // Purple
    '#ff6d9e', // Pink
    '#00bcd4', // Cyan
    '#8bc34a', // Light Green
    '#ff9800', // Orange
    '#9c27b0', // Purple
    '#607d8b'  // Blue Grey
  ];

  const colorList = colors || defaultColors;

  return (
    <div className="color-picker-container" onClick={(e) => e.stopPropagation()}>
      <div className="color-picker-grid">
        {colorList.map((color, index) => (
          <div
            key={index}
            className={`color-picker-item ${selectedColor === color ? 'selected' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => {
              onColorSelect(color);
              if (onClose) onClose();
            }}
            title={color}
          >
            {selectedColor === color && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColorPicker;


