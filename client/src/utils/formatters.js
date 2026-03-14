/**
 * Format a timestamp into HH:MM
 */
export const formatTime = (ts) =>
  new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/**
 * Format a date as "Mar 14, 2026"
 */
export const formatDate = (ts) =>
  new Date(ts).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });

/**
 * Truncate a string to maxLength
 */
export const truncate = (str, maxLength = 30) =>
  str?.length > maxLength ? `${str.slice(0, maxLength)}…` : str;

/**
 * Generate a random color hex from a string (for consistent avatar colors)
 */
export const stringToColor = (str = '') => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${hash % 360}, 65%, 55%)`;
};
