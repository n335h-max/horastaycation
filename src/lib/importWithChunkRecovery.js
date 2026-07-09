const CHUNK_RELOAD_KEY = 'hora:chunk-reload-attempted:';

export function importWithChunkRecovery(importer, importerKey = 'global') {
  const storageKey = `${CHUNK_RELOAD_KEY}${importerKey}`;

  return importer()
    .then((module) => {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(storageKey);
      }
      return module;
    })
    .catch((error) => {
      const message = String(error?.message || error || '');
      const isChunkError =
        message.includes('Failed to fetch dynamically imported module') ||
        message.includes('Importing a module script failed');

      if (!isChunkError || typeof window === 'undefined') {
        throw error;
      }

      const alreadyReloaded = window.sessionStorage.getItem(storageKey) === '1';
      if (!alreadyReloaded) {
        window.sessionStorage.setItem(storageKey, '1');
        window.location.reload();
      }

      throw error;
    });
}
