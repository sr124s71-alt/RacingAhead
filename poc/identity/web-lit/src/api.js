// API client for the Identity POC. The same calls go either to the real .NET API or, in the
// shareable prototype build, to the in-browser port of it (app/src/mock/server.ts).
import { mockFetch } from '../../app/src/mock/server.ts';

/* global __MOCK__, __API_URL__ */
export const MOCK = __MOCK__;
export const API_URL = __API_URL__;
export const APP_VERSION = '1.0.0';

export const CLIENT = { user: 'user-app', partner: 'partner-app', admin: 'admin-portal' };

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function makeApi(variant) {
  const clientId = CLIENT[variant];

  async function request(path, init = {}, token) {
    const headers = { 'X-App-Client': clientId, 'X-App-Version': APP_VERSION, ...(init.headers ?? {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    let res;
    try {
      res = MOCK ? await mockFetch(path, { ...init, headers }) : await fetch(API_URL + path, { ...init, headers });
    } catch {
      throw new ApiError(0, 'network', `Can't reach the Identity API at ${API_URL}. Is it running?`);
    }
    const text = await res.text();
    const body = text ? JSON.parse(text) : null;
    if (!res.ok) {
      throw new ApiError(res.status, body?.error ?? String(res.status), body?.error_description ?? body?.message ?? `Request failed (${res.status})`);
    }
    return body;
  }

  const json = (method, body) => ({
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const token = (form) => {
    const p = new URLSearchParams({ client_id: clientId, scope: 'offline_access profile roles' });
    Object.entries(form).forEach(([k, v]) => v !== undefined && v !== '' && p.set(k, v));
    return request('/connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: p.toString(),
    });
  };

  return {
    clientId,
    config: () => request('/api/config'),
    otpInbox: () => request('/api/dev/otp-inbox'),
    requestOtp: (identifier, role) => request('/api/otp/request', json('POST', { client: clientId, identifier, role })),
    otpToken: (challengeId, otp, role, name) =>
      token({ grant_type: 'urn:sportseek:grant-type:otp', challenge_id: challengeId, otp, role, name }),
    passwordToken: (username, password) => token({ grant_type: 'password', username, password }),
    refresh: (refreshToken) => token({ grant_type: 'refresh_token', refresh_token: refreshToken }),
    phase1Login: (identifier, password) => request('/api/phase1/login', json('POST', { client: clientId, identifier, password })),
    me: (t) => request('/api/me', {}, t),
    submitKyc: (t, docType, docNumber) => request('/api/me/kyc', json('POST', { docType, docNumber }), t),
    setPassword: (t, newPassword) => request('/api/me/password', json('POST', { newPassword }), t),
    admin: {
      identities: (t) => request('/api/admin/identities', {}, t),
      verifyKyc: (t, id) => request(`/api/admin/identities/${id}/kyc/verify`, json('POST'), t),
      audit: (t) => request('/api/admin/audit?take=150', {}, t),
      flags: (t) => request('/api/admin/flags', {}, t),
      setFlags: (t, body) => request('/api/admin/flags', json('PUT', body), t),
      phase1: (t) => request('/api/admin/phase1', {}, t),
      bootstrap: (t) => request('/api/admin/bootstrap', json('POST'), t),
      duplicates: (t) => request('/api/admin/duplicates', {}, t),
      resetDemo: (t) => request('/api/admin/reset-demo', json('POST'), t),
    },
  };
}

/** Decodes the access-token payload for display. Never trusted for decisions. */
export function decodeJwt(tok) {
  try {
    const part = tok.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(part + '='.repeat((4 - (part.length % 4)) % 4));
    return JSON.parse(decodeURIComponent([...bin].map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')));
  } catch {
    return {};
  }
}

export function isBelow(version, minimum) {
  const a = version.split('.').map(Number);
  const b = minimum.split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d) return d < 0;
  }
  return false;
}

// Per-app session, like separate apps on separate phones.
export function loadSession(variant) {
  try {
    const raw = sessionStorage.getItem('lit-tokens:' + variant);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(variant, tokens) {
  try {
    if (tokens) sessionStorage.setItem('lit-tokens:' + variant, JSON.stringify(tokens));
    else sessionStorage.removeItem('lit-tokens:' + variant);
  } catch {
    // storage unavailable: session stays in memory
  }
}
