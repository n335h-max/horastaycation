import { Icon } from './Icon';

export function PaymentModal({
  open,
  summary,
  paymentForm,
  paymentErrors,
  isSubmitting,
  onPaymentChange,
  onClose,
  onSubmit,
  formatCurrency,
}) {
  if (!open || !summary) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold text-brand-950">Secure Payment</h2>
            <p className="mt-2 text-slate-500">Complete your booking for {summary.name}.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close payment modal" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100">
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
              <span className="text-slate-500">{formatCurrency(summary.price)} x {summary.nights} night(s)</span>
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
          <div>
            <label className="form-label" htmlFor="stripeCardNumber">Card Number</label>
            <input
              id="stripeCardNumber"
              name="cardNumber"
              inputMode="numeric"
              autoComplete="cc-number"
              value={paymentForm.cardNumber}
              onChange={onPaymentChange}
              className="form-input"
              placeholder="4242 4242 4242 4242"
              required
            />
            {paymentErrors?.cardNumber ? <p className="mt-2 text-sm text-rose-600">{paymentErrors.cardNumber[0]}</p> : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="form-label" htmlFor="stripeExpiry">Expiry</label>
              <input
                id="stripeExpiry"
                name="expiry"
                inputMode="numeric"
                autoComplete="cc-exp"
                value={paymentForm.expiry}
                onChange={onPaymentChange}
                className="form-input"
                placeholder="MM/YY"
                required
              />
              {paymentErrors?.expiry ? <p className="mt-2 text-sm text-rose-600">{paymentErrors.expiry[0]}</p> : null}
            </div>
            <div>
              <label className="form-label" htmlFor="stripeCvc">CVC</label>
              <input
                id="stripeCvc"
                name="cvc"
                inputMode="numeric"
                autoComplete="cc-csc"
                value={paymentForm.cvc}
                onChange={onPaymentChange}
                className="form-input"
                placeholder="123"
                required
              />
              {paymentErrors?.cvc ? <p className="mt-2 text-sm text-rose-600">{paymentErrors.cvc[0]}</p> : null}
            </div>
          </div>
          <div>
            <label className="form-label" htmlFor="stripeCardholder">Cardholder Name</label>
            <input
              id="stripeCardholder"
              name="cardholder"
              autoComplete="cc-name"
              value={paymentForm.cardholder}
              onChange={onPaymentChange}
              className="form-input"
              placeholder="Jane Smith"
              required
            />
            {paymentErrors?.cardholder ? <p className="mt-2 text-sm text-rose-600">{paymentErrors.cardholder[0]}</p> : null}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-4 text-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60">
            <span className="inline-flex items-center gap-2">
              <Icon name="lock" />
              {isSubmitting ? 'Processing Payment…' : `Pay ${formatCurrency(summary.total)}`}
            </span>
          </button>
          <p className="text-center text-xs text-slate-400">Your payment information is encrypted and secure.</p>
        </form>
      </div>
    </div>
  );
}
