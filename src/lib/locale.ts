/**
 * Nigeria-only locale lock (product decision: NG / NGN until further notice).
 * Country and currency are FIXED values — not user-selectable anywhere.
 * The store hardcodes these when creating a user and ignores any client-supplied
 * values, the same way a server-side DTO would.
 */
export const COUNTRY_CODE = 'NG';
export const CURRENCY_CODE = 'NGN';
export const COUNTRY_NAME = 'Nigeria';
export const CURRENCY_DISPLAY = 'Nigerian Naira (₦)';

/** Banner copy used on the personal-info screen. */
export const NIGERIA_ONLY_BANNER =
  'Anchor is Nigeria-only for now — every amount is in Naira (₦). Multi-country support is coming later.';
