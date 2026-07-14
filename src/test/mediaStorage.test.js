import { beforeEach, describe, expect, it, vi } from 'vitest';

import { saveMediaFile, getMediaObjectUrl, deleteMediaFile } from '../lib/mediaStorage';

/**
 * Regression guards for mediaStorage.
 *
 * Bug guarded: Non-Blob createObjectURL crash.
 *   getMediaObjectUrl used to call URL.createObjectURL(blob) unconditionally.
 *   If the stored record's `blob` field was missing or not a Blob/File (e.g.
 *   null, a string, a plain object), URL.createObjectURL throws
 *   'Failed to execute createObjectURL: Overload resolution failed'.
 *   The fix guards with `blob instanceof Blob` before calling
 *   createObjectURL and resolves '' otherwise.
 *
 * These tests use a minimal in-memory IndexedDB fake so the guard path that
 * reads from the store and calls URL.createObjectURL is actually exercised
 * (jsdom ships no real IndexedDB).
 */

// Minimal IndexedDB fake: one object store keyed by `id`, supporting the
// operations mediaStorage actually performs (put/get/delete + tx events).
function installFakeIndexedDb() {
  const store = new Map();

  const requestFrom = (result) => {
    const r = {
      result,
      addEventListener(event, handler) {
        if (event === 'success') queueMicrotask(handler);
        if (event === 'error') { /* not triggered in tests */ }
      },
    };
    return r;
  };

  const tx = (mode) => ({
    objectStore: () => ({
      put: (record) => store.set(record.id, record),
      delete: (id) => store.delete(id),
      get: (id) => requestFrom(store.get(id)),
    }),
    addEventListener(event, handler) {
      if (event === 'complete') queueMicrotask(handler);
      if (event === 'error' || event === 'abort') { /* not triggered */ }
    },
  });

  const db = {
    objectStoreNames: { contains: () => true },
    transaction: () => tx(),
  };

  const openRequest = {
    result: db,
    addEventListener(event, handler) {
      if (event === 'success') queueMicrotask(handler);
      if (event === 'upgradeneeded') { /* store already exists */ }
      if (event === 'error') { /* not triggered */ }
    },
  };

  window.indexedDB = { open: () => openRequest };
  return { store };
}

beforeEach(() => {
  // jsdom has no indexedDB by default; install the fake for every test.
  installFakeIndexedDb();
});

describe('saveMediaFile — non-File input', () => {
  it('returns null (and writes nothing) for a non-File value', async () => {
    // Regression: saveMediaFile must guard with `instanceof File`. A plain
    // object or string is not a File and must not be persisted.
    const result = await saveMediaFile({ name: 'not-a-file' }, 'image');
    expect(result).toBeNull();
  });
});

describe('getMediaObjectUrl — non-Blob createObjectURL crash', () => {
  it('does not call createObjectURL when the stored blob is null', async () => {
    // Seed a record whose `blob` is null (e.g. a corrupted/old record).
    window.indexedDB
      .open()
      .addEventListener('success', () => {
        const db = window.indexedDB.open().result;
        db.transaction().objectStore().put({ id: 'rec-1', blob: null });
      });

    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL');
    const url = await getMediaObjectUrl({ id: 'rec-1' });

    expect(url).toBe('');
    expect(createObjectURLSpy).not.toHaveBeenCalled();
    createObjectURLSpy.mockRestore();
  });

  it('does not throw and returns "" when the stored blob is not a Blob', async () => {
    // Regression: a string blob here used to reach URL.createObjectURL and
    // throw 'Overload resolution failed'.
    window.indexedDB
      .open()
      .addEventListener('success', () => {
        const db = window.indexedDB.open().result;
        db.transaction().objectStore().put({ id: 'rec-2', blob: 'not-a-blob' });
      });

    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL');
    const url = await getMediaObjectUrl({ id: 'rec-2' });

    expect(url).toBe('');
    expect(createObjectURLSpy).not.toHaveBeenCalled();
    createObjectURLSpy.mockRestore();
  });

  it('returns a blob: URL for a real stored Blob', async () => {
    // Happy path: a genuine Blob is stored, so createObjectURL is called and a
    // blob: URL is returned (proves the guard is conditional, not a no-op).
    const blob = new Blob(['pixels'], { type: 'image/png' });
    window.indexedDB
      .open()
      .addEventListener('success', () => {
        const db = window.indexedDB.open().result;
        db.transaction().objectStore().put({ id: 'rec-3', blob });
      });

    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-url');
    const url = await getMediaObjectUrl({ id: 'rec-3' });

    expect(url).toBe('blob:fake-url');
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
    createObjectURLSpy.mockRestore();
  });

  it('returns "" when mediaRef has no id', async () => {
    const url = await getMediaObjectUrl({ id: undefined });
    expect(url).toBe('');
  });
});

describe('deleteMediaFile — guards', () => {
  it('is a no-op when mediaRef has no id', async () => {
    await expect(deleteMediaFile({ id: null })).resolves.toBeUndefined();
    await expect(deleteMediaFile(null)).resolves.toBeUndefined();
  });
});
