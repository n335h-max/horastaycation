import { loadStore, saveStore } from './localStore';
import { MAX_SUPPORT_REQUESTS, MAX_DASHBOARD_PREVIEW_ITEMS } from '../lib/constants';

export async function submitSupportRequest(request) {
  const store = loadStore();
  const record = { id: crypto.randomUUID(), submittedAt: new Date().toISOString(), ...request };
  store.supportRequests = [record, ...store.supportRequests].slice(0, MAX_SUPPORT_REQUESTS);
  store.dashboardEmails = [
    { title: 'New Support Request', detail: `${request.topic} · ${request.email || 'guest message'}`, tone: 'indigo' },
    ...store.dashboardEmails,
  ].slice(0, MAX_DASHBOARD_PREVIEW_ITEMS);
  saveStore(store);
  return { store, request: record };
}
