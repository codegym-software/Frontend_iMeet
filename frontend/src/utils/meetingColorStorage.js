// Utility to manage meeting colors in localStorage (frontend-only)

const STORAGE_KEY = 'meeting_colors';

/**
 * Get all meeting colors from localStorage
 * @returns {Object} Map of meetingId -> color
 */
export const getMeetingColors = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Error reading meeting colors from localStorage:', error);
  }
  return {};
};

/**
 * Save a meeting color to localStorage
 * @param {number|string} meetingId - Meeting ID
 * @param {string} color - Color hex code
 */
export const saveMeetingColor = (meetingId, color) => {
  try {
    const colors = getMeetingColors();
    colors[meetingId] = color;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
  } catch (error) {
    console.warn('Error saving meeting color to localStorage:', error);
  }
};

/**
 * Get color for a specific meeting
 * @param {number|string} meetingId - Meeting ID
 * @returns {string|null} Color hex code or null if not found
 */
export const getMeetingColor = (meetingId) => {
  const colors = getMeetingColors();
  return colors[meetingId] || null;
};

/**
 * Remove a meeting color from localStorage (when meeting is deleted)
 * @param {number|string} meetingId - Meeting ID
 */
export const removeMeetingColor = (meetingId) => {
  try {
    const colors = getMeetingColors();
    delete colors[meetingId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
  } catch (error) {
    console.warn('Error removing meeting color from localStorage:', error);
  }
};

/**
 * Clear all meeting colors from localStorage
 */
export const clearAllMeetingColors = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Error clearing meeting colors from localStorage:', error);
  }
};




