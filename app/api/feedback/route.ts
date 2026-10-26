export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { normalizeIndianPhone, sendToTeleCRM } from '@/lib/telecrm';

/**
 * Private feedback from /client-feedback (1–3 star ratings).
 *
 * Sent in parallel to:
 *  - the "Client Feedback" tab of the spreadsheet (Apps Script webhook)
 *  - TeleCRM, as a lead with Lead Request Type "feedback" so the team can
 *    call the client back
 * The client sees success if at least one of the two saved it.
 */

const FEEDBACK_TAB = 'Client Feedback';
const SOURCE = 'Vishwasawali Ayurvedic';

interface FeedbackInput {
  name: string;
  email: string;
  phone: string;
  ratingLabel: string;
  suggestions: string;
  pageUrl: string;
}

async function appendFeedbackToSheet(data: FeedbackInput) {
  const endpoint = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!endpoint) throw new Error('GOOGLE_SHEETS_WEBHOOK_URL is not set');

  const payload = {
    type: 'feedback',
    sheetTab: FEEDBACK_TAB,
    timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    name: data.name,
    email: data.email,
    phone: data.phone,
    rating: data.ratingLabel,
    suggestions: data.suggestions,
    source: data.pageUrl || SOURCE,
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `Google Sheets responded with ${res.status}`);

  let json: { error?: string } = {};
  try { json = text ? JSON.parse(text) : {}; } catch { /* non-JSON success body */ }
  if (json.error) throw new Error(json.error);
  return json;
}

function sendFeedbackToTeleCRM(data: FeedbackInput) {
  return sendToTeleCRM({
    name: data.name,
    phone: data.phone,
    email: data.email,
    message: `Client feedback (${data.ratingLabel}): ${data.suggestions}`,
    pageName: 'client-feedback',
    notes: [
      `Lead Source: ${SOURCE}`,
      `Live URL: ${data.pageUrl || 'Not provided'}`,
      `Rating: ${data.ratingLabel}`,
      `Feedback: ${data.suggestions}`,
      `Email: ${data.email}`,
    ],
  });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim();
  const phone = normalizeIndianPhone(String(body.phone ?? ''));
  const suggestions = String(body.suggestions ?? '').trim();
  const pageUrl = String(body.pageUrl ?? '').trim();
  const ratingNum = Number(body.rating);
  const rating = Number.isInteger(ratingNum) && ratingNum >= 1 && ratingNum <= 5 ? ratingNum : 0;

  if (name.length < 2) {
    return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return NextResponse.json(
      { error: 'Please enter a valid 10-digit Indian mobile number.' },
      { status: 400 }
    );
  }
  if (!suggestions) {
    return NextResponse.json({ error: 'Please tell us what we could do better.' }, { status: 400 });
  }

  const data: FeedbackInput = {
    name,
    email,
    phone,
    ratingLabel: rating ? `${rating}/5` : 'Not given',
    suggestions,
    pageUrl,
  };

  const [sheetResult, crmResult] = await Promise.allSettled([
    appendFeedbackToSheet(data),
    sendFeedbackToTeleCRM(data),
  ]);

  if (sheetResult.status === 'rejected') {
    console.error('[Google Sheets - Feedback] Error:', sheetResult.reason?.message);
  }
  if (crmResult.status === 'rejected') {
    console.error('[TeleCRM - Feedback] Error:', crmResult.reason?.message);
  }

  const sheet = sheetResult.status === 'fulfilled' ? 'ok' : 'failed';
  const crm = crmResult.status === 'fulfilled' ? 'ok' : 'failed';

  if (sheet === 'failed' && crm === 'failed') {
    return NextResponse.json(
      { error: "We couldn't submit that. Please try again.", sheet, crm },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true, sheet, crm }, { status: 201 });
}
