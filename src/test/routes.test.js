import { describe, expect, it } from 'vitest';

import { APP_PATHS, getPageFromPath, getPathFromPage } from '../lib/routes';

/**
 * Regression guards for routes.js.
 *
 * Bug guarded: Swapped booking/review routes.
 *   booking and review are distinct flows with distinct paths and page
 *   identifiers. A swap (mapping the review path to the booking page, or the
 *   booking path to the review page) would send users to the wrong screen and
 *   break navigation. These tests pin the correct bidirectional mapping and
 *   assert the round-trip holds for both flows.
 */

describe('routes — booking and review are not swapped', () => {
  it('maps the booking path to the booking page (not the review page)', () => {
    expect(getPageFromPath(APP_PATHS.booking)).toBe('booking');
  });

  it('maps the review path to the evaluate page (not the booking page)', () => {
    expect(getPageFromPath(APP_PATHS.review)).toBe('evaluate');
  });

  it('maps the booking page back to the booking path', () => {
    expect(getPathFromPage('booking')).toBe(APP_PATHS.booking);
  });

  it('maps the evaluate page back to the review path', () => {
    expect(getPathFromPage('evaluate')).toBe(APP_PATHS.review);
  });

  it('round-trips the booking route without crossing into review', () => {
    const page = getPageFromPath(APP_PATHS.booking);
    expect(page).toBe('booking');
    expect(getPathFromPage(page)).toBe(APP_PATHS.booking);
    expect(APP_PATHS.booking).not.toBe(APP_PATHS.review);
  });

  it('round-trips the review route without crossing into booking', () => {
    const page = getPageFromPath(APP_PATHS.review);
    expect(page).toBe('evaluate');
    expect(getPathFromPage(page)).toBe(APP_PATHS.review);
  });
});

describe('routes — page/path mappings are mutually consistent', () => {
  it('every APP_PATHS entry with a mapped page round-trips', () => {
    const roundTripPaths = [
      APP_PATHS.authLogin,
      APP_PATHS.privacyPolicy,
      APP_PATHS.ownerSignup,
      APP_PATHS.ownerDashboard,
      APP_PATHS.ownerSuccess,
      APP_PATHS.booking,
      APP_PATHS.bookingSuccess,
      APP_PATHS.review,
      APP_PATHS.reviewSuccess,
      APP_PATHS.managementLogin,
      APP_PATHS.dashboard,
      APP_PATHS.managementListings,
    ];

    for (const pathname of roundTripPaths) {
      const page = getPageFromPath(pathname);
      expect(page).not.toBe('landing'); // i.e. each path is recognized
      expect(getPathFromPage(page)).toBe(pathname);
    }
  });

  it('falls back to landing for unknown paths and pages', () => {
    expect(getPageFromPath('/does-not-exist')).toBe('landing');
    expect(getPathFromPage('not-a-page')).toBe(APP_PATHS.landing);
  });
});
