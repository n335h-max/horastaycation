const STORAGE_KEY = 'hora-staycation-store:v1';

export function readStorage(defaultValue) {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultValue;
    }

    return { ...defaultValue, ...JSON.parse(raw) };
  } catch {
    return defaultValue;
  }
}

export function writeStorage(value) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}
