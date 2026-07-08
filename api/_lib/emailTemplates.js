/**
 * Email templates for Hora Staycation.
 * Returns HTML strings for each email type.
 */

const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char]);
}

export function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

export function sanitizeTemplateData(data = {}) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, escapeHtml(value)]));
}

function sanitizeMailto(value) {
  return escapeAttribute(String(value ?? '').trim());
}

export function bookingConfirmationTemplate(input = {}) {
  const {
    guestName,
    propertyName,
    propertyLocation,
    checkinDate,
    checkoutDate,
    guests,
    nights,
    subtotal,
    serviceFee,
    total,
    statusNote,
    bookingId,
  } = sanitizeTemplateData(input);
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f7f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a, #1e293b); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 700;">Booking Confirmed!</h1>
              <p style="color: #94a3b8; font-size: 14px; margin-top: 8px;">Your staycation with Hora is all set</p>
            </td>
          </tr>
          <!-- Greeting -->
          <tr>
            <td style="padding: 32px 32px 16px;">
              <p style="font-size: 16px; color: #1e293b; margin: 0;">Hi <strong>${guestName}</strong>,</p>
              <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-top: 12px;">Thank you for your booking! Here's a summary of your upcoming stay.</p>
            </td>
          </tr>
          <!-- Booking Details -->
          <tr>
            <td style="padding: 16px 32px;">
              <table width="100%" cellpadding="8" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px;">
                <tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Property</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;"><strong>${propertyName}</strong> — ${propertyLocation}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Check-in</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;">${checkinDate}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Check-out</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;">${checkoutDate}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Guests</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;">${guests}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Nights</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;">${nights}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: none;">Booking ID</td>
                  <td style="font-size: 12px; color: #64748b; text-align: right; border-bottom: none;">${bookingId || '—'}</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Pricing -->
          <tr>
            <td style="padding: 16px 32px;">
              <table width="100%" cellpadding="6" cellspacing="0" style="border-radius: 12px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="font-size: 14px; color: #475569;">Subtotal</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;">RM${subtotal}</td>
                </tr>
                <tr>
                  <td style="font-size: 14px; color: #475569;">Service Fee</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;">RM${serviceFee}</td>
                </tr>
                <tr>
                  <td style="font-size: 14px; font-weight: 700; color: #1e293b; border-top: 2px solid #e2e8f0; padding-top: 10px;">Total Paid</td>
                  <td style="font-size: 18px; font-weight: 700; color: #0f172a; text-align: right; border-top: 2px solid #e2e8f0; padding-top: 10px;">RM${total}</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Status Note -->
          ${statusNote ? `
          <tr>
            <td style="padding: 8px 32px 16px;">
              <p style="font-size: 13px; color: #64748b; font-style: italic; margin: 0;">${statusNote}</p>
            </td>
          </tr>` : ''}
          <!-- Footer -->
          <tr>
            <td style="padding: 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">Need help? Contact us at <a href="mailto:support@horastaycation.com" style="color: #0ea5e9;">support@horastaycation.com</a></p>
              <p style="font-size: 12px; color: #94a3b8; margin-top: 4px;">© 2026 Hora Staycation. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function ownerBookingAlertTemplate(input = {}) {
  const {
    propertyName,
    guestName,
    checkinDate,
    checkoutDate,
    guests,
    total,
    guestEmail,
    guestPhone,
  } = sanitizeTemplateData(input);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f7f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a, #1e293b); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 700;">New Booking! 🎉</h1>
              <p style="color: #94a3b8; font-size: 14px; margin-top: 8px;">Your property has been booked</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="font-size: 16px; color: #1e293b; margin: 0;">Hi there,</p>
              <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-top: 12px;">Great news! A new booking has been made for <strong>${propertyName}</strong>.</p>
              <table width="100%" cellpadding="8" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; margin-top: 16px;">
                <tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Guest</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;"><strong>${guestName}</strong></td>
                </tr>
                <tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Guest Email</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;">${guestEmail}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Guest Phone</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;">${guestPhone || '—'}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Check-in</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;">${checkinDate}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Check-out</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;">${checkoutDate}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Guests</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;">${guests}</td>
                </tr>
              </table>
              <div style="margin-top: 20px; padding: 16px; background-color: #f0fdf4; border-radius: 12px; text-align: center;">
                <p style="font-size: 24px; font-weight: 700; color: #059669; margin: 0;">RM${total}</p>
                <p style="font-size: 12px; color: #64748b; margin-top: 4px;">Total booking value</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">Hora Staycation · <a href="mailto:support@horastaycation.com" style="color: #0ea5e9;">support@horastaycation.com</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function managementBookingAlertTemplate(input = {}) {
  const { guestName, propertyName, checkinDate, checkoutDate, total, guestEmail } = sanitizeTemplateData(input);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f7f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #cbd5e1, #475569); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 700;">Management Alert</h1>
              <p style="color: #e2e8f0; font-size: 14px; margin-top: 8px;">New booking requires attention</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <table width="100%" cellpadding="8" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px;">
                <tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Guest</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;">${guestName}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Property</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;">${propertyName}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Guest Email</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;">${guestEmail}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Check-in</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;">${checkinDate}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Check-out</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;">${checkoutDate}</td>
                </tr>
              </table>
              <div style="margin-top: 20px; padding: 16px; background-color: #f1f5f9; border-radius: 12px; text-align: center;">
                <p style="font-size: 24px; font-weight: 700; color: #1e293b; margin: 0;">RM${total}</p>
                <p style="font-size: 12px; color: #64748b; margin-top: 4px;">Booking value</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">Hora Staycation Management · <a href="mailto:support@horastaycation.com" style="color: #0ea5e9;">support@horastaycation.com</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function supportRequestTemplate(input = {}) {
  const { topic, message, email, name } = sanitizeTemplateData(input);
  const replyTo = sanitizeMailto(input.email);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f7f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb, #0ea5e9); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 700;">New Support Request</h1>
              <p style="color: #bfdbfe; font-size: 14px; margin-top: 8px;">A guest needs assistance</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <table width="100%" cellpadding="8" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px;">
                <tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">From</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;">${name || 'Not provided'}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Email</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;">${email}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Topic</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;">${topic}</td>
                </tr>
              </table>
              <div style="margin-top: 16px; padding: 16px; background-color: #f8fafc; border-radius: 12px; border-left: 4px solid #0ea5e9;">
                <p style="font-size: 13px; color: #475569; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message || 'No message provided.'}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">Reply to guest at <a href="mailto:${replyTo}" style="color: #0ea5e9;">${email}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function ownerLeadTemplate(input = {}) {
  const { ownerName, ownerEmail, ownerPhone, ownerAddress, unitCount, budget } = sanitizeTemplateData(input);
  const ownerReplyTo = sanitizeMailto(input.ownerEmail);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f7f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a, #1e293b); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 700;">New Owner Lead</h1>
              <p style="color: #94a3b8; font-size: 14px; margin-top: 8px;">A property owner wants to build with Hora</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <table width="100%" cellpadding="8" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px;">
                <tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Name</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;"><strong>${ownerName}</strong></td>
                </tr>
                <tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Email</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;">${ownerEmail}</td>
                </tr>
                ${ownerPhone ? `<tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Phone</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;">${ownerPhone}</td>
                </tr>` : ''}
                <tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Address</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;">${ownerAddress || '—'}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Units</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;">${unitCount}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Budget</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right; border-bottom: none;">${budget}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">Contact lead: <a href="mailto:${ownerReplyTo}" style="color: #0ea5e9;">${ownerEmail}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function evaluationRequestTemplate(input = {}) {
  const { evaluatorName, evaluatorEmail, evaluatorPhone, evaluatorAddress, unitCount } = sanitizeTemplateData(input);
  const evaluatorReplyTo = sanitizeMailto(input.evaluatorEmail);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f7f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #059669, #10b981); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 700;">New Evaluation Request</h1>
              <p style="color: #a7f3d0; font-size: 14px; margin-top: 8px;">Someone wants to evaluate with Hora</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <table width="100%" cellpadding="8" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px;">
                <tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Name</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;"><strong>${evaluatorName}</strong></td>
                </tr>
                <tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Email</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;">${evaluatorEmail}</td>
                </tr>
                ${evaluatorPhone ? `<tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Phone</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;">${evaluatorPhone}</td>
                </tr>` : ''}
                <tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Address</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;">${evaluatorAddress || '—'}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Units</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right; border-bottom: none;">${unitCount}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">Contact: <a href="mailto:${evaluatorReplyTo}" style="color: #0ea5e9;">${evaluatorEmail}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function applicationApprovalTemplate(input = {}) {
  const { applicantName, applicantEmail, applicationType, propertyAddress, unitCount } = sanitizeTemplateData(input);
  const typeLabel = applicationType === 'evaluation' ? 'Evaluate With Us' : 'Build / Refurbish With Us';
  const replyTo = sanitizeMailto(input.applicantEmail);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f7f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #059669, #10b981); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 700;">Application Approved!</h1>
              <p style="color: #a7f3d0; font-size: 14px; margin-top: 8px;">${typeLabel} — Hora Staycation</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 16px;">
              <p style="font-size: 16px; color: #1e293b; margin: 0;">Hi <strong>${applicantName}</strong>,</p>
              <p style="font-size: 15px; color: #1e293b; line-height: 1.7; margin-top: 12px;">
                Congratulations! Your application for <strong>${typeLabel}</strong> with Hora Staycation has been <strong style="color: #059669;">approved</strong>.
              </p>
              <p style="font-size: 14px; color: #475569; line-height: 1.7; margin-top: 12px;">
                Our management team will be in contact with you shortly to discuss the next steps and get everything set up.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px;">
              <table width="100%" cellpadding="8" cellspacing="0" style="background-color: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0;">
                <tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Application Type</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;"><strong>${typeLabel}</strong></td>
                </tr>
                <tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Applicant</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;">${applicantName}</td>
                </tr>
                ${propertyAddress ? `<tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Property</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right;">${propertyAddress}</td>
                </tr>` : ''}
                ${unitCount ? `<tr>
                  <td style="font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: none;">Units</td>
                  <td style="font-size: 14px; color: #1e293b; text-align: right; border-bottom: none;">${unitCount}</td>
                </tr>` : ''}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px 32px;">
              <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px;">
                <p style="font-size: 14px; color: #475569; margin: 0; line-height: 1.6;">
                  <strong style="color: #1e293b;">What's next?</strong><br>
                  A member of the Hora management team will reach out to your registered email (<a href="mailto:${replyTo}" style="color: #059669;">${applicantEmail}</a>) within the next few business days to walk you through the onboarding process.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">Questions? Contact us at <a href="mailto:support@horastaycation.com" style="color: #0ea5e9;">support@horastaycation.com</a></p>
              <p style="font-size: 12px; color: #94a3b8; margin-top: 4px;">© 2026 Hora Staycation. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}