import { getResendClient, getFromEmail, getManagementEmail } from './_lib/resendServer.js';
import {
  bookingConfirmationTemplate,
  ownerBookingAlertTemplate,
  managementBookingAlertTemplate,
  supportRequestTemplate,
  ownerLeadTemplate,
  evaluationRequestTemplate,
} from './_lib/emailTemplates.js';

function getJsonBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

const EMAIL_TYPES = {
  booking_confirmation: {
    subject: (d) => `Booking Confirmed — ${d.propertyName} with Hora Staycation`,
    template: bookingConfirmationTemplate,
    defaultTo: (d) => d.guestEmail,
  },
  owner_booking_alert: {
    subject: (d) => `New Booking Alert — ${d.propertyName}`,
    template: ownerBookingAlertTemplate,
    defaultTo: () => null, // Must be provided explicitly
  },
  management_booking_alert: {
    subject: (d) => `[Management] New Booking — ${d.propertyName}`,
    template: managementBookingAlertTemplate,
    defaultTo: getManagementEmail,
  },
  support_request: {
    subject: (d) => `New Support Request: ${d.topic}`,
    template: supportRequestTemplate,
    defaultTo: getManagementEmail,
  },
  owner_lead: {
    subject: (d) => `New Owner Lead — ${d.ownerName}`,
    template: ownerLeadTemplate,
    defaultTo: getManagementEmail,
  },
  evaluation_request: {
    subject: (d) => `New Evaluation Request — ${d.evaluatorName}`,
    template: evaluationRequestTemplate,
    defaultTo: getManagementEmail,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(200).json({ sent: false, skipped: 'missing_resend_api_key' });
  }

  const body = getJsonBody(req);
  const { type, data } = body;

  if (!type || !EMAIL_TYPES[type]) {
    return res.status(400).json({ error: `Invalid email type. Supported types: ${Object.keys(EMAIL_TYPES).join(', ')}` });
  }

  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Email data is required.' });
  }

  const emailConfig = EMAIL_TYPES[type];
  const recipientEmail =
    typeof emailConfig.defaultTo === 'function' ? emailConfig.defaultTo(data) : emailConfig.defaultTo;

  if (!recipientEmail) {
    return res.status(200).json({ sent: false, skipped: 'no_recipient' });
  }

  try {
    const resend = getResendClient();
    const html = emailConfig.template(data);
    const subject = emailConfig.subject(data);

    const result = await resend.emails.send({
      from: getFromEmail(),
      to: recipientEmail,
      subject,
      html,
    });

    return res.status(200).json({ sent: true, id: result?.data?.id || null });
  } catch (error) {
    console.error('Resend email send failed:', error);
    return res.status(200).json({
      sent: false,
      error: error instanceof Error ? error.message : 'Email send failed.',
    });
  }
}