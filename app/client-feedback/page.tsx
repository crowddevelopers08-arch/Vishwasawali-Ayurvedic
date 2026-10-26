import type { Metadata } from 'next';
import { ClientFeedbackForm } from '@/components/review/ClientFeedbackForm';

export const metadata: Metadata = {
  title: 'Help Us Improve',
  description: 'Share private feedback with our team.',
  robots: { index: false, follow: false },
};

export default function ClientFeedbackPage() {
  return <ClientFeedbackForm />;
}
