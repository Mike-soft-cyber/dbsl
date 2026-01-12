// src/utils/profilePicUtils.js

/**
 * Helper utility to handle both Google OAuth and locally uploaded profile pictures
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const SERVER_BASE_URL = API_BASE_URL.replace("/api", "");

/**
 * Gets the correct profile picture URL
 * Handles both Google OAuth URLs and local uploads
 * 
 * @param {string} profilePicValue - The profilePic value from user data
 * @returns {string|null} - The full URL to the profile picture or null
 */
export function getProfilePictureUrl(profilePicValue) {
  // No profile pic provided
  if (!profilePicValue) {
    console.log('[ProfilePic] No profile picture value provided');
    return null;
  }

  // If it's already a full URL (Google OAuth or other external source)
  if (profilePicValue.startsWith('http://') || profilePicValue.startsWith('https://')) {
    console.log('[ProfilePic] Using external URL:', profilePicValue);
    return profilePicValue;
  }

  // If it's a default avatar
  if (profilePicValue === 'default-avatar.png') {
    console.log('[ProfilePic] Using default avatar');
    return null; // Return null to show the default user icon
  }

  // Otherwise, it's a local filename - construct the path
  const localUrl = `${SERVER_BASE_URL}/uploads/profile-pics/${profilePicValue}`;
  console.log('[ProfilePic] Using local upload:', localUrl);
  return localUrl;
}

/**
 * Checks if a profile picture is from Google OAuth
 * 
 * @param {string} profilePicValue - The profilePic value from user data
 * @returns {boolean} - True if it's a Google OAuth picture
 */
export function isGoogleProfilePic(profilePicValue) {
  if (!profilePicValue) return false;
  return profilePicValue.includes('googleusercontent.com') || 
         profilePicValue.includes('google.com');
}

/**
 * Gets profile picture with fallback handling
 * 
 * @param {object} userData - User data object
 * @returns {string|null} - Profile picture URL or null
 */
export function getUserProfilePic(userData) {
  if (!userData) return null;
  
  // Check multiple possible locations for profile pic
  const profilePic = userData.profilePic || 
                     userData.profile_pic || 
                     userData.picture;
  
  return getProfilePictureUrl(profilePic);
}

/**
 * Syncs profile picture from localStorage
 * Useful for React components that need to stay updated
 * 
 * @returns {string|null} - Profile picture URL or null
 */
export function getProfilePicFromStorage() {
  try {
    const userData = JSON.parse(localStorage.getItem('userData'));
    return getUserProfilePic(userData);
  } catch (error) {
    console.error('[ProfilePic] Error reading from localStorage:', error);
    return null;
  }
}

export default {
  getProfilePictureUrl,
  isGoogleProfilePic,
  getUserProfilePic,
  getProfilePicFromStorage
};