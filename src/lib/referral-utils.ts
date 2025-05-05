import { FRONTEND_URL } from './config';

/**
 * Fixes a referral link to use the correct frontend URL
 * This is needed because the backend might generate links with localhost URLs in development
 * 
 * @param shareableLink The original shareable link from the backend
 * @returns A corrected shareable link with the proper frontend URL
 */
export function fixReferralLink(shareableLink: string): string {
  if (!shareableLink) return '';
  
  try {
    // Parse the original URL to extract the referral code
    const url = new URL(shareableLink);
    const refCode = url.searchParams.get('ref');
    
    if (!refCode) return shareableLink;
    
    // Create a new URL with the correct frontend URL
    const correctUrl = new URL('/register', FRONTEND_URL);
    correctUrl.searchParams.set('ref', refCode);
    
    return correctUrl.toString();
  } catch (error) {
    console.error('Error fixing referral link:', error);
    return shareableLink;
  }
}
