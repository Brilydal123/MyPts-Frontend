'use client';

import { toast } from 'sonner';

// Constants for toast IDs
const OFFLINE_TOAST_ID = 'network-offline-toast';
const ONLINE_TOAST_ID = 'network-online-toast';

/**
 * Show a persistent toast notification when the user goes offline
 */
export function showOfflineToast() {
  // First dismiss any existing offline toast to prevent duplicates
  toast.dismiss(OFFLINE_TOAST_ID);

  // Show a new offline toast with infinite duration
  toast.error('You are offline', {
    id: OFFLINE_TOAST_ID,
    description: 'Please check your internet connection',
    duration: Infinity,
    // Add a close button for manual dismissal
    action: {
      label: 'Dismiss',
      onClick: () => {
        toast.dismiss(OFFLINE_TOAST_ID);
        // Also clear the localStorage flag when manually dismissed
        if (typeof window !== 'undefined') {
          localStorage.removeItem('offline_toast_shown');
        }
      },
    },
  });

  // Store in localStorage that we've shown the offline toast
  if (typeof window !== 'undefined') {
    localStorage.setItem('offline_toast_shown', 'true');
  }
}

/**
 * Dismiss the offline toast and show a brief "back online" toast
 */
export function showOnlineToast() {
  // Always dismiss the offline toast first
  toast.dismiss(OFFLINE_TOAST_ID);

  // Always show the "back online" toast
  toast.success('You are back online', {
    id: ONLINE_TOAST_ID,
    description: 'Your internet connection has been restored',
    duration: 5000, // Show for longer (5 seconds)
    // Make it more noticeable with a custom style
    style: {
      backgroundColor: '#ecfdf5', // Light green background
      borderLeft: '4px solid #10b981', // Green border
      fontWeight: 500, // Slightly bolder text
    },
  });

  // Clear the localStorage flag
  if (typeof window !== 'undefined') {
    localStorage.removeItem('offline_toast_shown');
  }
}

/**
 * Dismiss all network-related toasts
 */
export function dismissNetworkToasts() {
  toast.dismiss(OFFLINE_TOAST_ID);
  toast.dismiss(ONLINE_TOAST_ID);

  // Clear the localStorage flag
  if (typeof window !== 'undefined') {
    localStorage.removeItem('offline_toast_shown');
  }
}
