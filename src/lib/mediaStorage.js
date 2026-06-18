const DB_NAME = 'hora-staycation-media';
const STORE_NAME = 'uploads';
const DB_VERSION = 1;

function supportsIndexedDb() {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!supportsIndexedDb()) {
      resolve(null);
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.addEventListener('upgradeneeded', () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    });

    request.addEventListener('success', () => resolve(request.result));
    request.addEventListener('error', () => reject(request.error ?? new Error('Failed to open media database.')));
  });
}

function runStoreOperation(mode, operation) {
  return openDatabase().then((database) => new Promise((resolve, reject) => {
    if (!database) {
      resolve(null);
      return;
    }

    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);

    transaction.addEventListener('complete', () => resolve(true));
    transaction.addEventListener('error', () => reject(transaction.error ?? new Error('Media transaction failed.')));
    transaction.addEventListener('abort', () => reject(transaction.error ?? new Error('Media transaction aborted.')));

    operation(store, resolve, reject);
  }));
}

export async function saveMediaFile(file, field) {
  if (!(file instanceof File)) {
    return null;
  }

  const id = crypto.randomUUID();
  const record = {
    id,
    blob: file,
    name: file.name,
    type: file.type,
    size: file.size,
    field,
    savedAt: new Date().toISOString(),
  };

  await runStoreOperation('readwrite', (store) => {
    store.put(record);
  });

  return {
    id,
    name: record.name,
    type: record.type,
    size: record.size,
    field: record.field,
    savedAt: record.savedAt,
  };
}

export async function deleteMediaFile(mediaRef) {
  if (!mediaRef?.id) {
    return;
  }

  await runStoreOperation('readwrite', (store) => {
    store.delete(mediaRef.id);
  });
}

export function getMediaObjectUrl(mediaRef) {
  if (!mediaRef?.id) {
    return Promise.resolve('');
  }

  return openDatabase().then((database) => new Promise((resolve, reject) => {
    if (!database) {
      resolve('');
      return;
    }

    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(mediaRef.id);

    request.addEventListener('success', () => {
      const record = request.result;
      resolve(record?.blob ? URL.createObjectURL(record.blob) : '');
    });
    request.addEventListener('error', () => reject(request.error ?? new Error('Failed to read media file.')));
  }));
}

export function revokeMediaObjectUrls(urls) {
  urls.forEach((url) => {
    if (typeof url === 'string' && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  });
}
