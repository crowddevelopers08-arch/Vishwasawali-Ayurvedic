'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { SITE } from '@/lib/site';
import { ArrowLeftIcon, CircleCheckIcon, StarIcon } from './icons';

const EMPTY = { name: '', email: '', phone: '', suggestions: '' };

type Status = { type: 'success' | 'error'; text: string } | null;

const inputClass =
  'w-full rounded-xl border border-[var(--r-line)] bg-[var(--r-canvas)] px-4 py-2.5 text-[var(--r-ink)] transition-all duration-150 focus:border-[var(--r-deep)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--r-focus-ring)] disabled:cursor-not-allowed disabled:opacity-60';

/** Private feedback form for 1–3 star ratings coming from the review page. */
export function ClientFeedbackForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    const value = Number(new URLSearchParams(window.location.search).get('rating'));
    if (Number.isInteger(value) && value >= 1 && value <= 5) setRating(value);
  }, []);

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (status) setStatus(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const el = formRef.current;
    if (el && !el.checkValidity()) {
      el.reportValidity();
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, rating, pageUrl: window.location.href }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus({ type: 'success', text: 'Thank you — your feedback has reached our team.' });
        setForm(EMPTY);
      } else {
        setStatus({ type: 'error', text: data.error || "We couldn't submit that. Please try again." });
      }
    } catch {
      setStatus({ type: 'error', text: 'Network error. Please check your connection and try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="review-shell flex min-h-screen flex-col items-center justify-center p-4 sm:p-6">
      <img src={SITE.logo} alt="Logo" className="mt-4 h-auto w-[180px] sm:w-[220px]" />
      <div className="mx-auto mb-6 mt-5 w-full max-w-[560px] rounded-[28px] bg-[var(--r-card)] p-5 shadow-[0_40px_80px_-40px_rgba(16,22,17,0.75)] sm:mt-6 sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-[var(--r-ink)]">Help Us Improve</h1>
          <p className="mx-auto mt-2.5 max-w-[46ch] text-[0.9rem] leading-relaxed text-[var(--r-muted)] sm:text-[0.98rem]">
            Tell us what didn&apos;t meet your expectations. We genuinely value your feedback and will work
            on making things better.
          </p>
          {rating > 0 && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--r-accent-soft)] px-3.5 py-1.5">
              <span className="flex items-center gap-0.5" aria-hidden>
                {[1, 2, 3, 4, 5].map((n) => (
                  <StarIcon
                    key={n}
                    className={`h-3.5 w-3.5 ${
                      n <= rating
                        ? 'fill-[var(--r-accent)] text-[var(--r-accent)]'
                        : 'fill-transparent text-[var(--r-accent-line)]'
                    }`}
                  />
                ))}
              </span>
              <span className="text-[0.78rem] font-semibold text-[var(--r-accent-deep)]">
                You rated us {rating} out of 5
              </span>
            </p>
          )}
        </div>

        {status && (
          <div
            role="status"
            aria-live="polite"
            className={`mb-5 flex items-start gap-2.5 rounded-2xl border-l-4 p-4 text-[0.9rem] leading-relaxed ${
              status.type === 'success'
                ? 'border-[var(--r-deep)] bg-[var(--r-accent-soft)] text-[var(--r-deep)]'
                : 'border-red-500 bg-red-50 text-red-800'
            }`}
          >
            {status.type === 'success' && <CircleCheckIcon className="mt-0.5 h-4 w-4 flex-none" />}
            {status.text}
          </div>
        )}

        <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-3.5">
          <Field label="Full Name" htmlFor="fb-name">
            <input
              id="fb-name"
              name="name"
              type="text"
              required
              autoComplete="name"
              value={form.name}
              onChange={onChange}
              disabled={submitting}
              placeholder="Your full name"
              className={inputClass}
            />
          </Field>
          <Field label="Email Address" htmlFor="fb-email">
            <input
              id="fb-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={onChange}
              disabled={submitting}
              placeholder="you@example.com"
              className={inputClass}
            />
          </Field>
          <Field label="Phone Number" htmlFor="fb-phone">
            <input
              id="fb-phone"
              name="phone"
              type="tel"
              required
              inputMode="numeric"
              pattern="[6-9][0-9]{9}"
              autoComplete="tel"
              value={form.phone}
              onChange={onChange}
              disabled={submitting}
              placeholder="10-digit mobile number"
              className={inputClass}
            />
          </Field>
          <Field label="Your Suggestions" htmlFor="fb-suggestions">
            <textarea
              id="fb-suggestions"
              name="suggestions"
              required
              rows={4}
              value={form.suggestions}
              onChange={onChange}
              disabled={submitting}
              placeholder="Tell us what we could have done better..."
              className={`${inputClass} resize-none`}
            />
          </Field>
          <button
            type="submit"
            disabled={submitting}
            style={{ paddingTop: 13, paddingBottom: 13 }}
            className="r-btn r-btn-primary mt-1 w-full disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>

        <a href="/" className="r-btn r-btn-ghost mt-3 w-full">
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </a>
      </div>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.06em] text-[var(--r-muted)]"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
