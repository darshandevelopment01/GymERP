/**
 * Formats a date object or string into YYYY-MM-DD using the local timezone.
 * This avoids the off-by-one bug caused by toISOString() which converts to UTC.
 */
export const formatLocalDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};
