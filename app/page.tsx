import { redirect } from 'next/navigation';

/** The site is only the review funnel, so the root goes straight to it. */
export default function Home() {
  redirect('/review');
}
