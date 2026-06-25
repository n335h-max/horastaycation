import { useState, useCallback } from 'react';
import { DEFAULT_COOKIE_PREFERENCES, readCookiePreferences, saveCookiePreferences } from '../lib/privacyPreferences';

export function useCookiePreferences() {
  const [cookiePreferences, setCookiePreferences] = useState(() => readCookiePreferences());
  const [cookieBannerOpen, setCookieBannerOpen] = useState(() => !readCookiePreferences());

  const handleCookiePreferenceChange = useCallback((preferences) => {
    const nextPreferences = saveCookiePreferences(preferences);
    setCookiePreferences(nextPreferences);
    setCookieBannerOpen(false);
    return nextPreferences;
  }, []);

  const handleAcceptAllCookies = useCallback(() => {
    handleCookiePreferenceChange({
      essential: true,
      analytics: true,
      personalization: true,
    });
  }, [handleCookiePreferenceChange]);

  const handleEssentialOnlyCookies = useCallback(() => {
    handleCookiePreferenceChange({
      essential: true,
      analytics: false,
      personalization: false,
    });
  }, [handleCookiePreferenceChange]);

  return {
    cookiePreferences,
    cookieBannerOpen,
    setCookieBannerOpen,
    handleCookiePreferenceChange,
    handleAcceptAllCookies,
    handleEssentialOnlyCookies,
  };
}
