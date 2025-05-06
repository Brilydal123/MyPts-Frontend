/**
 * Simple logger utility wrapping console methods.
 * In a real application, you might use a more sophisticated logging library
 * like Winston or Pino, especially on the server-side.
 */

// Basic log function (maps to console.log)
const log = (...args: any[]): void => {
  console.log(...args);
};

// Warning function (maps to console.warn)
const warn = (...args: any[]): void => {
  console.warn(...args);
};

// Error function (maps to console.error)
const error = (...args: any[]): void => {
  console.error(...args);
};

// Debug function (maps to console.debug, often filtered in production)
const debug = (...args: any[]): void => {
  // You might want to conditionally enable this based on environment
  if (process.env.NODE_ENV !== 'production') {
    console.debug(...args);
  }
};

// Info function (often used similarly to log)
const info = (...args: any[]): void => {
  console.info(...args);
};

// Exporting as an object to match the import { logger } pattern
export const logger = {
  log,
  warn,
  error,
  debug,
  info,
};
