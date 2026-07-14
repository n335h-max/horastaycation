import { loadStore, saveStore } from './localStore';
import { getAuthenticatedUser, insertRemote, updateRemote } from './supabaseClient';
import { MAX_DASHBOARD_PREVIEW_ITEMS } from '../lib/constants';
import { logger } from '../lib/logger';
import { sendOwnerLeadAlert, sendEvaluationRequestAlert, sendApplicationApproval } from './emailService';

export async function submitOwnerApplication(application) {
  const store = loadStore();
  const currentUser = await getAuthenticatedUser();
  const record = {
    id: crypto.randomUUID(),
    submittedAt: new Date().toISOString(),
    ownerUserId: currentUser?.id || null,
    approved: false,
    ...application,
  };
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
      id: record.id,
      owner_user_id: currentUser?.id || null,
      owner_first_name: nameParts[0] || application.ownerName,
      owner_last_name: nameParts.slice(1).join(' ') || 'Owner',
      owner_email: application.ownerEmail,
      owner_phone: application.ownerPhone || '',
      property_name: 'Build / Refurbish Request',
      property_type: 'Owner Lead',
      property_location: application.ownerAddress,
      property_description: `Requested ${application.unitCount} unit(s). Budget: ${application.budget}.`,
      price_per_night: Number.isFinite(nightlyBudget) && nightlyBudget > 0 ? nightlyBudget : 1,
      max_guests: application.unitCount,
      amenities: [`Budget ${application.budget}`],
      budget: application.budget || '',
    }),
    sendOwnerLeadAlert({
      ownerName: application.ownerName || 'Owner',
      ownerEmail: application.ownerEmail || '',
      ownerPhone: application.ownerPhone || '',
      ownerAddress: application.ownerAddress || '',
      unitCount: String(application.unitCount || '1'),
      budget: application.budget || '',
    }).catch((err) => logger.warn('Failed to send owner lead email:', err)),
  ]);

  return { store, remote };
}

export async function submitReview(review) {
  const store = loadStore();
  const currentUser = await getAuthenticatedUser();
  const record = {
    id: crypto.randomUUID(),
    submittedAt: new Date().toISOString(),
    ownerUserId: currentUser?.id || null,
    approved: false,
    ...review,
  };
  store.reviewSubmissions = [record, ...store.reviewSubmissions];
  store.dashboardEmails = [
    { title: 'New Evaluation Request', detail: `Sent for ${review.evaluatorEmail}`, tone: 'brand' },
    ...store.dashboardEmails,
  ].slice(0, MAX_DASHBOARD_PREVIEW_ITEMS);
  saveStore(store);

  // Run DB insert and email alert in parallel — neither blocks the other
  const [remote] = await Promise.all([
    insertRemote('review_submissions', {
      id: record.id,
      owner_user_id: currentUser?.id || null,
      review_property: 'Evaluation With Us',
      reviewer_name: review.evaluatorName,
      stay_date: new Date().toISOString().slice(0, 7),
      rating: 5,
      cleanliness: `Units ${review.unitCount}`,
      location: review.evaluatorAddress,
      amenities: 'Exclusive partnership confirmed',
      value: 'Pending review',
      review_text: `Evaluation request from ${review.evaluatorName}. Email: ${review.evaluatorEmail}. Address: ${review.evaluatorAddress}. Units: ${review.unitCount}.`,
      contact_phone: review.evaluatorPhone || '',
      evaluator_email: review.evaluatorEmail || '',
      evaluator_address: review.evaluatorAddress || '',
      unit_count: String(review.unitCount ?? ''),
      approved: false,
    }),
    sendEvaluationRequestAlert({
      evaluatorName: review.evaluatorName || 'Evaluator',
      evaluatorEmail: review.evaluatorEmail || '',
      evaluatorPhone: review.evaluatorPhone || '',
      evaluatorAddress: review.evaluatorAddress || '',
      unitCount: String(review.unitCount || '1'),
    }).catch((err) => logger.warn('Failed to send evaluation request email:', err)),
  ]);

  return { store, remote };
}

export async function approveApplication(applicationId, applicationType) {
  const store = loadStore();

  let applicantName = '';
  let applicantEmail = '';
  let propertyAddress = '';
  let unitCount = '';
  let found = false;

  if (applicationType === 'owner') {
    store.ownerApplications = store.ownerApplications.map((app) => {
      if (app.id !== applicationId) return app;
      found = true;
      applicantName = app.ownerName || 'Owner';
      applicantEmail = app.ownerEmail || '';
      propertyAddress = app.ownerAddress || '';
      unitCount = String(app.unitCount || '');
      return { ...app, approved: true, approvedAt: new Date().toISOString() };
    });
  } else {
    store.reviewSubmissions = store.reviewSubmissions.map((rev) => {
      if (rev.id !== applicationId) return rev;
      found = true;
      applicantName = rev.evaluatorName || 'Evaluator';
      applicantEmail = rev.evaluatorEmail || '';
      propertyAddress = rev.evaluatorAddress || '';
      unitCount = String(rev.unitCount || '');
      return { ...rev, approved: true, approvedAt: new Date().toISOString() };
    });
  }

  if (!found) {
    return { store: loadStore(), emailSent: false, found: false };
  }

  store.dashboardEmails = [
    {
      title: `Application Approved`,
      detail: `Approval sent to ${applicantEmail}`,
      tone: 'brand',
    },
    ...store.dashboardEmails,
  ].slice(0, MAX_DASHBOARD_PREVIEW_ITEMS);

  saveStore(store);

  // Persist approval remotely so it survives browser clears and is visible on
  // other devices. Update runs in parallel with the approval email; a remote
  // failure does not block the email or the local state.
  const approvedAtIso = new Date().toISOString();
  const remoteTable = applicationType === 'owner' ? 'owner_applications' : 'review_submissions';
  const remoteUpdate = updateRemote(remoteTable, { approved: true, approved_at: approvedAtIso }, 'id', applicationId)
    .catch((err) => logger.warn('Failed to persist approval remotely:', err));

  let emailSent = false;
  let emailError = null;
  try {
    await sendApplicationApproval({
      applicantName,
      applicantEmail,
      applicationType,
      propertyAddress,
      unitCount,
    });
    emailSent = true;
  } catch (err) {
    emailError = err instanceof Error ? err.message : String(err);
    logger.warn('Failed to send approval email:', emailError);
  }

  await remoteUpdate;

  return { store, emailSent, emailError, found: true };
}
