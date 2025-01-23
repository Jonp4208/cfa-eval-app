import { handleError, ErrorCategory } from './errorHandler.js';

/**
 * Convert UTC date to store's local timezone
 */
export const toStoreLocalTime = (date, storeTimezone = 'America/New_York') => {
  try {
    return new Date(date.toLocaleString('en-US', { timeZone: storeTimezone }));
  } catch (error) {
    throw handleError(error, ErrorCategory.SYSTEM, {
      date,
      storeTimezone,
      function: 'toStoreLocalTime'
    });
  }
};

/**
 * Convert store's local time to UTC
 */
export const toUTC = (date, storeTimezone = 'America/New_York') => {
  try {
    const utcDate = new Date(date);
    const tzOffset = new Date(date.toLocaleString('en-US', { timeZone: storeTimezone })).getTime() - utcDate.getTime();
    return new Date(utcDate.getTime() - tzOffset);
  } catch (error) {
    throw handleError(error, ErrorCategory.SYSTEM, {
      date,
      storeTimezone,
      function: 'toUTC'
    });
  }
};

/**
 * Get start of day in store's timezone
 */
export const getStartOfDay = (date, storeTimezone = 'America/New_York') => {
  try {
    const localDate = toStoreLocalTime(date, storeTimezone);
    localDate.setHours(0, 0, 0, 0);
    return toUTC(localDate, storeTimezone);
  } catch (error) {
    throw handleError(error, ErrorCategory.SYSTEM, {
      date,
      storeTimezone,
      function: 'getStartOfDay'
    });
  }
};

/**
 * Get end of day in store's timezone
 */
export const getEndOfDay = (date, storeTimezone = 'America/New_York') => {
  try {
    const localDate = toStoreLocalTime(date, storeTimezone);
    localDate.setHours(23, 59, 59, 999);
    return toUTC(localDate, storeTimezone);
  } catch (error) {
    throw handleError(error, ErrorCategory.SYSTEM, {
      date,
      storeTimezone,
      function: 'getEndOfDay'
    });
  }
};

/**
 * Check if date is during DST for store's timezone
 */
export const isDST = (date, storeTimezone = 'America/New_York') => {
  try {
    const jan = new Date(date.getFullYear(), 0, 1);
    const jul = new Date(date.getFullYear(), 6, 1);
    const janOffset = new Date(jan.toLocaleString('en-US', { timeZone: storeTimezone })).getTimezoneOffset();
    const julOffset = new Date(jul.toLocaleString('en-US', { timeZone: storeTimezone })).getTimezoneOffset();
    const stdTimezoneOffset = Math.max(janOffset, julOffset);
    const dateOffset = new Date(date.toLocaleString('en-US', { timeZone: storeTimezone })).getTimezoneOffset();
    return dateOffset < stdTimezoneOffset;
  } catch (error) {
    throw handleError(error, ErrorCategory.SYSTEM, {
      date,
      storeTimezone,
      function: 'isDST'
    });
  }
};

/**
 * Get store's business hours in UTC
 */
export const getStoreBusinessHours = (date, storeTimezone = 'America/New_York', businessHours = { start: 9, end: 17 }) => {
  try {
    const localDate = toStoreLocalTime(date, storeTimezone);
    
    // Set business hours start
    const startTime = new Date(localDate);
    startTime.setHours(businessHours.start, 0, 0, 0);
    
    // Set business hours end
    const endTime = new Date(localDate);
    endTime.setHours(businessHours.end, 0, 0, 0);
    
    return {
      start: toUTC(startTime, storeTimezone),
      end: toUTC(endTime, storeTimezone)
    };
  } catch (error) {
    throw handleError(error, ErrorCategory.SYSTEM, {
      date,
      storeTimezone,
      businessHours,
      function: 'getStoreBusinessHours'
    });
  }
};

/**
 * Adjust date to next business day if it falls on weekend
 */
export const adjustToBusinessDay = (date, storeTimezone = 'America/New_York') => {
  try {
    const localDate = toStoreLocalTime(date, storeTimezone);
    const day = localDate.getDay();
    
    // If weekend, move to next Monday
    if (day === 0) { // Sunday
      localDate.setDate(localDate.getDate() + 1);
    } else if (day === 6) { // Saturday
      localDate.setDate(localDate.getDate() + 2);
    }
    
    return toUTC(localDate, storeTimezone);
  } catch (error) {
    throw handleError(error, ErrorCategory.SYSTEM, {
      date,
      storeTimezone,
      function: 'adjustToBusinessDay'
    });
  }
}; 