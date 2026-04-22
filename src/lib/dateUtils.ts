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
