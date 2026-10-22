'use client';

import { useState } from 'react';
import {
  GOOGLE_REVIEW_FALLBACK_URL,
  GOOGLE_REVIEW_URL,
  REVIEW_LINK_IS_PLACEHOLDER,
} from '@/lib/site';
import { StarIcon } from './icons';

const reviewUrl = REVIEW_LINK_IS_PLACEHOLDER ? GOOGLE_REVIEW_FALLBACK_URL : GOOGLE_REVIEW_URL;

const RATINGS = [1, 2, 3, 4, 5];
/** Index 0 is the resting face; 1–5 follow the hovered / chosen rating. */
const FACES = ['😌', '😞', '😕', '😐', '🙂', '😍'];

/**
 * Five-star gate: 4–5 stars send the visitor to Google to post a public
 * review, 1–3 stars go to the private /client-feedback form instead.
 */
export function RatingPicker() {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const shown = selected || hovered;

  const choose = (rating: number) => {
    if (selected) return;
    setSelected(rating);
    window.setTimeout(() => {
      window.location.href = rating >= 4 ? reviewUrl : `/client-feedback?rating=${rating}`;
    }, 450);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[22px] border border-[var(--r-line)] bg-[var(--r-canvas)] sm:h-20 sm:w-20">
        <span key={shown} aria-hidden className="r-pop text-[2.1rem] leading-none sm:text-[2.4rem]">
          {FACES[shown]}
        </span>
      </div>

      <h1 className="mt-6 text-center text-[var(--r-deep)]">How was your experience?</h1>
      <p className="mx-auto mt-2.5 max-w-[34ch] text-center text-[0.92rem] leading-relaxed text-[var(--r-muted)] sm:text-[0.98rem]">
        Please rate your visit. Your feedback helps us improve our care.
      </p>

      <div
        role="group"
        aria-label="Rate your experience out of 5"
        className="mt-7 flex items-center justify-center gap-2 sm:gap-2.5"
        onMouseLeave={() => setHovered(0)}
      >
        {RATINGS.map((rating) => {
          const active = rating <= shown;
          return (
            <button
              key={rating}
              type="button"
              disabled={!!selected}
              aria-label={`${rating} star${rating === 1 ? '' : 's'}`}
              onMouseEnter={() => setHovered(rating)}
              onFocus={() => setHovered(rating)}
              onBlur={() => setHovered(0)}
              onClick={() => choose(rating)}
              className={`flex h-12 w-12 flex-none cursor-pointer items-center justify-center rounded-2xl border transition-all duration-200 focus-visible:outline-none disabled:cursor-default sm:h-14 sm:w-14 ${
                active
                  ? '-translate-y-0.5 border-[var(--r-accent-line)] bg-[var(--r-accent-soft)]'
                  : 'border-[var(--r-line)] bg-[var(--r-canvas)] hover:border-[var(--r-accent-line)]'
              }`}
            >
              <StarIcon
                className={`h-5 w-5 transition-colors duration-200 sm:h-6 sm:w-6 ${
                  active
                    ? 'fill-[var(--r-accent)] text-[var(--r-accent)]'
                    : 'fill-[var(--r-line)] text-[var(--r-line)]'
                }`}
              />
            </button>
          );
        })}
      </div>

      <p
        aria-live="polite"
        className="mt-5 min-h-[1.1rem] text-center text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[var(--r-deep)]"
      >
        {selected
          ? selected >= 4
            ? 'Thank you — taking you to Google'
            : 'Thank you — one more step'
          : 'Select your rating'}
      </p>
    </div>
  );
}
