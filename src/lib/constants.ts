// API base URL - use environment variable or default to relative URL
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
// export const API_URL ="https://my-profile-server-api.onrender.com/api"
// https://my-profile-server-api.onrender.com/api
// MyPts value constants
export const DEFAULT_MYPTS_VALUE = 0.024; // Default value per MyPt in USD

// Currency conversion rates (direct conversions)
export const DIRECT_CONVERSIONS: Record<string, { value: number, symbol: string }> = {
  'XAF': { value: 13.61, symbol: 'FCFA' },  // 1 MyPt = 13.61 XAF
  'EUR': { value: 0.0208, symbol: '€' },    // 1 MyPt = 0.0208 EUR
  'GBP': { value: 0.0179, symbol: '£' },    // 1 MyPt = 0.0179 GBP
  'NGN': { value: 38.26, symbol: '₦' },     // 1 MyPt = 38.26 NGN
  'PKR': { value: 6.74, symbol: '₨' }       // 1 MyPt = 6.74 PKR
};

// Request timeout in milliseconds
export const REQUEST_TIMEOUT = 30000; // 30 seconds

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
