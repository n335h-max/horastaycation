import { Resend } from 'resend';

export function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Resend API key is not configured.');
  }

  return new Resend(process.env.RESEND_API_KEY);
}

export function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL || 'noreply@horastaycation.com';
}

export function getManagementEmail() {
  return process.env.MANAGEMENT_EMAIL || 'admin@horastaycation.com';
}