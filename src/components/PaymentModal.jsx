import { useEffect, useRef } from 'react';
import { Icon } from './Icon';

export function PaymentModal({ open, summary, isSubmitting, onClose, onSubmit, formatCurrency }) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 px-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id="payment-title" className="font-display text-3xl font-bold text-brand-950">Secure Payment</h2>
            <p id="payment-desc" className="mt-2 text-slate-500">Complete your booking for {summary.name}.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close payment modal"
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
          >
            <Icon name="close" className="text-xl" />
          </button>
        </div>

        <div className="mb-6 rounded-2xl bg-ice-50 p-5">
          <div className="mb-4 border-b border-ice-200 pb-4">
            <div className="font-semibold text-brand-900">{summary.name}</div>
            <div className="text-sm text-slate-500">{summary.location}</div>
          </div>
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
            <div className="flex justify-between border-t border-ice-200 pt-2">
              <span className="font-bold text-slate-900">Total</span>
              <span className="text-lg font-bold text-brand-700">{formatCurrency(summary.total)}</span>
            </div>
          </div>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                <Icon name="lock" />
              </span>
              <div>
                <div className="font-semibold text-brand-950">Stripe Checkout</div>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  You will be redirected to Stripe’s secure hosted checkout page to complete payment in test mode.
                </p>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-4 text-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="inline-flex items-center gap-2">
              <Icon name="lock" />
              {isSubmitting ? 'Redirecting to Stripe…' : `Continue to Stripe · ${formatCurrency(summary.total)}`}
            </span>
          </button>
          <p className="text-center text-xs text-slate-400">
            Card details are entered on Stripe, not stored in this app.
          </p>
        </form>
      </div>
    </div>
  );
}
