import { loadStore, saveStore } from './localStore';
import { getAuthenticatedUser, insertRemote } from './supabaseClient';
import { MAX_DASHBOARD_PREVIEW_ITEMS } from '../lib/constants';
import { sendOwnerLeadAlert, sendEvaluationRequestAlert } from './emailService';

export async function submitOwnerApplication(application) {
  const store = loadStore();
  const currentUser = await getAuthenticatedUser();
  const record = { id: crypto.randomUUID(), submittedAt: new Date().toISOString(), ...application };
  store.ownerApplications = [record, ...store.ownerApplications];
  store.dashboardEmails = [
    { title: 'New Owner Lead', detail: `Sent for ${application.ownerEmail}`, tone: 'brand' },
    ...store.dashboardEmails,
  ].slice(0, MAX_DASHBOARD_PREVIEW_ITEMS);
  saveStore(store);

  const nameParts = application.ownerName.trim().split(/\s+/);
  const nightlyBudget = Number.parseFloat(String(application.budget).replace(/[^\d.]/g, ''));
  // Run DB insert and email alert in parallel — neither blocks the other
  const [remote] = await Promise.all([
    insertRemote('owner_applications', {
      owner_user_id: currentUser?.id || null,
      owner_first_name: nameParts[0] || application.ownerName,
      owner_last_name: nameParts.slice(1).join(' ') || 'Owner',
      owner_email: application.ownerEmail,
      owner_phone: '',
      property_name: 'Build / Refurbish Request',
      property_type: 'Owner Lead',
      property_location: application.ownerAddress,
      property_description: `Requested ${application.unitCount} unit(s). Budget: ${application.budget}.`,
      price_per_night: Number.isFinite(nightlyBudget) && nightlyBudget > 0 ? nightlyBudget : 1,
      max_guests: application.unitCount,
      amenities: [`Budget ${application.budget}`],
    }),
    sendOwnerLeadAlert({
      ownerName: application.ownerName || 'Owner',
      ownerEmail: application.ownerEmail || '',
      ownerAddress: application.ownerAddress || '',
      unitCount: String(application.unitCount || '1'),
      budget: application.budget || '',
    }).catch((err) => console.warn('Failed to send owner lead email:', err)),
  ]);

  return { store, remote };
}

export async function submitReview(review) {
  const store = loadStore();
  const record = { id: crypto.randomUUID(), submittedAt: new Date().toISOString(), ...review };
  store.reviewSubmissions = [record, ...store.reviewSubmissions];
  store.dashboardEmails = [
    { title: 'New Evaluation Request', detail: `Sent for ${review.evaluatorEmail}`, tone: 'brand' },
    ...store.dashboardEmails,
  ].slice(0, MAX_DASHBOARD_PREVIEW_ITEMS);
  saveStore(store);

  // Run DB insert and email alert in parallel — neither blocks the other
  const [remote] = await Promise.all([
    insertRemote('review_submissions', {
      review_property: 'Evaluation With Us',
      reviewer_name: review.evaluatorName,
      stay_date: new Date().toISOString().slice(0, 7),
      rating: 5,
      cleanliness: `Units ${review.unitCount}`,
      location: review.evaluatorAddress,
      amenities: 'Exclusive partnership confirmed',
      value: 'Pending review',
      review_text: `Evaluation request from ${review.evaluatorName}. Email: ${review.evaluatorEmail}. Address: ${review.evaluatorAddress}. Units: ${review.unitCount}.`,
    }),
    sendEvaluationRequestAlert({
      evaluatorName: review.evaluatorName || 'Evaluator',
      evaluatorEmail: review.evaluatorEmail || '',
      evaluatorAddress: review.evaluatorAddress || '',
      unitCount: String(review.unitCount || '1'),
    }).catch((err) => console.warn('Failed to send evaluation request email:', err)),
  ]);

  return { store, remote };
}
