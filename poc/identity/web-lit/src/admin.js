import { LitElement, css, html, nothing } from 'lit';
import { ApiError } from './api.js';
import { APP_LABEL, CLIENT_VARIANT, ROLE_APP, ROLE_LABEL, base, time } from './shared.js';

const ACTION_TONE = {
  IDENTITY_CREATED: 'ok',
  ROLE_LINKED: 'warn',
  LEGACY_IDENTITY_CLAIMED: 'info',
  KYC_SUBMITTED: 'warn',
  KYC_VERIFIED: 'ok',
  OTP_FAILED: 'danger',
  OTP_LOCKOUT: 'danger',
  PASSWORD_SIGN_IN_REFUSED: 'danger',
  FLAG_CHANGED: 'info',
  BOOTSTRAP_RUN: 'info',
  DEMO_RESET: 'info',
};

const TABS = [
  ['identities', 'Identities'],
  ['audit', 'Audit log'],
  ['phase1', 'Phase 1 & bootstrap'],
  ['switch', 'Remote switch'],
];

/** Identity operations: who holds which roles, every linking decision, the bootstrap, the F3 switch. */
export class SsAdmin extends LitElement {
  static properties = {
    api: { attribute: false },
    tokens: { attribute: false },
    _tab: { state: true },
    _identities: { state: true },
    _audit: { state: true },
    _dupes: { state: true },
    _phase1: { state: true },
    _report: { state: true },
    _flags: { state: true },
    _minVersion: { state: true },
    _saved: { state: true },
    _confirmReset: { state: true },
    _hideOtp: { state: true },
    _busy: { state: true },
    _error: { state: true },
  };

  static styles = [
    base,
    css`
      :host {
        display: block;
      }
      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 10px;
      }
      .stat {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 12px 14px;
      }
      .stat .n {
        font-family: var(--display);
        font-stretch: 118%;
        font-size: 30px;
        font-weight: 800;
        line-height: 1.05;
        font-variant-numeric: tabular-nums;
      }
      .stat .l {
        font-size: 12.5px;
        color: var(--muted);
        margin-top: 2px;
      }
      .tabs {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
        border-bottom: 1px solid var(--border);
      }
      .tab {
        border: 0;
        background: none;
        padding: 10px 12px;
        font-weight: 700;
        font-size: 14px;
        color: var(--muted);
        border-bottom: 2.5px solid transparent;
        margin-bottom: -1px;
      }
      .tab[aria-selected='true'] {
        color: var(--brand-deep);
        border-bottom-color: var(--brand);
      }
      .person {
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
        gap: 14px;
        align-items: start;
      }
      @media (max-width: 640px) {
        .person {
          grid-template-columns: 1fr;
        }
      }
      .person h3 {
        font-size: 16px;
      }
      .contact {
        font-size: 13px;
        font-variant-numeric: tabular-nums;
      }
      .contact.off {
        color: var(--faint);
      }
      .timeline {
        position: relative;
        padding-left: 18px;
      }
      .timeline::before {
        content: '';
        position: absolute;
        left: 5px;
        top: 6px;
        bottom: 6px;
        width: 2px;
        background: var(--border);
      }
      .event {
        position: relative;
        padding: 8px 0 12px;
      }
      .event::before {
        content: '';
        position: absolute;
        left: -18px;
        top: 12px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--card);
        border: 3px solid var(--dot, var(--faint));
      }
      .event.ok {
        --dot: var(--ok);
      }
      .event.warn {
        --dot: #D08A00;
      }
      .event.danger {
        --dot: var(--danger);
      }
      .event.info {
        --dot: var(--info);
      }
      .detail {
        font-size: 12.5px;
        color: var(--muted);
        margin-top: 3px;
        line-height: 1.45;
      }
      .app-tag {
        font-size: 12px;
        font-weight: 750;
      }
      .app-tag.user {
        color: var(--user);
      }
      .app-tag.partner {
        color: var(--partner);
      }
      .app-tag.admin {
        color: var(--admin);
      }
      .scroll {
        overflow-x: auto;
      }
      table {
        border-collapse: collapse;
        width: 100%;
        min-width: 620px;
        font-size: 13px;
      }
      th {
        text-align: left;
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--faint);
        padding: 6px 8px;
      }
      td {
        padding: 8px;
        border-top: 1px solid var(--border);
        vertical-align: middle;
      }
      .dupe {
        padding: 10px 0;
        border-top: 1px solid var(--border);
      }
      .dupe:first-of-type {
        border-top: 0;
      }
      .dupe .v {
        font-family: var(--mono);
        font-weight: 700;
        color: var(--danger);
        font-size: 13px;
      }
      .toggle {
        position: relative;
        flex: none;
        width: 52px;
        height: 30px;
        border-radius: 999px;
        border: 0;
        background: #CBD2DD;
        transition: background 0.15s ease;
      }
      .toggle::after {
        content: '';
        position: absolute;
        top: 3px;
        left: 3px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 1px 3px rgb(0 0 0 / 0.25);
        transition: transform 0.15s ease;
      }
      .toggle[aria-checked='true'] {
        background: var(--ok);
      }
      .toggle[aria-checked='true']::after {
        transform: translateX(22px);
      }
      .switch-state {
        font-family: var(--display);
        font-stretch: 115%;
        font-weight: 800;
        font-size: 18px;
      }
      .mini {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12.5px;
        color: var(--muted);
      }
      .mini input {
        width: auto;
      }
    `,
  ];

  constructor() {
    super();
    this._tab = 'identities';
    this._identities = [];
    this._audit = [];
    this._dupes = [];
    this._phase1 = [];
    this._report = null;
    this._flags = null;
    this._minVersion = '';
    this._saved = null;
    this._confirmReset = false;
    this._hideOtp = true;
    this._busy = null;
    this._error = null;
  }

  get _t() {
    return this.tokens.access_token;
  }

  connectedCallback() {
    super.connectedCallback();
    this._refresh();
    this._loadFlags();
    this._poll = setInterval(() => this._refresh(), 2000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this._poll);
  }

  async _refresh() {
    try {
      const [i, a, d, p] = await Promise.all([
        this.api.admin.identities(this._t),
        this.api.admin.audit(this._t),
        this.api.admin.duplicates(this._t),
        this.api.admin.phase1(this._t),
      ]);
      Object.assign(this, { _identities: i, _audit: a, _dupes: d, _phase1: p, _error: null });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) this._signOut();
      else this._error = e.message;
    }
  }

  async _loadFlags() {
    try {
      this._flags = await this.api.admin.flags(this._t);
      this._minVersion = this._flags.minAppVersion;
    } catch {
      // shown by _refresh
    }
  }

  async _setFlags(body) {
    this._flags = await this.api.admin.setFlags(this._t, body);
    this._minVersion = this._flags.minAppVersion;
    this._saved = `Saved at ${new Date().toLocaleTimeString()}. The apps pick it up within a few seconds.`;
  }

  _signOut() {
    this.dispatchEvent(new CustomEvent('sign-out', { bubbles: true, composed: true }));
  }

  _identitiesView() {
    if (!this._identities.length) return html`<p class="muted">No identities yet.</p>`;
    return this._identities.map(
      (i) => html`<div class="card person rise">
        <div>
          <div class="row">
            <h3>${i.displayName}</h3>
            ${i.source !== 'native'
              ? html`<span class="badge muted">${i.source === 'legacy-partner-app' ? 'Phase 1 · Partner' : 'Phase 1 · User'}</span>`
              : nothing}
          </div>
          <div class="mono" style="color:var(--faint);margin:2px 0 6px">${i.identityId}</div>
          ${i.contacts.map((c) => html`<div class="contact ${c.verified ? '' : 'off'}">${c.verified ? '✓' : '○'} ${c.value}</div>`)}
        </div>
        <div class="stack" style="gap:10px">
          <div class="row">
            ${i.roles.map(
              (r) => html`<span class="chip ${ROLE_APP[r.role]}">${ROLE_LABEL[r.role]} <small>· ${APP_LABEL[r.grantedVia] ?? r.grantedVia}</small></span>`,
            )}
          </div>
          <div class="row">
            <span class="muted">KYC</span>
            <span class="badge ${i.kyc.status === 'Verified' ? 'ok' : i.kyc.status === 'Submitted' ? 'warn' : 'muted'}"
              >${i.kyc.status === 'NotStarted' ? 'Not started' : i.kyc.status}</span
            >
            ${i.kyc.docType ? html`<span class="muted">${i.kyc.docType} ${i.kyc.docRefMasked ?? ''}</span>` : nothing}
            ${i.kyc.status === 'Submitted'
              ? html`<button class="btn sm" @click=${() => this.api.admin.verifyKyc(this._t, i.identityId).then(() => this._refresh())}>
                  Verify KYC
                </button>`
              : nothing}
          </div>
        </div>
      </div>`,
    );
  }

  _auditView() {
    const rows = this._hideOtp ? this._audit.filter((a) => a.action !== 'OTP_REQUESTED' && a.action !== 'SIGNED_IN') : this._audit;
    return html`<div class="card">
      <div class="between" style="margin-bottom:10px">
        <span class="eyebrow">Every identity and linking decision</span>
        <label class="mini"
          ><input type="checkbox" id="hide-otp" .checked=${this._hideOtp} @change=${(e) => (this._hideOtp = e.target.checked)} /> Key
          decisions only</label
        >
      </div>
      ${rows.length
        ? html`<div class="timeline">
            ${rows.map((a) => {
              const v = CLIENT_VARIANT[a.client];
              return html`<div class="event ${ACTION_TONE[a.action] ?? ''}">
                <div class="row">
                  <span class="mono" style="color:var(--faint)">${time(a.at)}</span>
                  <span class="badge ${ACTION_TONE[a.action] ?? 'muted'}">${a.action}</span>
                  ${a.client ? html`<span class="app-tag ${v ?? ''}">${APP_LABEL[a.client] ?? a.client}</span>` : nothing}
                  ${a.identityName ? html`<b style="font-size:13.5px">${a.identityName}</b>` : nothing}
                </div>
                ${a.detail
                  ? html`<div class="detail">
                      ${Object.entries(a.detail)
                        .map(([k, val]) => `${k}: ${Array.isArray(val) ? val.join(', ') || '—' : String(val)}`)
                        .join('  ·  ')}
                    </div>`
                  : nothing}
              </div>`;
            })}
          </div>`
        : html`<p class="muted">Nothing yet.</p>`}
    </div>`;
  }

  _phase1View() {
    const r = this._report;
    return html`<div class="stack">
      <div class="card stack" style="gap:12px">
        <span class="eyebrow" style="margin:0">Launch-day bootstrap</span>
        <h2>Load every Phase 1 account, one identity each</h2>
        <p class="muted">
          Contacts stay unverified until the person proves ownership by OTP. Duplicates are reported, not merged: merging needs
          SportSeek-approved rules, in R2.
        </p>
        ${r
          ? html`<div class="notice ok">
              <b>Bootstrap complete</b>${r.identitiesCreated} identities created from ${r.phase1UserApp} User App and ${r.phase1PartnerApp} Partner
              App accounts${r.alreadyMapped ? ` (${r.alreadyMapped} already loaded)` : ''}. ${r.duplicateCandidates.length} duplicate candidate
              group(s).
            </div>`
          : nothing}
        <button
          class="btn"
          ?disabled=${this._busy === 'boot'}
          @click=${async () => {
            this._busy = 'boot';
            try {
              this._report = await this.api.admin.bootstrap(this._t);
              await this._refresh();
            } finally {
              this._busy = null;
            }
          }}
        >
          ${this._busy === 'boot' ? 'Loading accounts…' : 'Run bootstrap'}
        </button>
      </div>

      <div class="card">
        <span class="eyebrow">Duplicate candidates for the R2 merge (${this._dupes.length})</span>
        ${this._dupes.length
          ? this._dupes.map(
              (g) => html`<div class="dupe">
                <div class="v">${g.value}</div>
                ${g.identities.map(
                  (m) => html`<div class="muted">${m.verified ? '✓' : '○'} ${m.displayName} · ${m.roles.map((x) => ROLE_LABEL[x]).join(', ')} · ${m.source}</div>`,
                )}
              </div>`,
            )
          : html`<p class="muted">None yet. Run the bootstrap.</p>`}
      </div>

      <div class="card">
        <span class="eyebrow">Phase 1 tables · schema legacy, read-only</span>
        <div class="scroll">
          <table>
            <thead>
              <tr>
                <th>App</th>
                <th>Account</th>
                <th>Mobile as stored</th>
                <th>Email</th>
                <th>Identity</th>
              </tr>
            </thead>
            <tbody>
              ${this._phase1.map(
                (a) => html`<tr>
                  <td><span class="app-tag ${CLIENT_VARIANT[a.app]}">${APP_LABEL[a.app]} #${a.id}</span></td>
                  <td>${a.businessName ?? a.name}</td>
                  <td class="mono">${a.mobile}</td>
                  <td class="mono">${a.email ?? '—'}</td>
                  <td><span class="badge ${a.identityId ? 'ok' : 'muted'}">${a.identityId ? 'Loaded' : 'Not loaded'}</span></td>
                </tr>`,
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  }

  _switchView() {
    const f = this._flags;
    return html`<div class="stack">
      <div class="card between" style="align-items:flex-start">
        <div style="flex:1">
          <span class="eyebrow">F3 Shared Identity · remote switch</span>
          <div class="switch-state" style="margin:6px 0 4px;color:${f?.sharedIdentityEnabled ? 'var(--ok)' : 'var(--warn)'}">
            ${f ? (f.sharedIdentityEnabled ? 'On: Shared Identity' : 'Off: Phase 1 login') : '…'}
          </div>
          <p class="muted">Off sends the User and Partner apps back to the Phase 1 login. Identity data is additive, so switching back on loses nothing.</p>
        </div>
        ${f
          ? html`<button
              class="toggle"
              role="switch"
              aria-label="Shared Identity"
              aria-checked=${f.sharedIdentityEnabled}
              @click=${() => this._setFlags({ sharedIdentityEnabled: !f.sharedIdentityEnabled })}
            ></button>`
          : nothing}
      </div>
      <div class="card stack" style="gap:12px">
        <span class="eyebrow" style="margin:0">Minimum app version</span>
        <p class="muted">The demo apps are version 1.0.0. Set 1.1.0 to see them ask for an update.</p>
        <label class="field"
          >Minimum version <input id="min-version" .value=${this._minVersion} @input=${(e) => (this._minVersion = e.target.value)}
        /></label>
        <div class="row">
          <button class="btn sm" @click=${() => this._setFlags({ minAppVersion: this._minVersion })}>Save</button>
          <button class="btn ghost sm" @click=${() => this._setFlags({ minAppVersion: '1.0.0' })}>Reset to 1.0.0</button>
        </div>
      </div>
      ${this._saved ? html`<div class="notice ok">${this._saved}</div>` : nothing}
      <div class="card stack" style="gap:12px">
        <span class="eyebrow" style="margin:0">Demo data</span>
        <p class="muted">Reset clears every identity except the admin and restores the Phase 1 data, for a fresh run.</p>
        <div class="row">
          ${this._confirmReset
            ? html`<button class="btn danger sm" @click=${() => this.api.admin.resetDemo(this._t).then(() => this._signOut())}>Yes, reset demo data</button>
                <button class="btn ghost sm" @click=${() => (this._confirmReset = false)}>Cancel</button>`
            : html`<button class="btn ghost sm" @click=${() => (this._confirmReset = true)}>Reset demo data…</button>`}
        </div>
      </div>
    </div>`;
  }

  render() {
    const ids = this._identities;
    const linked = ids.filter((i) => new Set(i.roles.map((r) => ROLE_APP[r.role])).size > 1).length;
    return html`<div class="stack">
      <div class="between">
        <div>
          <span class="eyebrow">SportSeek · Identity operations</span>
          <h1 style="margin-top:4px">One person, one identity</h1>
        </div>
        <button class="btn ghost sm" @click=${() => this._signOut()}>Sign out</button>
      </div>
      <div class="stats">
        <div class="stat"><div class="n">${ids.length}</div><div class="l">Identities</div></div>
        <div class="stat"><div class="n" style="color:var(--partner)">${linked}</div><div class="l">Linked across apps</div></div>
        <div class="stat">
          <div class="n" style="color:${this._dupes.length ? 'var(--danger)' : 'inherit'}">${this._dupes.length}</div>
          <div class="l">Duplicate candidates (R2)</div>
        </div>
        <div class="stat">
          <div class="n">${ids.filter((i) => i.kyc.status === 'Submitted').length}</div>
          <div class="l">KYC awaiting review</div>
        </div>
      </div>
      <div class="tabs" role="tablist">
        ${TABS.map(
          ([k, l]) => html`<button class="tab" role="tab" aria-selected=${this._tab === k} @click=${() => (this._tab = k)}>${l}</button>`,
        )}
      </div>
      ${this._error ? html`<div class="notice danger">${this._error}</div>` : nothing}
      ${this._tab === 'identities' ? this._identitiesView() : nothing} ${this._tab === 'audit' ? this._auditView() : nothing}
      ${this._tab === 'phase1' ? this._phase1View() : nothing} ${this._tab === 'switch' ? this._switchView() : nothing}
    </div>`;
  }
}
customElements.define('ss-admin', SsAdmin);
