import { RESEND_ENDPOINTS } from '../lib/constants';

/**
 * Send an email via the Resend API endpoint.
 * Returns { sent: boolean, id: string|null, error: string|null, skipped: string|null }
 */
export async function sendEmail(type, data, to = null) {
  try {
    const payload = { type, data };
    if (to) {
      payload.to = to;
    }

    const response = await fetch(RESEND_ENDPOINTS.sendEmail, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.error || `Email request failed with status ${response.status}.`);
    }

    if (!result?.sent) {
      throw new Error(result?.error || result?.skipped || 'Email send was not successful.');
    }

    return result;
  } catch (error) {
    console.error('Email service error:', error);
    throw (error instanceof Error ? error : new Error('Failed to send email request.'));
  }
}

/**
 * Send booking confirmation email to the guest.
 */
export async function sendBookingConfirmation(data) {
  return sendEmail('booking_confirmation', data);
}

/**
 * Send booking alert to the property owner.
 */
export async function sendOwnerBookingAlert(data, ownerEmail) {
  return sendEmail('owner_booking_alert', { ...data, ownerEmail }, ownerEmail);
}

/**
 * Send booking alert to management.
 */
export async function sendManagementBookingAlert(data) {
  return sendEmail('management_booking_alert', data);
}

/**
 * Send support request notification to management.
 */
export async function sendSupportRequestAlert(data) {
  return sendEmail('support_request', data);
}

/**
 * Send owner lead notification to management.
 */
export async function sendOwnerLeadAlert(data) {
  return sendEmail('owner_lead', data);
}

/**
 * Send evaluation request notification to management.
 */
export async function sendEvaluationRequestAlert(data) {
  return sendEmail('evaluation_request', data);
}