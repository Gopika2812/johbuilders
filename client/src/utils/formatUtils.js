export const formatUnitWithLabel = (unitId, projectType) => {
  if (!unitId || unitId === 'N/A') return 'N/A';
  
  const unitStr = String(unitId).trim();
  if (!unitStr) return 'N/A';

  // If unitStr already starts with Flat, Villa, Plot, or Unit, return as is
  if (/^(flat|villa|plot)\b/i.test(unitStr)) {
    return unitStr;
  }
  
  const typeStr = Array.isArray(projectType) 
    ? projectType.join(' ') 
    : String(projectType || '');

  if (/villa/i.test(typeStr)) {
    return `Villa ${unitStr}`;
  } else if (/flat|apartment|building/i.test(typeStr)) {
    return `Flat ${unitStr}`;
  } else if (/plot|land/i.test(typeStr)) {
    return `Plot ${unitStr}`;
  }
  return `Unit ${unitStr}`;
};

/**
 * Format a Date into Indian Standard Time (IST - Asia/Kolkata) with date and time
 * Example: "23/09/2026, 02:54:12 PM" or "23/09/2026, 02:54 PM"
 */
export const formatDateTimeIST = (date, includeSeconds = true) => {
  if (!date) return '-';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...(includeSeconds ? { second: '2-digit' } : {}),
      hour12: true
    });
  } catch (e) {
    return String(date);
  }
};

/**
 * Format a Date into Indian Standard Time (IST - Asia/Kolkata) Date only
 * Example: "23/09/2026"
 */
export const formatDateIST = (date) => {
  if (!date) return '-';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    return d.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (e) {
    return String(date);
  }
};

/**
 * Formats history note text so any embedded dates/timestamps are rendered in Indian Standard Time (IST)
 * Handles "Follow-up Scheduled: <date>. Remarks: <text>"
 */
export const formatHistoryNote = (note) => {
  if (!note || typeof note !== 'string') return note || '';
  
  // Replace embedded dates in "Follow-up Scheduled: <date_string>"
  return note.replace(/Follow-up Scheduled:\s*([^.]+?)(?=\.\s*Remarks:|$)/i, (match, datePart) => {
    const trimmed = datePart.trim();
    if (!trimmed) return match;
    try {
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        const isMidnightOnly = trimmed.includes('12:00:00 AM') || trimmed.includes('00:00:00') || (!trimmed.includes(':') && !trimmed.toLowerCase().includes('m'));
        const formatted = isMidnightOnly ? formatDateIST(d) : formatDateTimeIST(d, false);
        return `Follow-up Scheduled: ${formatted}`;
      }
    } catch (e) {}
    return match;
  });
};
