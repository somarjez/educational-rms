// dateUtils.js - Utility functions for date formatting
export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

export function formatTime(timeString) {
  if (!timeString) return 'N/A';
  return timeString.substring(0, 5); // "HH:MM:SS" -> "HH:MM"
}
