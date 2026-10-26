/** Cloudinary account holding every site image. */
const CLOUD_NAME = 'liu8jcpl';

/**
 * Same asset, delivered as a genuine PNG. Used for favicons and app icons, where
 * `f_auto` would negotiate WebP and browsers/OSes expect the declared type.
 */
export function cldPng(publicId: string): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/q_auto/${publicId}.png`;
}

/** Brand details used by the review funnel. */
export const SITE = {
  /** White mark on forest green (#3C4A3D) — sits on the page frame, which uses the same green */
  logo: '/logo.jpg',
} as const;

/**
 * Review funnel (/review → Google for 4–5 stars, /client-feedback for 1–3).
 *
 * GOOGLE_REVIEW_URL is the "Ask for reviews" link from the clinic's Google
 * Business Profile (https://g.page/r/<id>/review). While it still holds a
 * REPLACE_WITH placeholder, 4–5 star ratings fall back to Google Maps.
 */
export const GOOGLE_REVIEW_URL = 'https://g.page/r/CasAHYAmPxbeEBM/review';
export const GOOGLE_REVIEW_FALLBACK_URL = 'https://www.google.com/maps';
export const REVIEW_LINK_IS_PLACEHOLDER = GOOGLE_REVIEW_URL.includes('REPLACE_WITH');
