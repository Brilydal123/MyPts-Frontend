/**
 * Profile Adapter
 *
 * This adapter transforms raw profile data from the API into a consistent format
 * that can be used throughout the frontend application.
 */

/**
 * Adapts a raw profile object to a consistent format for the frontend
 * @param rawProfile The raw profile data from the API
 * @returns A formatted profile object with consistent structure
 */
export function adaptProfile(rawProfile: any): any {
  if (!rawProfile) return null;

  // Extract data from nested _rawProfile if it exists
  const extractNestedData = (profile: any): Record<string, any> => {
    if (!profile) return {};

    // Check for nested _rawProfile
    const nestedRawProfile = profile._rawProfile;
    if (!nestedRawProfile) return profile;

    // Merge data from nested _rawProfile
    return {
      ...profile,
      ...extractNestedData(nestedRawProfile)
    };
  };

  // Extract all data from nested _rawProfile structures
  const extractedProfile = extractNestedData(rawProfile);

  // Helper function to sanitize any object
  const sanitizeObject = (obj: any): Record<string, any> | string | number => {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item));
    }

    const sanitized: Record<string, any> = {};
    Object.entries(obj as Record<string, any>).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        sanitized[key] = 0;
      } else if (typeof value === 'object') {
        // For nested objects, store a summary instead of the raw object
        if (Array.isArray(value)) {
          sanitized[key] = `${value.length} items`;
        } else {
          const keys = Object.keys(value);
          sanitized[key] = `${keys.length} properties`;
        }
      } else {
        sanitized[key] = value;
      }
    });
    return sanitized;
  };

  // Process analytics data to handle nested objects
  if (extractedProfile.analytics && typeof extractedProfile.analytics === 'object') {
    extractedProfile.analytics = sanitizeObject(extractedProfile.analytics);
  }

  // Process stats data
  if (extractedProfile.stats && typeof extractedProfile.stats === 'object') {
    extractedProfile.stats = sanitizeObject(extractedProfile.stats);
  }

  // Return a complete profile object with all necessary fields
  // and fallbacks for missing data
  return {
    // Basic identification
    _id: extractedProfile._id || extractedProfile.id,
    id: extractedProfile._id || extractedProfile.id,
    secondaryId: extractedProfile.secondaryId || null, // Include the secondary ID

    // Display information
    name: extractedProfile.name || extractedProfile.profileInformation?.username || 'Unnamed Profile',
    username: extractedProfile.username || extractedProfile.profileInformation?.username,
    description: getProfileDescription(extractedProfile),

    // Type information
    profileCategory: extractedProfile.profileCategory,
    profileType: extractedProfile.profileType,
    type: {
      category: extractedProfile.type?.category || extractedProfile.profileCategory || 'individual',
      subtype: extractedProfile.type?.subtype || extractedProfile.profileType || 'personal',
    },

    // Owner information
    owner: getProfileOwner(extractedProfile),

    // Dates
    createdAt: getProfileCreatedDate(extractedProfile),
    updatedAt: extractedProfile.updatedAt || extractedProfile.profileInformation?.updatedAt,

    // Status
    verificationStatus: extractedProfile.verificationStatus || { isVerified: false, badge: 'none' },
    claimed: !!extractedProfile.claimed || !!extractedProfile.profileInformation?.username,

    // MyPts information
    myPtsBalance: extractedProfile.myPtsBalance || extractedProfile.balance || extractedProfile.ProfileMypts?.currentBalance || 0,
    lifetimeMypts: extractedProfile.lifetimeMypts || extractedProfile.balanceInfo?.lifetimeEarned || extractedProfile.ProfileMypts?.lifetimeMypts || 0,
    // Also preserve the original ProfileMypts object for direct access
    ProfileMypts: extractedProfile.ProfileMypts || { currentBalance: 0, lifetimeMypts: 0 },

    // Additional information
    sections: (extractedProfile.sections || []).map((section: any) => ({
      ...section,
      fields: section.fields ? section.fields.map((field: any) => ({
        ...field,
        value: typeof field.value === 'object' ?
          Array.isArray(field.value) ? `${field.value.length} items` :
          `${Object.keys(field.value || {}).length} properties` :
          field.value
      })) : []
    })),
    analytics: sanitizeObject(extractedProfile.analytics || {}),
    stats: sanitizeObject(extractedProfile.stats || {}),

    // Profile information
    profileInformation: sanitizeObject(extractedProfile.profileInformation || {}),

    // Profile format
    ProfileFormat: sanitizeObject(extractedProfile.ProfileFormat || {}),

    // Profile QR code
    ProfileQrCode: extractedProfile.ProfileQrCode || {},

    // Profile location
    profileLocation: extractedProfile.profileLocation || {},

    // Profile products
    ProfileProducts: extractedProfile.ProfileProducts || { type: 'None' },

    // Profile referral
    ProfileReferal: extractedProfile.ProfileReferal || { referals: 0 },

    // Profile badges
    ProfileBadges: extractedProfile.ProfileBadges || { badges: [] },

    // Include the raw profile for debugging
    _rawProfile: process.env.NODE_ENV === 'development' ? rawProfile : undefined
  };
}

/**
 * Adapts an array of raw profiles to a consistent format
 * @param rawProfiles Array of raw profile data from the API
 * @returns Array of formatted profile objects
 */
export function adaptProfiles(rawProfiles: any[]): any[] {
  if (!rawProfiles || !Array.isArray(rawProfiles)) return [];
  return rawProfiles.map(profile => adaptProfile(profile));
}

/**
 * Extracts a description from the profile data
 */
function getProfileDescription(profile: any): string {
  // Try to find a description in various places
  if (profile.description && profile.description !== '') return profile.description;

  // Look in sections for a bio field
  const basicSection = profile.sections?.find((s: any) => s.key === 'basic');
  if (basicSection) {
    const bioField = basicSection.fields?.find((f: any) => f.key === 'bio');
    if (bioField && bioField.value) return bioField.value;
  }

  // Check in profileInformation
  if (profile.profileInformation?.bio) return profile.profileInformation.bio;

  return 'No description available';
}

/**
 * Extracts owner information from the profile data
 */
function getProfileOwner(profile: any): any {
  // Check direct owner property
  if (profile.owner) return profile.owner;

  // Check in profileInformation.creator
  if (profile.profileInformation?.creator) {
    if (typeof profile.profileInformation.creator === 'string') {
      return profile.profileInformation.creator;
    }
    return profile.profileInformation.creator.$oid || profile.profileInformation.creator;
  }

  // Check in templatedId (some profiles use this as owner reference)
  if (profile.templatedId) {
    if (typeof profile.templatedId === 'string') {
      return profile.templatedId;
    }
    return profile.templatedId.$oid || profile.templatedId;
  }

  return null;
}

/**
 * Extracts the created date from the profile data
 */
function getProfileCreatedDate(profile: any): Date | string | null {
  // Check direct createdAt property
  if (profile.createdAt) {
    if (typeof profile.createdAt === 'string') {
      return profile.createdAt;
    }
    return profile.createdAt.$date || profile.createdAt;
  }

  // Check in profileInformation
  if (profile.profileInformation?.createdAt) {
    if (typeof profile.profileInformation.createdAt === 'string') {
      return profile.profileInformation.createdAt;
    }
    return profile.profileInformation.createdAt.$date || profile.profileInformation.createdAt;
  }

  return null;
}

/**
 * Validates a profile object to ensure it has the required fields
 */
export function validateProfile(profile: any): boolean {
  if (!profile) return false;
  if (!profile._id && !profile.id) return false;

  // Add more validation as needed

  return true;
}

// Simple in-memory cache for profiles
const profileCache = new Map<string, any>();

/**
 * Gets a profile from the cache by ID
 */
export function getCachedProfile(id: string): any | null {
  return profileCache.get(id) || null;
}

/**
 * Caches a profile for later retrieval
 */
export function cacheProfile(profile: any): void {
  if (!profile || (!profile._id && !profile.id)) return;
  const id = profile._id || profile.id;
  profileCache.set(id, profile);
}

/**
 * Caches multiple profiles
 */
export function cacheProfiles(profiles: any[]): void {
  if (!profiles || !Array.isArray(profiles)) return;
  profiles.forEach(profile => cacheProfile(profile));
}
