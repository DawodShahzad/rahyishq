/**
 * ADMIN ACCESS CONFIGURATION
 * 
 * Set ENABLE_ADMIN_ACCESS = true so that you can open /admin on your mobile phone
 * or any browser to upload new photos and manage the website.
 * 
 * Security:
 * - This route (/admin) is NOT linked anywhere on the public frontend.
 * - Access is protected by the secret ADMIN_PASSCODE below.
 */
export const ENABLE_ADMIN_ACCESS = true;

/**
 * Secret passcode required to unlock the admin panel.
 * You can change this to any secret passcode you desire.
 */
export const ADMIN_PASSCODE = 'darulehsan';
