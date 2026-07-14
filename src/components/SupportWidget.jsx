import { startTransition, useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

const QUICK_TOPICS = [
  { value: 'Availability Help', message: 'Hi Hora, I need help checking available dates for a staycation.' },
  { value: 'Booking Support', message: 'Hi Hora, I need help completing my booking and payment.' },
  { value: 'Property Match', message: 'Hi Hora, can you suggest the best property for my trip?' },
  { value: 'Owner Partnership', message: 'Hi Hora, I want to ask about listing or building with Hora.' },
];

export function SupportWidget({ open, onOpen, onClose, onSubmit, authUser, currentPage = 'landing' }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    topic: QUICK_TOPICS[0].value,
    message: QUICK_TOPICS[0].message,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose?.();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open && panelRef.current) {
      const heading = panelRef.current.querySelector('h2');
      heading?.focus();
    }
  }, [open]);

  useEffect(() => {
    startTransition(() => {
      setForm((current) => ({
        ...current,
        name: current.name || authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || '',
        email: current.email || authUser?.email || '',
      }));
    });
  }, [authUser]);

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === 'topic') {
      const nextTopic = QUICK_TOPICS.find((item) => item.value === value);
      setForm((current) => ({
        ...current,
        topic: value,
        message:
          current.message === QUICK_TOPICS.find((item) => item.value === current.topic)?.message
            ? nextTopic?.message || current.message
            : current.message,
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    await onSubmit?.({
      ...form,
      pageContext: currentPage,
    });
    setIsSubmitting(false);
    setForm((current) => ({
      ...current,
      topic: QUICK_TOPICS[0].value,
      message: QUICK_TOPICS[0].message,
    }));
  }

  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-40 bg-slate-950/25 backdrop-blur-[2px]" aria-hidden="true" onClick={onClose} />
      ) : null}

      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="support-title"
          aria-describedby="support-desc"
          className="fixed bottom-20 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm overflow-y-auto rounded-[1.75rem] border border-brand-100 bg-white p-5 shadow-2xl"
          style={{ maxHeight: 'calc(100dvh - 6rem)' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
                <Icon name="comment" />
                Chat Support
              </div>
              <h2 id="support-title" className="mt-3 font-display text-2xl font-bold text-brand-950" tabIndex={-1}>
                Talk to Hora
              </h2>
              <p id="support-desc" className="mt-2 text-sm leading-relaxed text-slate-500">
                Ask about availability, bookings, or owner partnerships and the team can follow up quickly.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ice-100 text-slate-500"
              aria-label="Close support chat"
            >
              <Icon name="close" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {QUICK_TOPICS.map((topic) => (
              <button
                key={topic.value}
                type="button"
                onClick={() => setForm((current) => ({ ...current, topic: topic.value, message: topic.message }))}
                className={`rounded-full px-3 py-2 text-xs font-semibold ${
                  form.topic === topic.value ? 'bg-brand-600 text-white' : 'bg-ice-50 text-brand-700'
                }`}
              >
                {topic.value}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="form-label" htmlFor="support-name">
                  Name
                </label>
                <input
                  id="support-name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="form-label" htmlFor="support-email">
                  Email
                </label>
                <input
                  id="support-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label className="form-label" htmlFor="support-phone">
                Phone
              </label>
              <input
                id="support-phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                className="form-input"
                placeholder="+60 12-345 6789"
              />
            </div>

            <div>
              <label className="form-label" htmlFor="support-topic">
                Topic
              </label>
              <select
                id="support-topic"
                name="topic"
                value={form.topic}
                onChange={handleChange}
                className="form-input"
              >
                {QUICK_TOPICS.map((topic) => (
                  <option key={topic.value} value={topic.value}>
                    {topic.value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" htmlFor="support-message">
                Message
              </label>
              <textarea
                id="support-message"
                name="message"
                rows="4"
                value={form.message}
                onChange={handleChange}
                className="form-input"
                placeholder="Tell Hora what you need help with."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3 text-sm disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-2">
                {isSubmitting ? 'Sending support request…' : 'Send Message'}
                <Icon name="send" />
              </span>
            </button>
          </form>
        </div>
      ) : null}

      <div className="fixed bottom-4 right-4 z-50">
        <button
          type="button"
          onClick={open ? onClose : onOpen}
          aria-expanded={open}
          aria-controls="support-title"
          className="inline-flex min-h-[3.5rem] items-center gap-3 rounded-full bg-brand-950 px-5 py-3 text-sm font-semibold text-white shadow-2xl transition hover:-translate-y-0.5"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <Icon name="comment" className="text-lg" />
          </span>
          <span>{open ? 'Close Chat' : 'Chat Support'}</span>
        </button>
      </div>
    </>
  );
}
