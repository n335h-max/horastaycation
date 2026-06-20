import { loadStore, saveStore } from './localStore';
import { MAX_ANALYTICS_EVENTS } from '../lib/constants';

export async function trackAnalyticsEvent(event) {
  const store = loadStore();
  const record = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...event };
  store.analyticsEvents = [record, ...store.analyticsEvents].slice(0, MAX_ANALYTICS_EVENTS);
  saveStore(store);
  return { store, event: record };
}