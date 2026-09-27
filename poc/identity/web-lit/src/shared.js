import { css, html, svg } from 'lit';

export const APPS = {
  user: { name: 'SportSeek', label: 'User App', tagline: 'Book · Play · Compete', client: 'user-app' },
  partner: { name: 'SportSeek Partner', label: 'Partner App', tagline: 'Facilities · Coaching · Wellness', client: 'partner-app' },
  admin: { name: 'SportSeek Admin', label: 'Admin Portal', tagline: 'Identity operations', client: 'admin-portal' },
};

export const APP_LABEL = {
  'user-app': 'User App',
  'partner-app': 'Partner App',
  'admin-portal': 'Admin Portal',
  bootstrap: 'Phase 1 bootstrap',
  seed: 'Seed',
};

export const ROLE_LABEL = {
  Player: 'Player',
  EventOrganiser: 'Event Organiser',
  FacilityPartner: 'Facility Partner',
  Coach: 'Coach',
  Physio: 'Physio',
  Nutritionist: 'Nutritionist',
  Admin: 'Admin',
};

/** Which app a role belongs to: drives the colour of every role chip. */
export const ROLE_APP = {
  Player: 'user',
  EventOrganiser: 'user',
  FacilityPartner: 'partner',
  Coach: 'partner',
  Physio: 'partner',
  Nutritionist: 'partner',
  Admin: 'admin',
};

export const CLIENT_VARIANT = { 'user-app': 'user', 'partner-app': 'partner', 'admin-portal': 'admin' };

export const time = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
export const date = (iso) => new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });

/** App marks: a ball for players, a court for partners, a shield for admin. */
export function mark(variant, size = 22) {
  const body = {
    user: svg`<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5 9.5c3.5 1.2 10.5 1.2 14 0M5 14.5c3.5-1.2 10.5-1.2 14 0" fill="none" stroke="currentColor" stroke-width="1.6"/>`,
    partner: svg`<rect x="3.5" y="5" width="17" height="14" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 5v14M3.5 12h17M7.5 5v14M16.5 5v14" fill="none" stroke="currentColor" stroke-width="1.2"/>`,
    admin: svg`<path d="M12 3.5 19 6v5.5c0 4.3-2.9 7.6-7 9-4.1-1.4-7-4.7-7-9V6z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m8.8 12 2.2 2.2 4.3-4.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  }[variant];
  return html`<svg width=${size} height=${size} viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
}

/** Design tokens and the shared component styles. Custom properties inherit into every shadow root. */
export const base = css`
  :host {
    --text: #101828;
    --muted: #5A6478;
    --faint: #8A93A6;
    --paper: #F5F6F9;
    --card: #FFFFFF;
    --border: #E3E6ED;
    --ok: #0A7A4E;
    --ok-bg: #E4F5EC;
    --warn: #8F5200;
    --warn-bg: #FFF3D9;
    --danger: #B42318;
    --danger-bg: #FDECEA;
    --info: #2447C9;
    --info-bg: #E9EEFF;
    --user: #0E8A5A;
    --user-deep: #075E3D;
    --user-tint: #E2F4EB;
    --partner: #C8512B;
    --partner-deep: #8E3317;
    --partner-tint: #FCEBE3;
    --admin: #3346C2;
    --admin-deep: #1F2C86;
    --admin-tint: #E8EBFB;
    --display: 'Archivo', 'Arial Narrow', system-ui, sans-serif;
    --body: 'Figtree', system-ui, -apple-system, 'Segoe UI', sans-serif;
    --mono: 'JetBrains Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace;
    font-family: var(--body);
    color: var(--text);
  }
  * {
    box-sizing: border-box;
  }
  h1,
  h2,
  h3 {
    font-family: var(--display);
    font-stretch: 112%;
    margin: 0;
    text-wrap: balance;
    letter-spacing: -0.01em;
  }
  h1 {
    font-size: 24px;
    font-weight: 800;
    line-height: 1.15;
  }
  h2 {
    font-size: 17px;
    font-weight: 750;
  }
  p {
    margin: 0;
  }
  .muted {
    color: var(--muted);
    font-size: 13.5px;
    line-height: 1.45;
  }
  .eyebrow {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--faint);
  }
  .mono {
    font-family: var(--mono);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }
  .stack {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .between {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 16px;
  }
  .card > .eyebrow {
    display: block;
    margin-bottom: 10px;
  }
  button {
    font: inherit;
    cursor: pointer;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    border: 0;
    border-radius: 12px;
    padding: 13px 18px;
    font-weight: 700;
    font-size: 15px;
    background: var(--brand);
    color: #fff;
    box-shadow: 0 1px 0 rgb(255 255 255 / 0.18) inset, 0 6px 16px -8px var(--brand);
    transition: transform 0.12s ease, filter 0.12s ease, box-shadow 0.12s ease;
  }
  .btn:hover:not(:disabled) {
    filter: brightness(1.06);
    transform: translateY(-1px);
  }
  .btn:active:not(:disabled) {
    transform: translateY(0);
  }
  .btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    box-shadow: none;
  }
  .btn.ghost {
    background: transparent;
    color: var(--brand-deep);
    border: 1px solid var(--border);
    box-shadow: none;
  }
  .btn.soft {
    background: var(--brand-tint);
    color: var(--brand-deep);
    box-shadow: none;
  }
  .btn.danger {
    background: var(--danger);
    box-shadow: none;
  }
  .btn.sm {
    width: auto;
    padding: 7px 12px;
    font-size: 13px;
    border-radius: 9px;
  }
  .btn:focus-visible,
  .chip:focus-visible,
  input:focus-visible,
  .tab:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--brand) 40%, transparent);
    outline-offset: 2px;
  }
  label.field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
    font-weight: 650;
  }
  input {
    font: inherit;
    font-size: 16px;
    color: var(--text);
    background: #FAFBFC;
    border: 1px solid var(--border);
    border-radius: 11px;
    padding: 12px 13px;
    width: 100%;
  }
  input::placeholder {
    color: #A3AAB8;
  }
  input:focus {
    border-color: var(--brand);
    background: #fff;
    outline: none;
  }
  .hint {
    font-size: 12px;
    color: var(--faint);
    font-weight: 500;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border-radius: 999px;
    padding: 6px 12px;
    font-size: 13px;
    font-weight: 650;
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--text);
  }
  .chip.on {
    background: var(--brand);
    border-color: var(--brand);
    color: #fff;
  }
  .chip.user {
    background: var(--user);
    border-color: var(--user);
    color: #fff;
  }
  .chip.partner {
    background: var(--partner);
    border-color: var(--partner);
    color: #fff;
  }
  .chip.admin {
    background: var(--admin);
    border-color: var(--admin);
    color: #fff;
  }
  .chip small {
    font-weight: 500;
    opacity: 0.85;
  }
  .badge {
    display: inline-block;
    border-radius: 6px;
    padding: 3px 8px;
    font-size: 11.5px;
    font-weight: 700;
    white-space: nowrap;
  }
  .badge.ok {
    background: var(--ok-bg);
    color: var(--ok);
  }
  .badge.warn {
    background: var(--warn-bg);
    color: var(--warn);
  }
  .badge.danger {
    background: var(--danger-bg);
    color: var(--danger);
  }
  .badge.info {
    background: var(--info-bg);
    color: var(--info);
  }
  .badge.muted {
    background: #EEF0F4;
    color: var(--muted);
  }
  .notice {
    border-radius: 14px;
    padding: 13px 14px;
    font-size: 14px;
    line-height: 1.45;
    border: 1px solid transparent;
  }
  .notice b {
    display: block;
    margin-bottom: 2px;
  }
  .notice.ok {
    background: var(--ok-bg);
    border-color: color-mix(in srgb, var(--ok) 20%, transparent);
  }
  .notice.ok b {
    color: var(--ok);
  }
  .notice.warn {
    background: var(--warn-bg);
    border-color: color-mix(in srgb, var(--warn) 20%, transparent);
  }
  .notice.warn b {
    color: var(--warn);
  }
  .notice.danger {
    background: var(--danger-bg);
    border-color: color-mix(in srgb, var(--danger) 20%, transparent);
    color: var(--danger);
  }
  .notice.info {
    background: var(--info-bg);
    border-color: color-mix(in srgb, var(--info) 20%, transparent);
  }
  .notice.info b {
    color: var(--info);
  }
  .kv {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    border-top: 1px solid var(--border);
    font-size: 14px;
  }
  .kv:first-of-type {
    border-top: 0;
  }
  .kv > span:first-child {
    color: var(--muted);
  }
  .kv > :last-child {
    font-weight: 650;
    text-align: right;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .segmented {
    display: flex;
    background: #EDEFF3;
    border-radius: 11px;
    padding: 3px;
  }
  .segmented button {
    flex: 1;
    border: 0;
    background: transparent;
    padding: 8px;
    border-radius: 9px;
    font-weight: 700;
    color: var(--muted);
    font-size: 14px;
  }
  .segmented button[aria-pressed='true'] {
    background: var(--card);
    color: var(--brand-deep);
    box-shadow: 0 1px 3px rgb(16 24 40 / 0.12);
  }
  @keyframes rise {
    from {
      opacity: 0.55;
      transform: translateY(6px);
    }
  }
  .rise {
    animation: rise 0.28s ease both;
  }
  @keyframes drop {
    from {
      opacity: 0;
      transform: translateY(-14px) scale(0.98);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .rise,
    .btn {
      animation: none;
      transition: none;
    }
  }
`;
