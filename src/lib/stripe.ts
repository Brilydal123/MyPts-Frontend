import { loadStripe, Stripe } from '@stripe/stripe-js';

// Initialize Stripe
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    // Get the publishable key from the environment or from the API
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      console.error('Stripe publishable key is missing');
      return Promise.resolve(null);
    }
    
    stripePromise = loadStripe(publishableKey);
  }
  
  return stripePromise;
};

// Function to fetch Stripe configuration from the backend
export const getStripeConfig = async () => {
  try {
    const response = await fetch('/api/stripe/config');
    if (!response.ok) {
      throw new Error('Failed to fetch Stripe configuration');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching Stripe configuration:', error);
    return null;
  }
};
