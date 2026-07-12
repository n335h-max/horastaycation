import { getLocalStorage } from './safeStorage';

const CONSENT_STORAGE_KEY = 'hora-cookie-consent:v1';

export const DEFAULT_COOKIE_PREFERENCES = {
  essential: true,
  analytics: false,
  personalization: false,
  consentedAt: '',
};

export function readCookiePreferences() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = getLocalStorage().getItem(CONSENT_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    return {
      ...DEFAULT_COOKIE_PREFERENCES,
      ...JSON.parse(raw),
      essential: true,
    };
  } catch {
    return null;
  }
}

export function saveCookiePreferences(preferences) {
  if (typeof window === 'undefined') {
    return null;
  }

  const nextPreferences = {
    ...DEFAULT_COOKIE_PREFERENCES,
    ...preferences,
    essential: true,
    consentedAt: preferences?.consentedAt || new Date().toISOString(),
  };

  getLocalStorage().setItem(CONSENT_STORAGE_KEY, JSON.stringify(nextPreferences));
  return nextPreferences;
}
