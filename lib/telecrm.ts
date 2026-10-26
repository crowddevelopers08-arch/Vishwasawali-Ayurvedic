/**
 * TeleCRM "autoupdatelead" client used by /api/feedback.
 *
 * TeleCRM answers `200 {"result":"Accepted"}` straight away and creates the
 * lead later, so a field it can't map fails silently — the API never reports
 * it. To stay safe, `fields` only carries the standard Grow Medico lead fields;
 * feedback details — rating, suggestions, URL — go into SYSTEM_NOTE actions,
 * which can't fail on a field mismatch.
 */

export interface TeleCRMFeedbackLead {
  name: string;
  phone: string;
  email?: string;
  /** Short summary shown in the lead's message field. */
  message: string;
  /** Identifies which form/page the lead came from. */
  pageName: string;
  /** Extra details, each written as a note on the lead. */
  notes: string[];
}

const CITY = 'Gurugram';
const STATE = 'Haryana';
const REQUEST_TYPE = 'feedback';

/** Ten-digit Indian mobile number, without +91 / 0 prefix. */
export function normalizeIndianPhone(raw: string): string {
  return raw.replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '');
}

export async function sendToTeleCRM(lead: TeleCRMFeedbackLead) {
  const endpoint = process.env.TELECRM_API_URL;
  const apiKey = process.env.TELECRM_API_KEY;
  if (!endpoint) throw new Error('TELECRM_API_URL is not set');
  if (!apiKey) throw new Error('TELECRM_API_KEY is not set');

  const createdOn = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const email = lead.email?.trim() || '';

  const payload = {
    fields: {
      name: lead.name.trim(),
      phone: normalizeIndianPhone(lead.phone),
      ...(email ? { email } : {}),
      city_1: CITY,
      message: lead.message,
      Country: 'India',
      State: STATE,
      CreatedOn: createdOn,
      'Lead Status': 'new',
      'Lead Request Type': REQUEST_TYPE,
      PageName: lead.pageName,
    },
    actions: [...lead.notes, 'Consent Given: Yes'].map((text) => ({ type: 'SYSTEM_NOTE', text })),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-Client-ID': 'review-funnel-website',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: 'no-store',
    });

    if (res.status === 204) return { result: 'Accepted' };

    const text = await res.text();
    if (text.trim().startsWith('<')) {
      throw new Error(`TeleCRM returned HTML (HTTP ${res.status}) - check TELECRM_API_URL`);
    }

    let json: { error?: string; message?: string; result?: string } = {};
    try { json = text ? JSON.parse(text) : {}; } catch { /* non-JSON body */ }

    if (!res.ok || json.error) {
      throw new Error(`TeleCRM HTTP ${res.status}: ${json.error || json.message || text || 'no body'}`);
    }
    return json;
  } finally {
    clearTimeout(timeout);
  }
}
