import { loadStore, saveStore } from './localStore';
import { MAX_SUPPORT_REQUESTS, MAX_DASHBOARD_PREVIEW_ITEMS } from '../lib/constants';
import { sendSupportRequestAlert } from './emailService';

export async function submitSupportRequest(request) {
  const store = loadStore();
  const record = { id: crypto.randomUUID(), submittedAt: new Date().toISOString(), ...request };
  store.supportRequests = [record, ...store.supportRequests].slice(0, MAX_SUPPORT_REQUESTS);
  store.dashboardEmails = [
    { title: 'New Support Request', detail: `${request.topic} · ${request.email || 'guest message'}`, tone: 'indigo' },
    ...store.dashboardEmails,
  ].slice(0, MAX_DASHBOARD_PREVIEW_ITEMS);
  saveStore(store);

  // Send support request alert to management (fire-and-forget)
  sendSupportRequestAlert({
    topic: request.topic || 'General',
    message: request.message || '',
    email: request.email || '',
    name: request.name || '',
  }).catch((err) => console.warn('Failed to send support request email:', err));

  return { store, request: record };
}
