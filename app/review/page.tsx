import type { Metadata } from 'next';
import { RatingPicker } from '@/components/review/RatingPicker';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: `Share Your Review | ${SITE.name}`,
  description: `Tell us about your experience at ${SITE.name}.`,
  robots: { index: false, follow: false },
};

export default function ReviewPage() {
  return (
    <div className="review-shell flex min-h-screen flex-col items-center justify-center p-4 sm:p-6">
      {/* The logo's background is the page green, so it sits on the frame, not the card. */}
      <img src={SITE.logo} alt={SITE.name} className="mb-5 h-auto w-[200px] sm:mb-6 sm:w-[240px]" />
      <div className="mx-auto w-full max-w-[460px] rounded-[28px] bg-[var(--r-card)] px-5 py-8 shadow-[0_40px_80px_-40px_rgba(16,22,17,0.75)] sm:px-9 sm:py-10">
        <RatingPicker />
      </div>
    </div>
  );
}
