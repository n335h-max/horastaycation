/**
 * Safe localStorage and sessionStorage wrappers.
 *
 * Safari Private Browsing, certain iOS in-app browsers, and full-storage
 * scenarios can all throw on storage access. This module returns no-op
 * stubs when the real storage is unavailable, so the app never crashes.
 */

const NOOP_STORE = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};

function probeStorage(storage) {
  try {
    const test = '__storage_probe__';
    storage.setItem(test, test);
    storage.removeItem(test);
    return storage;
  } catch {
    return NOOP_STORE;
  }
}

let _local = null;
let _session = null;

/**
 * Get a safe localStorage reference. Returns no-op stub if storage is
 * unavailable (Private Browsing, quota exceeded, etc.).
 */
export function getLocalStorage() {
  if (_local) return _local;
  if (typeof window === 'undefined') return NOOP_STORE;
  _local = probeStorage(window.localStorage);
  return _local;
}

/**
 * Get a safe sessionStorage reference. Returns no-op stub if storage is
 * unavailable.
 */
export function getSessionStorage() {
  if (_session) return _session;
  if (typeof window === 'undefined') return NOOP_STORE;
  _session = probeStorage(window.sessionStorage);
  return _session;
}
