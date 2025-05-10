import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date with various options
 * @param date Date to format
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  // Default options for a standard date format
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  // Convert to Date object if string or number
  const dateObj = date instanceof Date ? date : new Date(date);

  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date provided to formatDate:', date);
    return 'Invalid Date';
  }

  try {
    // Use provided options or default
    const finalOptions = options || defaultOptions;
    return new Intl.DateTimeFormat('en-US', finalOptions).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    // Fallback to a simple format
    return dateObj.toLocaleString();
  }
}

/**
 * Format a date with time (datetime)
 * @param date Date to format
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted datetime string
 */
export function formatDateTime(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  // Default options for a standard datetime format
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  };

  // Convert to Date object if string or number
  const dateObj = date instanceof Date ? date : new Date(date);

  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date provided to formatDateTime:', date);
    return 'Invalid Date';
  }

  try {
    // Use provided options or default
    const finalOptions = options || defaultOptions;
    return new Intl.DateTimeFormat('en-US', finalOptions).format(dateObj);
  } catch (error) {
    console.error('Error formatting datetime:', error);
    // Fallback to a simple format
    return dateObj.toLocaleString();
  }
}
