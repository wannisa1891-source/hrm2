/**
 * Returns the start and end dates of the current fiscal year (Oct 1 - Sep 30).
 * @param date Reference date (default now)
 */
export const getCurrentFiscalYearRange = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11
  
  // If month is Oct (9) or later, fiscal year is current year to next year
  // If month is before Oct, fiscal year is previous year to current year
  if (month >= 9) {
    return {
      start: new Date(year, 9, 1),
      end: new Date(year + 1, 8, 30, 23, 59, 59)
    };
  } else {
    return {
      start: new Date(year - 1, 9, 1),
      end: new Date(year, 8, 30, 23, 59, 59)
    };
  }
};

/**
 * Checks if a date is within the current fiscal year.
 */
export const isInCurrentFiscalYear = (checkDate: string | Date) => {
  const d = new Date(checkDate);
  const range = getCurrentFiscalYearRange();
  return d >= range.start && d <= range.end;
};

/**
 * Formats a Date object or string to YYYY-MM-DD.
 */
export const toDateStr = (date: Date | string | null): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Calculates work duration in years, months, and days.
 */
export const calculateWorkDuration = (startDate: string | Date | null, endDate: string | Date = new Date()) => {
  if (!startDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime())) return null;

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months, days };
};

/**
 * Formats duration object into a Thai string.
 */
export const formatDurationThai = (duration: { years: number, months: number, days: number } | null) => {
  if (!duration) return '-';
  const parts = [];
  if (duration.years > 0) parts.push(`${duration.years} ปี`);
  if (duration.months > 0) parts.push(`${duration.months} เดือน`);
  if (duration.days > 0) parts.push(`${duration.days} วัน`);
  return parts.length > 0 ? parts.join(' ') : '0 วัน';
};
