/**
 * In-browser stand-in for the .NET Identity API, used only by the shareable prototype build
 * (EXPO_PUBLIC_MOCK=1). It mirrors the endpoints and rules of poc/identity/api, including
 * LinkingService, OtpService and BootstrapService, so the prototype behaves like the real POC
 * without a server. State lives in this browser tab (and localStorage, when available).
 * The real API is the reference: behaviour here is kept deliberately close to it.
 */

type Json = Record<string, unknown>;

interface Contact {
  type: 'phone' | 'email';
  value: string;
  verified: boolean;
  verifiedAt: string | null;
  source: string;
}
interface RoleAssignment {
  role: string;
  grantedVia: string;
  grantedAt: string;
}
interface Kyc {
  status: 'NotStarted' | 'Submitted' | 'Verified' | 'Rejected';
  docType: string | null;
  docRefMasked: string | null;
  submittedVia: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
}
interface Identity {
  id: string;
  displayName: string;
  source: 'native' | 'legacy-user-app' | 'legacy-partner-app';
  createdVia: string;
  createdAt: string;
  password: string | null;
  failedPasswords: number;
  lockedUntil: number | null;
  contacts: Contact[];
  roles: RoleAssignment[];
  kyc: Kyc;
}
interface Challenge {
  id: string;
  client: string;
  channel: 'phone' | 'email';
  destination: string;
  code: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
  consumed: boolean;
}
interface Lockout {
  failed: number;
  windowStart: number;
  lockedUntil: number | null;
}
interface AuditEntry {
  id: number;
  at: string;
  action: string;
  client: string | null;
  identityId: string | null;
  ip: string | null;
  detail: Json | null;
}
interface Session {
  sub: string;
  client: string;
  roles: string[];
  exp: number;
}
interface State {
  identities: Identity[];
  challenges: Challenge[];
  lockouts: Record<string, Lockout>;
  audit: AuditEntry[];
  auditSeq: number;
  flags: { f3: boolean; minAppVersion: string };
  legacyMap: { app: string; legacyId: number; identityId: string }[];
  inbox: { at: string; challengeId: string; channel: string; to: string; client: string; code: string; text: string }[];
  access: Record<string, Session>;
  refresh: Record<string, { sub: string; client: string }>;
}

const ADMIN_PHONE = '+919000000001';
const OTP = { ttlMin: 5, maxAttempts: 5, maxFailures: 5, lockoutMin: 15, maxRequests: 5, windowMin: 15 };
const MIN = 60_000;

const APPS: Record<string, { name: string; defaultRole: string; roles: string[]; gated: boolean }> = {
  'user-app': { name: 'SportSeek User App', defaultRole: 'Player', roles: ['Player', 'EventOrganiser'], gated: true },
  'partner-app': {
    name: 'SportSeek Partner App',
    defaultRole: 'FacilityPartner',
    roles: ['FacilityPartner', 'Coach', 'Physio', 'Nutritionist'],
    gated: true,
  },
  'admin-portal': { name: 'SportSeek Admin Portal', defaultRole: 'Admin', roles: ['Admin'], gated: false },
};
const ROLE_LABEL: Record<string, string> = { EventOrganiser: 'Event Organiser', FacilityPartner: 'Facility Partner' };
const label = (r: string) => ROLE_LABEL[r] ?? r;

const PHASE1 = [
  {
    app: 'user-app',
    id: 1,
    name: 'Arjun Mehta',
    businessName: null,
    mobile: '98765 43210',
    email: 'arjun.mehta@example.com',
    partnerType: null,
    kycStatus: null,
    createdAt: '2025-11-02',
  },
  {
    app: 'user-app',
    id: 2,
    name: 'Priya Nair',
    businessName: null,
    mobile: '9123456780',
    email: 'priya.nair@example.com',
    partnerType: null,
    kycStatus: null,
    createdAt: '2025-12-14',
  },
  {
    app: 'user-app',
    id: 3,
    name: 'Rahul Verma',
    businessName: null,
    mobile: '+91 99887 76655',
    email: 'Rahul.Verma@Example.com',
    partnerType: null,
    kycStatus: null,
    createdAt: '2026-01-09',
  },
  {
    app: 'user-app',
    id: 4,
    name: 'Sneha Iyer',
    businessName: null,
    mobile: '9812345678',
    email: 'sneha.iyer@example.com',
    partnerType: null,
    kycStatus: null,
    createdAt: '2026-02-21',
  },
  {
    app: 'user-app',
    id: 5,
    name: 'Karan Singh',
    businessName: null,
    mobile: '090011 22334',
    email: null,
    partnerType: null,
    kycStatus: null,
    createdAt: '2026-03-30',
  },
  {
    app: 'user-app',
    id: 6,
    name: 'Ananya Rao',
    businessName: null,
    mobile: '9445566778',
    email: 'ananya.rao@example.com',
    partnerType: null,
    kycStatus: null,
    createdAt: '2026-05-18',
  },
  {
    app: 'partner-app',
    id: 1,
    name: 'Arjun Mehta',
    businessName: "Arjun's Turf Arena",
    mobile: '+91-9876543210',
    email: 'turf@arjunsarena.in',
    partnerType: 'facility',
    kycStatus: 'verified',
    createdAt: '2026-01-15',
  },
  {
    app: 'partner-app',
    id: 2,
    name: 'Priya Nair',
    businessName: 'Priya Tennis Coaching',
    mobile: '09123456780',
    email: 'coach.priya@example.com',
    partnerType: 'coach',
    kycStatus: 'pending',
    createdAt: '2026-03-03',
  },
  {
    app: 'partner-app',
    id: 3,
    name: 'Rahul Verma',
    businessName: 'Verma Sports Physio',
    mobile: '9988776600',
    email: 'rahul.verma@example.com',
    partnerType: 'physio',
    kycStatus: 'verified',
    createdAt: '2026-04-11',
  },
  {
    app: 'partner-app',
    id: 4,
    name: 'Vikram Patel',
    businessName: 'Smash Badminton Hub',
    mobile: '9876501234',
    email: 'hello@smashhub.in',
    partnerType: 'facility',
    kycStatus: 'verified',
    createdAt: '2026-04-27',
  },
  {
    app: 'partner-app',
    id: 5,
    name: 'Meera Joshi',
    businessName: 'FitFuel Nutrition',
    mobile: '9765432109',
    email: 'meera@fitfuel.in',
    partnerType: 'nutritionist',
    kycStatus: 'pending',
    createdAt: '2026-06-05',
  },
];
const PHASE1_PASSWORD = 'demo1234';

// ---------------------------------------------------------------- state

const STORE_KEY = 'sportseek-identity-proto-v1';
let state: State = load() ?? fresh();

function fresh(): State {
  const now = new Date().toISOString();
  return {
    identities: [
      {
        id: uuid(),
        displayName: 'SportSeek Ops Admin',
        source: 'native',
        createdVia: 'seed',
        createdAt: now,
        password: null,
        failedPasswords: 0,
        lockedUntil: null,
        contacts: [{ type: 'phone', value: ADMIN_PHONE, verified: true, verifiedAt: now, source: 'seed' }],
        roles: [{ role: 'Admin', grantedVia: 'seed', grantedAt: now }],
        kyc: emptyKyc(),
      },
    ],
    challenges: [],
    lockouts: {},
    audit: [],
    auditSeq: 0,
    flags: { f3: true, minAppVersion: '1.0.0' },
    legacyMap: [],
    inbox: [],
    access: {},
    refresh: {},
  };
}

function load(): State | null {
  try {
    const raw = globalThis.localStorage?.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as State) : null;
  } catch {
    return null;
  }
}

function save() {
  try {
    globalThis.localStorage?.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable: the prototype keeps working in memory
  }
}

function emptyKyc(): Kyc {
  return { status: 'NotStarted', docType: null, docRefMasked: null, submittedVia: null, submittedAt: null, verifiedAt: null };
}

function uuid(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function audit(action: string, identityId: string | null = null, client: string | null = null, detail: Json | null = null) {
  state.audit.push({ id: ++state.auditSeq, at: new Date().toISOString(), action, client, identityId, ip: 'this browser', detail });
}

// ---------------------------------------------------------------- identifiers

interface Ident {
  type: 'phone' | 'email';
  value: string;
}

/** Indian mobiles to E.164 (+91 and 10 digits starting 6–9); emails trimmed and lower-cased. */
function normalise(raw: string | null | undefined): Ident | null {
  if (!raw || !raw.trim()) return null;
  const v = raw.trim();
  if (v.includes('@')) {
    const e = v.toLowerCase();
    const at = e.indexOf('@');
    return at > 0 && at < e.length - 3 && e.indexOf('.', at) > at ? { type: 'email', value: e } : null;
  }
  if (/[^\d\s()+-]/.test(v)) return null;
  let d = v.replace(/\D/g, '');
  if (v.startsWith('+')) {
    if (!d.startsWith('91')) return null;
    d = d.slice(2);
  } else if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? { type: 'phone', value: '+91' + d } : null;
}

function mask(id: Ident): string {
  return id.type === 'phone'
    ? id.value.slice(0, 3) + '•'.repeat(Math.max(0, id.value.length - 7)) + id.value.slice(-4)
    : id.value[0] + '•••' + id.value.slice(id.value.indexOf('@'));
}

// ---------------------------------------------------------------- linking

const holds = (i: Identity, id: Ident, verified?: boolean) =>
  i.contacts.some((c) => c.type === id.type && c.value === id.value && (verified === undefined || c.verified === verified));

function byVerifiedContact(id: Ident) {
  return state.identities.find((i) => holds(i, id, true)) ?? null;
}

/** Verified contact first; otherwise a Phase 1 identity holding it, preferring the one from this app. */
function findOwner(client: string, id: Ident): Identity | null {
  const verified = byVerifiedContact(id);
  if (verified) return verified;
  const legacy = client === 'partner-app' ? 'legacy-partner-app' : 'legacy-user-app';
  const candidates = state.identities
    .filter((i) => i.source !== 'native' && holds(i, id))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return candidates.find((i) => i.source === legacy) ?? candidates[0] ?? null;
}

function verifyContact(i: Identity, id: Ident): boolean {
  const c = i.contacts.find((x) => x.type === id.type && x.value === id.value);
  const now = new Date().toISOString();
  if (!c) {
    i.contacts.push({ type: id.type, value: id.value, verified: true, verifiedAt: now, source: 'otp' });
    return false;
  }
  if (c.verified) return false;
  c.verified = true;
  c.verifiedAt = now;
  return true;
}

function completeOtp(client: string, id: Ident, requestedRole?: string, displayName?: string) {
  const app = APPS[client];
  const role = requestedRole && app.roles.includes(requestedRole) ? requestedRole : app.defaultRole;
  let identity = findOwner(client, id);
  let outcome = 'SignedIn';

  if (client === 'admin-portal') {
    if (!identity || !identity.roles.some((r) => r.role === 'Admin')) return { outcome: 'Refused' as const, identity };
    verifyContact(identity, id);
    audit('SIGNED_IN', identity.id, client, { via: 'otp' });
    return { outcome: 'SignedIn', identity, roleAdded: undefined };
  }

  if (!identity) {
    const now = new Date().toISOString();
    identity = {
      id: uuid(),
      displayName: displayName?.trim() || 'SportSeek member',
      source: 'native',
      createdVia: client,
      createdAt: now,
      password: null,
      failedPasswords: 0,
      lockedUntil: null,
      contacts: [{ type: id.type, value: id.value, verified: true, verifiedAt: now, source: 'otp' }],
      roles: [{ role, grantedVia: client, grantedAt: now }],
      kyc: emptyKyc(),
    };
    state.identities.push(identity);
    audit('IDENTITY_CREATED', identity.id, client, { identifier: mask(id), role, reason: 'No identity holds this verified identifier' });
    return { outcome: 'Created', identity, roleAdded: role };
  }

  if (verifyContact(identity, id)) {
    outcome = 'ClaimedLegacy';
    audit('LEGACY_IDENTITY_CLAIMED', identity.id, client, {
      identifier: mask(id),
      source: identity.source,
      reason: 'Ownership of Phase 1 contact proved by OTP',
    });
  }

  let roleAdded: string | undefined;
  const hasAppRole = identity.roles.some((r) => app.roles.includes(r.role));
  if (!hasAppRole || (requestedRole && role === requestedRole && !identity.roles.some((r) => r.role === role))) {
    const existing = identity.roles.map((r) => r.role);
    identity.roles.push({ role, grantedVia: client, grantedAt: new Date().toISOString() });
    roleAdded = role;
    if (outcome !== 'ClaimedLegacy') outcome = 'Linked';
    audit('ROLE_LINKED', identity.id, client, {
      identifier: mask(id),
      role,
      existingRoles: existing,
      reason: 'Existing identity matched on verified identifier; ownership proved by OTP; role added, no new record',
    });
  }
  audit('SIGNED_IN', identity.id, client, { via: 'otp', outcome });
  return { outcome, identity, roleAdded };
}

// ---------------------------------------------------------------- tokens

function b64url(s: string) {
  return btoa(unescape(encodeURIComponent(s)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function issue(identity: Identity, client: string, outcome: string, roleAdded?: string) {
  const roles = identity.roles
    .map((r) => r.role)
    .filter((r) => APPS[client].roles.includes(r))
    .sort();
  const iat = Math.floor(Date.now() / 1000);
  const claims: Json = {
    iss: 'in-browser-prototype',
    sub: identity.id,
    name: identity.displayName,
    app: client,
    link_outcome: outcome,
    role: roles.length === 1 ? roles[0] : roles,
    scope: 'offline_access profile roles',
    iat,
    exp: iat + 15 * 60,
    client_id: client,
    jti: uuid(),
  };
  if (roleAdded) claims.role_added = roleAdded;
  const access = `${b64url(JSON.stringify({ alg: 'none', typ: 'JWT' }))}.${b64url(JSON.stringify(claims))}.prototype`;
  const refresh = uuid();
  state.access[access] = { sub: identity.id, client, roles, exp: (iat + 15 * 60) * 1000 };
  state.refresh[refresh] = { sub: identity.id, client };
  return { access_token: access, token_type: 'Bearer', expires_in: 900, refresh_token: refresh };
}

// ---------------------------------------------------------------- responses

interface Req {
  method: string;
  path: string;
  query: URLSearchParams;
  headers: Record<string, string>;
  body: string | undefined;
}
type Res = { status: number; body?: unknown };

const ok = (body: unknown): Res => ({ status: 200, body });
const problem = (status: number, error: string, message: string): Res => ({ status, body: { error, message } });
const tokenError = (error: string, description: string): Res => ({ status: 400, body: { error, error_description: description } });

function session(req: Req): Session | null {
  const auth = req.headers.authorization ?? req.headers.Authorization ?? '';
  const s = state.access[auth.replace(/^Bearer /, '')];
  return s && s.exp > Date.now() && state.identities.some((i) => i.id === s.sub) ? s : null;
}

function profile(i: Identity, currentApp: string | null) {
  const appRoles = currentApp ? (APPS[currentApp]?.roles ?? []) : [];
  return {
    identityId: i.id,
    displayName: i.displayName,
    source: i.source,
    createdVia: i.createdVia,
    createdAt: i.createdAt,
    hasPassword: i.password !== null,
    contacts: [...i.contacts]
      .sort((a, b) => a.type.localeCompare(b.type))
      .map((c) => ({ type: c.type, value: c.value, verified: c.verified, verifiedAt: c.verifiedAt })),
    roles: [...i.roles]
      .sort((a, b) => a.grantedAt.localeCompare(b.grantedAt))
      .map((r) => ({
        ...r,
        inThisApp: appRoles.includes(r.role),
        app: Object.keys(APPS).find((k) => APPS[k].roles.includes(r.role)) ?? null,
      })),
    kyc: { ...i.kyc },
  };
}

function isBelow(v: string, min: string) {
  const a = v.split('.').map(Number);
  const b = min.split('.').map(Number);
  for (let k = 0; k < Math.max(a.length, b.length); k++) {
    const d = (a[k] ?? 0) - (b[k] ?? 0);
    if (d) return d < 0;
  }
  return false;
}

function duplicates() {
  const groups = new Map<string, { type: string; value: string; members: { i: Identity; c: Contact }[] }>();
  for (const i of state.identities)
    for (const c of i.contacts) {
      const key = c.type + '|' + c.value;
      if (!groups.has(key)) groups.set(key, { type: c.type, value: c.value, members: [] });
      groups.get(key)!.members.push({ i, c });
    }
  return [...groups.values()]
    .filter((g) => new Set(g.members.map((m) => m.i.id)).size > 1)
    .sort((a, b) => a.value.localeCompare(b.value))
    .map((g) => ({
      type: g.type,
      value: g.value,
      identities: g.members.map(({ i, c }) => ({
        identityId: i.id,
        displayName: i.displayName,
        source: i.source,
        roles: i.roles.map((r) => r.role),
        verified: c.verified,
      })),
    }));
}

function bootstrap() {
  let created = 0;
  let skipped = 0;
  let invalid = 0;
  for (const a of PHASE1) {
    if (state.legacyMap.some((m) => m.app === a.app && m.legacyId === a.id)) {
      skipped++;
      continue;
    }
    const partner = a.app === 'partner-app';
    const createdAt = new Date(a.createdAt).toISOString();
    const identity: Identity = {
      id: uuid(),
      displayName: a.name,
      source: partner ? 'legacy-partner-app' : 'legacy-user-app',
      createdVia: 'bootstrap',
      createdAt,
      password: null,
      failedPasswords: 0,
      lockedUntil: null,
      contacts: [],
      roles: [
        {
          role: partner
            ? ({ coach: 'Coach', physio: 'Physio', nutritionist: 'Nutritionist' }[a.partnerType ?? ''] ?? 'FacilityPartner')
            : 'Player',
          grantedVia: 'bootstrap',
          grantedAt: createdAt,
        },
      ],
      kyc:
        a.kycStatus === 'verified'
          ? {
              status: 'Verified',
              docType: 'Phase 1 record',
              docRefMasked: null,
              submittedVia: a.app,
              submittedAt: null,
              verifiedAt: createdAt,
            }
          : emptyKyc(),
    };
    for (const raw of [a.mobile, a.email]) {
      if (!raw) continue;
      const id = normalise(raw);
      if (!id) {
        invalid++;
        continue;
      }
      identity.contacts.push({ type: id.type, value: id.value, verified: false, verifiedAt: null, source: 'legacy-bootstrap' });
    }
    state.identities.push(identity);
    state.legacyMap.push({ app: a.app, legacyId: a.id, identityId: identity.id });
    created++;
  }
  const dupes = duplicates();
  audit('BOOTSTRAP_RUN', null, null, { created, skipped, invalid, duplicateGroups: dupes.length });
  return {
    phase1UserApp: PHASE1.filter((a) => a.app === 'user-app').length,
    phase1PartnerApp: PHASE1.filter((a) => a.app === 'partner-app').length,
    identitiesCreated: created,
    alreadyMapped: skipped,
    invalidIdentifiers: invalid,
    duplicateCandidates: dupes,
  };
}

function passwordProblem(pw: string): string | null {
  const errs = [];
  if (pw.length < 8) errs.push('Passwords must be at least 8 characters.');
  if (!/\d/.test(pw)) errs.push("Passwords must have at least one digit ('0'-'9').");
  if (!/[a-z]/.test(pw)) errs.push("Passwords must have at least one lowercase ('a'-'z').");
  return errs.length ? errs.join(' ') : null;
}

// ---------------------------------------------------------------- routes

function route(req: Req): Res {
  const { method, path } = req;
  const json = (): Json => (req.body ? JSON.parse(req.body) : {});
  const now = Date.now();

  // Minimum-version enforcement, as MinimumVersionMiddleware.
  const client = req.headers['X-App-Client'];
  const version = req.headers['X-App-Version'];
  if (version && (client === 'user-app' || client === 'partner-app') && !path.startsWith('/api/config') && !path.startsWith('/api/dev')) {
    if (isBelow(version, state.flags.minAppVersion))
      return { status: 426, body: { error: 'upgrade_required', minAppVersion: state.flags.minAppVersion, yourVersion: version } };
  }

  if (method === 'GET' && path === '/api/config')
    return ok({ sharedIdentityEnabled: state.flags.f3, minAppVersion: state.flags.minAppVersion, devOtpInbox: true });

  if (method === 'GET' && path === '/api/dev/otp-inbox') return ok([...state.inbox].reverse().slice(0, 20));

  if (method === 'POST' && path === '/api/otp/request') {
    const body = json() as { client?: string; identifier?: string; role?: string };
    const app = APPS[body.client ?? ''];
    if (!app) return problem(400, 'unknown_client', 'Unknown app.');
    if (app.gated && !state.flags.f3) return problem(409, 'f3_disabled', 'Shared Identity is switched off. Use the Phase 1 login.');
    const id = normalise(body.identifier);
    if (!id) return problem(400, 'invalid_identifier', 'Enter a valid Indian mobile number or email address.');
    const lock = state.lockouts[id.value];
    if (lock?.lockedUntil && lock.lockedUntil > now)
      return problem(
        423,
        'locked_out',
        `Too many incorrect codes for this number. Try again after ${new Date(lock.lockedUntil).toLocaleTimeString()}.`,
      );
    if (state.challenges.filter((c) => c.destination === id.value && c.createdAt > now - OTP.windowMin * MIN).length >= OTP.maxRequests)
      return problem(429, 'rate_limited', 'Too many codes requested for this number. Please wait and try again.');

    const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
    const challenge: Challenge = {
      id: uuid(),
      client: body.client!,
      channel: id.type,
      destination: id.value,
      code,
      createdAt: now,
      expiresAt: now + OTP.ttlMin * MIN,
      attempts: 0,
      consumed: false,
    };
    state.challenges.push(challenge);
    state.inbox.push({
      at: new Date(now).toISOString(),
      challengeId: challenge.id,
      channel: id.type,
      to: id.value,
      client: body.client!,
      code,
      text: `${code} is your SportSeek verification code for ${app.name}. It expires in ${OTP.ttlMin} min. Do not share it.`,
    });
    audit('OTP_REQUESTED', null, body.client!, { channel: id.type, to: mask(id) });

    const owner = findOwner(body.client!, id);
    const role = body.role && app.roles.includes(body.role) ? body.role : app.defaultRole;
    const hasRole = !!owner && owner.roles.some((r) => app.roles.includes(r.role));
    const scenario = !owner ? 'register' : hasRole ? 'sign-in' : 'link';
    const message = !owner
      ? `New to SportSeek. Enter the code sent to ${mask(id)} to create your account.`
      : hasRole
        ? `Welcome back. Enter the code sent to ${mask(id)} to sign in.`
        : `This ${id.type === 'phone' ? 'number' : 'email'} already has a SportSeek account. Enter the code sent to ${mask(id)} to prove it's yours, ` +
          `and we'll add ${label(role)} to that same account. No new account is created.`;
    return ok({
      challengeId: challenge.id,
      channel: id.type,
      maskedDestination: mask(id),
      expiresAt: new Date(challenge.expiresAt).toISOString(),
      scenario,
      fromPhase1: !!owner && !holds(owner, id, true),
      message,
    });
  }

  if (method === 'POST' && path === '/connect/token') {
    const f = new URLSearchParams(req.body ?? '');
    const clientId = f.get('client_id') ?? '';
    const app = APPS[clientId];
    if (!app) return tokenError('invalid_client', 'Unknown client.');
    if (app.gated && !state.flags.f3)
      return tokenError('access_denied', 'f3_disabled: Shared Identity is switched off. Use the Phase 1 login.');
    const grant = f.get('grant_type');

    if (grant === 'urn:sportseek:grant-type:otp') {
      const ch = state.challenges.find((c) => c.id === f.get('challenge_id') && c.client === clientId);
      if (!ch || ch.consumed) return tokenError('invalid_grant', 'This code is no longer valid. Request a new one.');
      const lock = (state.lockouts[ch.destination] ??= { failed: 0, windowStart: now, lockedUntil: null });
      if (lock.lockedUntil && lock.lockedUntil > now)
        return tokenError(
          'invalid_grant',
          `Too many incorrect codes for this number. Locked until ${new Date(lock.lockedUntil).toLocaleTimeString()}.`,
        );
      if (ch.expiresAt < now) return tokenError('invalid_grant', 'The code has expired. Request a new one.');
      const id: Ident = { type: ch.channel, value: ch.destination };

      if (f.get('otp') !== ch.code) {
        ch.attempts++;
        if (lock.windowStart < now - OTP.lockoutMin * MIN) {
          lock.windowStart = now;
          lock.failed = 0;
        }
        lock.failed++;
        audit('OTP_FAILED', null, clientId, { to: mask(id), attempt: ch.attempts });
        if (lock.failed >= OTP.maxFailures) {
          lock.lockedUntil = now + OTP.lockoutMin * MIN;
          ch.consumed = true;
          audit('OTP_LOCKOUT', null, clientId, { to: mask(id), until: new Date(lock.lockedUntil).toISOString() });
          return tokenError(
            'invalid_grant',
            `Too many incorrect codes for this number. Locked until ${new Date(lock.lockedUntil).toLocaleTimeString()}.`,
          );
        }
        if (ch.attempts >= OTP.maxAttempts) {
          ch.consumed = true;
          return tokenError('invalid_grant', 'Too many incorrect attempts for this code. Request a new one.');
        }
        const left = Math.min(OTP.maxAttempts - ch.attempts, OTP.maxFailures - lock.failed);
        return tokenError('invalid_grant', `Incorrect code. ${left} attempt(s) left.`);
      }

      ch.consumed = true;
      delete state.lockouts[ch.destination];
      const r = completeOtp(clientId, id, f.get('role') ?? undefined, f.get('name') ?? undefined);
      if (r.outcome === 'Refused') return tokenError('access_denied', 'This account does not have access to the Admin Portal.');
      return ok(issue(r.identity!, clientId, r.outcome, r.roleAdded));
    }

    if (grant === 'password') {
      const id = normalise(f.get('username'));
      const identity = id ? byVerifiedContact(id) : null;
      const locked = identity?.lockedUntil && identity.lockedUntil > now;
      if (!identity || locked || identity.password === null || identity.password !== f.get('password')) {
        if (identity && !locked && ++identity.failedPasswords >= 5) {
          identity.lockedUntil = now + 15 * MIN;
          identity.failedPasswords = 0;
        }
        return tokenError('invalid_grant', 'Phone/email or password is incorrect.');
      }
      identity.failedPasswords = 0;
      if (!identity.roles.some((r) => app.roles.includes(r.role))) {
        audit('PASSWORD_SIGN_IN_REFUSED', identity.id, clientId, { reason: 'No role for this app; linking requires OTP' });
        return tokenError(
          'access_denied',
          'no_role_for_app: Your SportSeek account is not set up for this app yet. Continue with OTP to add it.',
        );
      }
      audit('PASSWORD_SIGN_IN', identity.id, clientId);
      return ok(issue(identity, clientId, 'SignedIn'));
    }

    if (grant === 'refresh_token') {
      const rt = state.refresh[f.get('refresh_token') ?? ''];
      const identity = rt && rt.client === clientId ? state.identities.find((i) => i.id === rt.sub) : undefined;
      if (!identity || !identity.roles.some((r) => app.roles.includes(r.role)))
        return tokenError('invalid_grant', 'The refresh token is no longer valid.');
      delete state.refresh[f.get('refresh_token')!]; // rotation
      return ok(issue(identity, clientId, 'Refreshed'));
    }
    return tokenError('unsupported_grant_type', 'Grant type not supported.');
  }

  if (method === 'POST' && path === '/api/phase1/login') {
    const body = json() as { client?: string; identifier?: string; password?: string };
    const id = normalise(body.identifier);
    const a = id
      ? PHASE1.find(
          (x) =>
            x.app === body.client &&
            body.password === PHASE1_PASSWORD &&
            (normalise(x.mobile)?.value === id.value || normalise(x.email)?.value === id.value),
        )
      : undefined;
    if (!a) return problem(401, 'invalid_credentials', 'Mobile/email or password is incorrect.');
    audit('PHASE1_LOGIN', null, body.client!, { legacyId: a.id });
    return ok({
      mode: 'phase1',
      app: a.app,
      legacyId: a.id,
      name: a.name,
      businessName: a.businessName,
      partnerType: a.partnerType,
      kycStatus: a.kycStatus,
    });
  }

  // ---- signed-in person
  if (path.startsWith('/api/me')) {
    const s = session(req);
    if (!s) return { status: 401 };
    const me = state.identities.find((i) => i.id === s.sub)!;
    if (method === 'GET' && path === '/api/me') return ok(profile(me, s.client));
    if (method === 'PUT' && path === '/api/me/profile') {
      const name = String(json().displayName ?? '').trim();
      if (!name) return problem(400, 'invalid_name', 'Name is required.');
      me.displayName = name;
      audit('PROFILE_UPDATED', me.id, s.client);
      return ok(profile(me, s.client));
    }
    if (method === 'POST' && path === '/api/me/kyc') {
      const b = json() as { docType?: string; docNumber?: string };
      const n = (b.docNumber ?? '').replace(/[^a-z0-9]/gi, '').toUpperCase();
      if (n.length < 6) return problem(400, 'invalid_document', 'Enter a valid document number.');
      if (me.kyc.status === 'Verified') return problem(409, 'kyc_verified', 'KYC is already verified.');
      me.kyc = {
        status: 'Submitted',
        docType: b.docType ?? null,
        docRefMasked: '•'.repeat(n.length - 4) + n.slice(-4),
        submittedVia: s.client,
        submittedAt: new Date().toISOString(),
        verifiedAt: null,
      };
      audit('KYC_SUBMITTED', me.id, s.client, { docType: b.docType ?? null, doc: me.kyc.docRefMasked });
      return ok(profile(me, s.client));
    }
    if (method === 'POST' && path === '/api/me/password') {
      const pw = String(json().newPassword ?? '');
      const err = passwordProblem(pw);
      if (err) return problem(400, 'weak_password', err);
      me.password = pw;
      audit('PASSWORD_SET', me.id, s.client);
      return ok(profile(me, s.client));
    }
  }

  // ---- admin
  if (path.startsWith('/api/admin')) {
    const s = session(req);
    if (!s) return { status: 401 };
    if (s.client !== 'admin-portal' || !s.roles.includes('Admin')) return { status: 403 };

    if (method === 'GET' && path === '/api/admin/identities')
      return ok([...state.identities].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((i) => profile(i, null)));
    const kyc = path.match(/^\/api\/admin\/identities\/([^/]+)\/kyc\/verify$/);
    if (method === 'POST' && kyc) {
      const i = state.identities.find((x) => x.id === kyc[1]);
      if (!i || i.kyc.status !== 'Submitted') return problem(409, 'not_submitted', 'KYC has not been submitted.');
      i.kyc.status = 'Verified';
      i.kyc.verifiedAt = new Date().toISOString();
      audit('KYC_VERIFIED', i.id, 'admin-portal', { by: 'SportSeek Ops Admin' });
      return ok({ status: 'Verified' });
    }
    if (method === 'GET' && path === '/api/admin/audit') {
      const take = Math.min(Math.max(Number(req.query.get('take') ?? 100), 1), 500);
      return ok(
        [...state.audit]
          .reverse()
          .slice(0, take)
          .map((a) => ({ ...a, identityName: state.identities.find((i) => i.id === a.identityId)?.displayName ?? null })),
      );
    }
    if (path === '/api/admin/flags') {
      if (method === 'PUT') {
        const b = json() as { sharedIdentityEnabled?: boolean; minAppVersion?: string };
        if (typeof b.sharedIdentityEnabled === 'boolean') {
          state.flags.f3 = b.sharedIdentityEnabled;
          audit('FLAG_CHANGED', null, 'admin-portal', { flag: 'f3.shared_identity', enabled: b.sharedIdentityEnabled });
        }
        if (b.minAppVersion !== undefined) {
          if (!/^\d+\.\d+(\.\d+)?$/.test(b.minAppVersion)) return problem(400, 'invalid_version', 'Use a version like 1.2.0.');
          state.flags.minAppVersion = b.minAppVersion;
          audit('FLAG_CHANGED', null, 'admin-portal', { flag: 'app.min_version', value: b.minAppVersion });
        }
      }
      return ok({ sharedIdentityEnabled: state.flags.f3, minAppVersion: state.flags.minAppVersion });
    }
    if (method === 'GET' && path === '/api/admin/phase1')
      return ok(
        PHASE1.map((a) => ({
          ...a,
          createdAt: new Date(a.createdAt).toISOString(),
          identityId: state.legacyMap.find((m) => m.app === a.app && m.legacyId === a.id)?.identityId ?? null,
        })),
      );
    if (method === 'POST' && path === '/api/admin/bootstrap') return ok(bootstrap());
    if (method === 'GET' && path === '/api/admin/duplicates') return ok(duplicates());
    if (method === 'POST' && path === '/api/admin/reset-demo') {
      state = fresh();
      audit('DEMO_RESET', null, 'admin-portal');
      return ok({ reset: true });
    }
  }

  return problem(404, 'not_found', `No route for ${method} ${path}`);
}

/** Drop-in replacement for fetch() against the Identity API. */
export async function mockFetch(url: string, init: RequestInit = {}): Promise<Response> {
  await new Promise((r) => setTimeout(r, 120)); // feel like a network call
  const u = new URL(url, 'http://prototype.local');
  const req: Req = {
    method: (init.method ?? 'GET').toUpperCase(),
    path: u.pathname,
    query: u.searchParams,
    headers: (init.headers as Record<string, string>) ?? {},
    body: typeof init.body === 'string' ? init.body : undefined,
  };
  let res: Res;
  try {
    res = route(req);
  } catch (e) {
    res = problem(500, 'server_error', String(e));
  }
  if (req.method !== 'GET') save();
  return new Response(res.body === undefined ? '' : JSON.stringify(res.body), {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
