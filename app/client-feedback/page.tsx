import type { Metadata } from 'next';
import { ClientFeedbackForm } from '@/components/review/ClientFeedbackForm';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: `Help Us Improve | ${SITE.name}`,
  description: `Share private feedback with the ${SITE.name} team.`,
  robots: { index: false, follow: false },
};

export default function ClientFeedbackPage() {
  return <ClientFeedbackForm />;
}
