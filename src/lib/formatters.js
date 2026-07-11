import {
  CURRENCY_FORMAT_OPTIONS,
  DATE_FORMAT_OPTIONS,
} from './constants';

const currencyFormatter = new Intl.NumberFormat('ms-MY', CURRENCY_FORMAT_OPTIONS);

const dateFormatter = new Intl.DateTimeFormat('en-US', DATE_FORMAT_OPTIONS);

/**
 * Format a number as Malaysian Ringgit currency.
 * @param {number} value
 * @returns {string}
 */
export function formatCurrency(value) {
  return currencyFormatter.format(value);
}

/**
 * Format an ISO date string or Date object into a readable date.
 * @param {string | Date | null} value
 * @returns {string}
 */
export function formatDate(value) {
  if (!value) return 'Select dates';
  return dateFormatter.format(new Date(value));
}
