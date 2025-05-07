/**
 * Transaction types
 */
export enum TransactionType {
  BUY_MYPTS = 'BUY_MYPTS',
  SELL_MYPTS = 'SELL_MYPTS',
  EARN_MYPTS = 'EARN_MYPTS',
  PURCHASE_PRODUCT = 'PURCHASE_PRODUCT',
  RECEIVE_PRODUCT_PAYMENT = 'RECEIVE_PRODUCT_PAYMENT',
  DONATION_SENT = 'DONATION_SENT',
  DONATION_RECEIVED = 'DONATION_RECEIVED',
  REFUND = 'REFUND',
  EXPIRE = 'EXPIRE',
  ADJUSTMENT = 'ADJUSTMENT'
}

/**
 * Transaction status
 */
export enum TransactionStatus {
  PENDING = 'PENDING',
  RESERVED = 'RESERVED',  // New status for sell transactions that are pending approval
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED'   // New status for rejected transactions
}

/**
 * Supply action types
 */
export enum MyPtsSupplyAction {
  ISSUE = 'ISSUE',
  BURN = 'BURN',
  RESERVE_TO_CIRCULATION = 'RESERVE_TO_CIRCULATION',
  CIRCULATION_TO_RESERVE = 'CIRCULATION_TO_RESERVE',
  ADJUST_MAX_SUPPLY = 'ADJUST_MAX_SUPPLY'
}

/**
 * MyPts transaction
 */
export interface MyPtsTransaction {
  _id: string;
  profileId: string;
  type: TransactionType;
  amount: number;
  balance: number;
  description: string;
  status: TransactionStatus;
  metadata?: Record<string, any>;
  referenceId?: string;
  relatedTransaction?: string;
  hubLogId?: string; // Reference to related hub log entry
  createdAt: string;
  updatedAt: string;
}

/**
 * MyPts balance
 */
export interface MyPtsBalance {
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  lastTransaction?: string;
  value: {
    valuePerMyPt: number;
    currency: string;
    symbol: string;
    totalValue: number;
    formattedValue: string;
  }
}

/**
 * MyPts value
 */
export interface MyPtsValue {
  valuePerPts: number;
  valuePerMyPt?: number; // Added for backward compatibility
  baseCurrency: string;
  baseSymbol: string;
  symbol?: string; // Added for backward compatibility
  lastUpdated: string;
  exchangeRates: {
    currency: string;
    rate: number;
    symbol: string;
  }[];
  totalSupply: number;
  totalValueUSD: number;
  previousValue?: number;
  changePercentage?: number;
}

/**
 * MyPts hub state
 */
export interface MyPtsHubState {
  totalSupply: number;
  circulatingSupply: number;
  reserveSupply: number;
  holdingSupply: number;
  maxSupply: number | null;
  valuePerMyPt: number;
  lastAdjustment: string;
  updatedAt: string;
}

/**
 * MyPts hub log
 */
export interface MyPtsHubLog {
  _id: string;
  action: MyPtsSupplyAction;
  amount: number;
  reason: string;
  adminId?: string;
  metadata?: Record<string, any>;
  totalSupplyBefore: number;
  totalSupplyAfter: number;
  circulatingSupplyBefore: number;
  circulatingSupplyAfter: number;
  reserveSupplyBefore: number;
  reserveSupplyAfter: number;
  valuePerMyPt: number;
  transactionId?: string; // Reference to related user transaction
  createdAt: string;
}

/**
 * Profile
 */
export interface Profile {
  _id: string;
  name: string;
  avatar?: string;
  isAdmin: boolean;
}
