import { Platform } from 'react-native';
import { mockFetch } from './mock/server';

/** Shareable prototype build: the Identity API runs in the browser (src/mock/server.ts). */
export const MOCK = process.env.EXPO_PUBLIC_MOCK === '1';

/** Bump to show minimum-version enforcement: the admin can raise the minimum above this. */
export const APP_VERSION = '1.0.0';

export type Variant = 'user' | 'partner' | 'admin';

export const CLIENT_ID: Record<Variant, string> = {
  user: 'user-app',
  partner: 'partner-app',
  admin: 'admin-portal',
};

/**
 * API base URL. On a phone (Expo Go) set EXPO_PUBLIC_API_URL to http://<your-laptop-LAN-IP>:5080.
 * In the browser it defaults to the same host as the page, port 5080.
 */
export const API_URL: string = MOCK
  ? 'in-browser prototype API'
  : (process.env.EXPO_PUBLIC_API_URL ??
    (Platform.OS === 'web' && typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:5080`
      : 'http://localhost:5080'));

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export interface Tokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

export interface Config {
  sharedIdentityEnabled: boolean;
  minAppVersion: string;
  devOtpInbox: boolean;
}

export interface OtpStart {
  challengeId: string;
  channel: 'phone' | 'email';
  maskedDestination: string;
  scenario: 'register' | 'sign-in' | 'link';
  fromPhase1: boolean;
  message: string;
}

export interface Role {
  role: string;
  grantedVia: string;
  grantedAt: string;
  inThisApp: boolean;
  app: string | null;
}

export interface Profile {
  identityId: string;
  displayName: string;
  source: string;
  createdVia: string;
  createdAt: string;
  hasPassword: boolean;
  contacts: { type: string; value: string; verified: boolean; verifiedAt: string | null }[];
  roles: Role[];
  kyc: {
    status: 'NotStarted' | 'Submitted' | 'Verified' | 'Rejected';
    docType: string | null;
    docRefMasked: string | null;
    submittedVia: string | null;
    submittedAt: string | null;
    verifiedAt: string | null;
  };
}

export interface OtpMessage {
  at: string;
  challengeId: string;
  channel: string;
  to: string;
  client: string;
  code: string;
  text: string;
}

export function makeApi(variant: Variant) {
  const clientId = CLIENT_ID[variant];

  async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
    const headers: Record<string, string> = {
      'X-App-Client': clientId,
      'X-App-Version': APP_VERSION,
      ...(init.headers as Record<string, string>),
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    let res: Response;
    try {
      res = MOCK ? await mockFetch(path, { ...init, headers }) : await fetch(API_URL + path, { ...init, headers });
    } catch {
      throw new ApiError(0, 'network', `Can't reach the Identity API at ${API_URL}. Is it running?`);
    }
    const text = await res.text();
    const body = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const code = body?.error ?? String(res.status);
      const message = body?.error_description ?? body?.message ?? `Request failed (${res.status})`;
      throw new ApiError(res.status, code, message);
    }
    return body as T;
  }

  const json = (method: string, body?: unknown): RequestInit => ({
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  function token(form: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    params.set('client_id', clientId);
    params.set('scope', 'offline_access profile roles');
    Object.entries(form).forEach(([k, v]) => v !== undefined && v !== '' && params.set(k, v));
    return request<Tokens>('/connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
  }

  return {
    clientId,
    config: () => request<Config>('/api/config'),
    otpInbox: () => request<OtpMessage[]>('/api/dev/otp-inbox'),
    requestOtp: (identifier: string, role?: string) =>
      request<OtpStart>('/api/otp/request', json('POST', { client: clientId, identifier, role })),
    otpToken: (challengeId: string, otp: string, role?: string, name?: string) =>
      token({ grant_type: 'urn:sportseek:grant-type:otp', challenge_id: challengeId, otp, role, name }),
    passwordToken: (username: string, password: string) => token({ grant_type: 'password', username, password }),
    refresh: (refreshToken: string) => token({ grant_type: 'refresh_token', refresh_token: refreshToken }),
    phase1Login: (identifier: string, password: string) =>
      request<Phase1Account>('/api/phase1/login', json('POST', { client: clientId, identifier, password })),

    me: (t: string) => request<Profile>('/api/me', {}, t),
    submitKyc: (t: string, docType: string, docNumber: string) => request<Profile>('/api/me/kyc', json('POST', { docType, docNumber }), t),
    setPassword: (t: string, newPassword: string) => request<Profile>('/api/me/password', json('POST', { newPassword }), t),

    admin: {
      identities: (t: string) => request<Profile[]>('/api/admin/identities', {}, t),
      verifyKyc: (t: string, id: string) => request('/api/admin/identities/' + id + '/kyc/verify', json('POST'), t),
      audit: (t: string) => request<AuditRow[]>('/api/admin/audit?take=150', {}, t),
      flags: (t: string) => request<Omit<Config, 'devOtpInbox'>>('/api/admin/flags', {}, t),
      setFlags: (t: string, body: { sharedIdentityEnabled?: boolean; minAppVersion?: string }) =>
        request<Omit<Config, 'devOtpInbox'>>('/api/admin/flags', json('PUT', body), t),
      phase1: (t: string) => request<Phase1Row[]>('/api/admin/phase1', {}, t),
      bootstrap: (t: string) => request<BootstrapReport>('/api/admin/bootstrap', json('POST'), t),
      duplicates: (t: string) => request<DuplicateGroup[]>('/api/admin/duplicates', {}, t),
      resetDemo: (t: string) => request('/api/admin/reset-demo', json('POST'), t),
    },
  };
}

export type Api = ReturnType<typeof makeApi>;

export interface Phase1Account {
  mode: 'phase1';
  app: string;
  legacyId: number;
  name: string;
  businessName: string | null;
  partnerType: string | null;
  kycStatus: string | null;
}

export interface AuditRow {
  id: number;
  at: string;
  action: string;
  client: string | null;
  identityId: string | null;
  identityName: string | null;
  ip: string | null;
  detail: Record<string, unknown> | null;
}

export interface Phase1Row {
  app: string;
  id: number;
  name: string;
  businessName: string | null;
  mobile: string | null;
  email: string | null;
  partnerType: string | null;
  kycStatus: string | null;
  createdAt: string;
  identityId: string | null;
}

export interface DuplicateGroup {
  type: string;
  value: string;
  identities: { identityId: string; displayName: string; source: string; roles: string[]; verified: boolean }[];
}

export interface BootstrapReport {
  phase1UserApp: number;
  phase1PartnerApp: number;
  identitiesCreated: number;
  alreadyMapped: number;
  invalidIdentifiers: number;
  duplicateCandidates: DuplicateGroup[];
}

/** Decodes the access token payload for the "what's in my token" panel. Display only; never trusted. */
export function decodeJwt(token: string): Record<string, unknown> {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = part + '='.repeat((4 - (part.length % 4)) % 4);
    const binary = atob(padded);
    // UTF-8 decode without TextDecoder, which not every React Native runtime provides.
    const utf8 = binary
      .split('')
      .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('');
    return JSON.parse(decodeURIComponent(utf8));
  } catch {
    return {};
  }
}

export function isBelow(version: string, minimum: string): boolean {
  const a = version.split('.').map(Number);
  const b = minimum.split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d !== 0) return d < 0;
  }
  return false;
}
