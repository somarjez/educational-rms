// Simple in-memory TTL cache for static/slow-changing API data.
// Avoids redundant network requests within the same session for data
// like rooms, equipment, and time slots that rarely change.

const TTL_MS = 2 * 60 * 1000; // 2 minutes

const store = new Map();

const key = (url, params) => url + '|' + JSON.stringify(params || {});

export const cacheGet = (url, params) => {
  const entry = store.get(key(url, params));
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL_MS) {
    store.delete(key(url, params));
    return null;
  }
  return entry.data;
};

export const cacheSet = (url, params, data) => {
  store.set(key(url, params), { data, ts: Date.now() });
};

export const cacheInvalidate = (urlPrefix) => {
  for (const k of store.keys()) {
    if (k.startsWith(urlPrefix)) store.delete(k);
  }
};
