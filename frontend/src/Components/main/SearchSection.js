// components/SearchBar.js
import React from 'react';
import './SearchSection.css';

const SearchSection = () => {
  return (
    <div className="search-section">
      <button className="search-button">
        <span className="search-text">Search for people...</span>
      </button>
    </div>
  );
};

export default SearchSection;