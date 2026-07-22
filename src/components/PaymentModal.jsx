import { useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { formatCurrency } from '../lib/formatters';

export function PaymentModal({ open, summary, isSubmitting, onClose, onSubmit }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (open && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [open]);

  if (!open || !summary) {
    return null;
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-title"
      aria-describedby="payment-desc"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/65 backdrop-blur-sm sm:items-center sm:px-4"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between gap-4 border-b border-ice-200 px-6 py-5">
          <div>
            <h2 id="payment-title" className="font-display text-2xl font-bold text-brand-950">Secure Payment</h2>
            <p id="payment-desc" className="mt-0.5 text-sm text-slate-500">{summary.name} &middot; {summary.location}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close payment modal"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ice-100 text-slate-500 hover:bg-ice-200"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-5 rounded-2xl bg-ice-50 p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">
                  {formatCurrency(summary.price)} x {summary.nights} night(s)
                </span>
                <span className="font-medium text-slate-900">{formatCurrency(summary.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service fee</span>
                <span className="font-medium text-slate-900">{formatCurrency(summary.serviceFee)}</span>
              </div>
              <div className="flex justify-between border-t border-ice-200 pt-2.5">
                <span className="font-bold text-slate-900">Total</span>
                <span className="text-xl font-bold text-brand-700">{formatCurrency(summary.total)}</span>
              </div>
            </div>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                <Icon name="lock" />
              </span>
              <div>
                <div className="text-sm font-semibold text-brand-950">Stripe Secure Checkout</div>
                <p className="text-xs leading-relaxed text-slate-500">
                  You will be redirected to Stripe hosted checkout to complete payment securely.
                </p>
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-4 text-base disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-2">
                <Icon name="lock" />
                {isSubmitting ? 'Redirecting...' : `Pay ${formatCurrency(summary.total)}`}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
