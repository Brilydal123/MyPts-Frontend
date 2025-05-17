// API base URL - use environment variable or default to relative URL
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://my-profile-server-api.onrender.com/api';
// Make sure the URL includes the /api path

// API timeout in milliseconds
export const REQUEST_TIMEOUT = 60000; // 10 seconds

// Enable mock mode when server is not available
export const ENABLE_MOCK_MODE = true; // Set to false in production
// MyPts value constants
export const DEFAULT_MYPTS_VALUE = 0.026112; // Updated value per MyPt in USD (3.98% increase from 0.024)

// Currency conversion rates (direct conversions)
export const DIRECT_CONVERSIONS: Record<string, { value: number, symbol: string }> = {
  'XAF': { value: 14.4828, symbol: 'FCFA' },  // 1 MyPt = 14.4828 XAF
  'EUR': { value: 0.0216, symbol: '€' },      // 1 MyPt = 0.0216 EUR
  'GBP': { value: 0.0186, symbol: '£' },      // 1 MyPt = 0.0186 GBP
  'NGN': { value: 39.78, symbol: '₦' },       // 1 MyPt = 39.78 NGN
  'PKR': { value: 7.01, symbol: '₨' }         // 1 MyPt = 7.01 PKR
};

// Request timeout in milliseconds

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_PAGE = 1;

// Date format options
export const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
};

// Transaction types
export enum TransactionType {
  BUY_MYPTS = 'BUY_MYPTS',
  SELL_MYPTS = 'SELL_MYPTS',
  WITHDRAW_MYPTS = 'WITHDRAW_MYPTS',
  EARN_MYPTS = 'EARN_MYPTS',
  PURCHASE_PRODUCT = 'PURCHASE_PRODUCT',
  RECEIVE_PRODUCT_PAYMENT = 'RECEIVE_PRODUCT_PAYMENT',
  DONATION_SENT = 'DONATION_SENT',
  DONATION_RECEIVED = 'DONATION_RECEIVED',
  REFUND = 'REFUND',
  EXPIRE = 'EXPIRE',
  ADJUSTMENT = 'ADJUSTMENT'
}

// Transaction status
export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}
