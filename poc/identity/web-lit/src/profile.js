import { LitElement, css, html, nothing } from 'lit';
import { ApiError, decodeJwt } from './api.js';
import { APPS, APP_LABEL, ROLE_APP, ROLE_LABEL, base, date, mark } from './shared.js';

const OUTCOME = {
  Created: ['ok', 'Welcome to SportSeek', (r) => `Your account was created with the ${r} role.`],
  Linked: [
    'warn',
    'Linked to your existing SportSeek account',
    (r) => `We found your account and added ${r} to it. No new account was created: your profile and KYC are shared.`,
  ],
  ClaimedLegacy: [
    'info',
    'Your existing account is connected',
    () => 'You proved you own this number, so your Phase 1 account now signs in with Shared Identity.',
  ],
};

const KYC_TONE = { NotStarted: 'muted', Submitted: 'warn', Verified: 'ok', Rejected: 'danger' };

/** The signed-in person: one identity, the roles it holds in each app, KYC, password and token. */
export class SsProfile extends LitElement {
  static properties = {
    api: { attribute: false },
    tokens: { attribute: false },
    variant: {},
    _me: { state: true },
    _error: { state: true },
    _showToken: { state: true },
    _docType: { state: true },
    _docNumber: { state: true },
    _pw: { state: true },
    _pwDone: { state: true },
    _busy: { state: true },
  };

  static styles = [
    base,
    css`
      :host {
        display: block;
      }
      .hero {
        position: relative;
        overflow: hidden;
        border-radius: 20px;
        padding: 18px;
        color: #fff;
        background: radial-gradient(120% 140% at 100% 0%, rgb(255 255 255 / 0.18), transparent 55%),
          linear-gradient(150deg, var(--brand), var(--brand-deep));
      }
      .hero::after {
        content: '';
        position: absolute;
        right: -30px;
        bottom: -46px;
        width: 150px;
        height: 150px;
        border-radius: 50%;
        border: 18px solid rgb(255 255 255 / 0.08);
      }
      .hero h1 {
        font-size: 26px;
        color: #fff;
      }
      .hero .sub {
        color: rgb(255 255 255 / 0.82);
        font-size: 13.5px;
        margin-top: 3px;
      }
      .avatar {
        flex: none;
        width: 52px;
        height: 52px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        font-family: var(--display);
        font-stretch: 120%;
        font-size: 22px;
        font-weight: 800;
        background: rgb(255 255 255 / 0.18);
        border: 2px solid rgb(255 255 255 / 0.5);
      }
      .idpill {
        display: inline-flex;
        gap: 6px;
        align-items: center;
        margin-top: 14px;
        padding: 6px 10px;
        border-radius: 999px;
        background: rgb(0 0 0 / 0.18);
        font-family: var(--mono);
        font-size: 12px;
      }
      /* One identity, two apps */
      .graph {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: 0;
        margin-top: 4px;
      }
      .node {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        text-align: center;
        font-size: 12px;
        font-weight: 700;
      }
      .node .disc {
        width: 46px;
        height: 46px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        border: 2px dashed var(--border);
        color: var(--faint);
        background: #FAFBFC;
      }
      .node.on .disc {
        border-style: solid;
        color: #fff;
      }
      .node.user.on .disc {
        background: var(--user);
        border-color: var(--user);
      }
      .node.partner.on .disc {
        background: var(--partner);
        border-color: var(--partner);
      }
      .node .state {
        font-weight: 600;
        color: var(--faint);
        font-size: 11px;
      }
      .node.here .state {
        color: var(--brand-deep);
      }
      .centre {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        width: 150px;
        margin-top: -22px;
      }
      .wire {
        height: 2px;
        background: repeating-linear-gradient(90deg, var(--border) 0 5px, transparent 5px 9px);
      }
      .wire.on {
        background: var(--text);
      }
      .core {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: var(--text);
        color: #fff;
        font-family: var(--display);
        font-stretch: 120%;
        font-weight: 800;
        font-size: 11px;
        box-shadow: 0 0 0 5px #fff, 0 0 0 6px var(--border);
      }
      .claims .kv > :last-child {
        font-family: var(--mono);
        font-size: 12px;
        font-weight: 600;
      }
      .linkbtn {
        border: 0;
        background: none;
        color: var(--brand);
        font-weight: 700;
        padding: 0;
      }
    `,
  ];

  constructor() {
    super();
    this._me = null;
    this._error = null;
    this._showToken = false;
    this._docType = 'PAN';
    this._docNumber = '';
    this._pw = '';
    this._pwDone = false;
    this._busy = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._load();
    this._poll = setInterval(() => this._load(), 3000); // picks up the admin's KYC decision live
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this._poll);
  }

  updated(changed) {
    if (changed.has('tokens') && changed.get('tokens')) this._load();
  }

  async _load() {
    try {
      this._me = await this.api.me(this.tokens.access_token);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) this._emit('sign-out');
      else this._error = e.message;
    }
  }

  _emit(name, detail) {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  async _act(key, fn) {
    this._busy = key;
    this._error = null;
    try {
      await fn();
    } catch (e) {
      this._error = e instanceof ApiError ? e.message : String(e);
    } finally {
      this._busy = null;
    }
  }

  _graph(me) {
    const has = (v) => me.roles.some((r) => ROLE_APP[r.role] === v);
    const node = (v) => {
      const on = has(v);
      const here = v === this.variant;
      return html`<div class="node ${v} ${on ? 'on' : ''} ${here ? 'here' : ''}">
        <div class="disc">${mark(v, 22)}</div>
        ${APPS[v].label}
        <span class="state">${here ? 'You are here' : on ? 'Linked' : 'Not linked'}</span>
      </div>`;
    };
    return html`<div class="graph" aria-label="Apps linked to this SportSeek ID">
      ${node('user')}
      <div class="centre">
        <span class="wire ${has('user') ? 'on' : ''}"></span>
        <span class="core">ID</span>
        <span class="wire ${has('partner') ? 'on' : ''}"></span>
      </div>
      ${node('partner')}
    </div>`;
  }

  render() {
    const me = this._me;
    if (!me)
      return html`<div class="card">${this._error ? html`<div class="notice danger">${this._error}</div>` : html`<p class="muted">Loading your profile…</p>`}</div>`;

    const claims = decodeJwt(this.tokens.access_token);
    const outcome = OUTCOME[claims.link_outcome];
    const here = me.roles.filter((r) => r.inThisApp);
    const elsewhere = me.roles.filter((r) => !r.inThisApp);
    const roleForBanner = ROLE_LABEL[claims.role_added] ?? ROLE_LABEL[here[0]?.role] ?? '';
    const kyc = me.kyc;

    return html`<div class="stack">
      ${outcome ? html`<div class="notice ${outcome[0]} rise"><b>${outcome[1]}</b>${outcome[2](roleForBanner)}</div>` : nothing}
      ${this._error ? html`<div class="notice danger" role="alert">${this._error}</div>` : nothing}

      <section class="hero rise">
        <div class="between" style="align-items:flex-start">
          <div>
            <h1>Hi, ${me.displayName.split(' ')[0]}</h1>
            <p class="sub">Signed in to the ${APP_LABEL[this.api.clientId]}</p>
          </div>
          <div class="avatar">${me.displayName.slice(0, 1).toUpperCase()}</div>
        </div>
        <span class="idpill">SportSeek ID · ${me.identityId.slice(0, 8)}…${me.identityId.slice(-4)}</span>
      </section>

      <section class="card">
        <span class="eyebrow">One ID across apps</span>
        ${this._graph(me)}
      </section>

      <section class="card">
        <span class="eyebrow">Your roles</span>
        <div class="row">${here.map((r) => html`<span class="chip ${ROLE_APP[r.role]}">${ROLE_LABEL[r.role]}</span>`)}</div>
        ${elsewhere.length
          ? html`<p class="muted" style="margin:12px 0 8px">Also on your account, for use in the other app:</p>
              <div class="row">
                ${elsewhere.map(
                  (r) => html`<span class="chip ${ROLE_APP[r.role]}">${ROLE_LABEL[r.role]} <small>· ${APP_LABEL[r.app] ?? ''}</small></span>`,
                )}
              </div>`
          : nothing}
      </section>

      <section class="card">
        <div class="between"><span class="eyebrow">Contact details</span><span class="badge info">Shared across apps</span></div>
        <div style="margin-top:6px">
          ${me.contacts.map(
            (c) => html`<div class="kv">
              <span>${c.type === 'phone' ? 'Mobile' : 'Email'}</span>
              <span class="row" style="justify-content:flex-end"
                >${c.value} <span class="badge ${c.verified ? 'ok' : 'muted'}">${c.verified ? 'Verified' : 'Unverified'}</span></span
              >
            </div>`,
          )}
          <div class="kv"><span>Member since</span><span>${date(me.createdAt)}</span></div>
          <div class="kv"><span>Created from</span><span>${APP_LABEL[me.createdVia] ?? me.createdVia}</span></div>
        </div>
      </section>

      <section class="card stack" style="gap:12px">
        <div class="between">
          <span class="eyebrow" style="margin:0">KYC verification</span>
          <span class="badge ${KYC_TONE[kyc.status]}">${kyc.status === 'NotStarted' ? 'Not started' : kyc.status}</span>
        </div>
        <p class="muted">Verify once, and it's reused by every role and app on your account.</p>
        ${kyc.status === 'NotStarted' || kyc.status === 'Rejected'
          ? html`<div class="row">
                ${['PAN', 'Aadhaar', 'GSTIN'].map(
                  (d) => html`<button class="chip ${this._docType === d ? 'on' : ''}" aria-pressed=${this._docType === d} @click=${() => (this._docType = d)}>${d}</button>`,
                )}
              </div>
              <label class="field"
                >${this._docType} number
                <input
                  id="kyc-${this.variant}"
                  placeholder=${this._docType === 'PAN' ? 'ABCDE1234F' : ''}
                  .value=${this._docNumber}
                  @input=${(e) => (this._docNumber = e.target.value.toUpperCase())}
              /></label>
              <button
                class="btn"
                ?disabled=${this._docNumber.trim().length < 6 || this._busy}
                @click=${() => this._act('kyc', async () => (this._me = await this.api.submitKyc(this.tokens.access_token, this._docType, this._docNumber)))}
              >
                ${this._busy === 'kyc' ? 'Submitting…' : 'Submit for verification'}
              </button>`
          : html`<div>
              <div class="kv"><span>Document</span><span>${`${kyc.docType ?? ''} ${kyc.docRefMasked ?? ''}`.trim()}</span></div>
              <div class="kv"><span>Submitted via</span><span>${APP_LABEL[kyc.submittedVia] ?? kyc.submittedVia ?? '—'}</span></div>
              ${kyc.verifiedAt ? html`<div class="kv"><span>Verified</span><span>${date(kyc.verifiedAt)}</span></div>` : nothing}
            </div>`}
      </section>

      <section class="card stack" style="gap:12px">
        <div class="between">
          <span class="eyebrow" style="margin:0">Password</span>
          <span class="badge ${me.hasPassword ? 'ok' : 'muted'}">${me.hasPassword ? 'Set' : 'Not set'}</span>
        </div>
        <p class="muted">One password for your SportSeek account. Changing it here changes it in every app.</p>
        ${this._pwDone ? html`<div class="notice ok">Password saved. Try it in the other app's Password tab.</div>` : nothing}
        <label class="field"
          >${me.hasPassword ? 'New password' : 'Choose a password'}
          <input
            id="pw-${this.variant}"
            type="password"
            autocomplete="new-password"
            .value=${this._pw}
            @input=${(e) => (this._pw = e.target.value)}
          />
          <span class="hint">At least 8 characters, with a number and a lowercase letter</span></label
        >
        <button
          class="btn soft"
          ?disabled=${this._pw.length < 8 || this._busy}
          @click=${() =>
            this._act('pw', async () => {
              this._me = await this.api.setPassword(this.tokens.access_token, this._pw);
              this._pw = '';
              this._pwDone = true;
            })}
        >
          ${this._busy === 'pw' ? 'Saving…' : 'Save password'}
        </button>
      </section>

      <section class="card claims">
        <div class="between">
          <span class="eyebrow" style="margin:0">What this app's token carries</span>
          <button class="linkbtn" @click=${() => (this._showToken = !this._showToken)}>${this._showToken ? 'Hide' : 'Show'}</button>
        </div>
        <p class="muted" style="margin-top:8px">Tokens are app-scoped: this app's token only carries this app's roles.</p>
        ${this._showToken
          ? html`<div style="margin-top:8px">
              ${['sub', 'name', 'app', 'role', 'link_outcome', 'role_added', 'scope', 'exp'].map((k) =>
                claims[k] === undefined
                  ? nothing
                  : html`<div class="kv">
                      <span>${k}</span
                      ><span
                        >${k === 'exp'
                          ? new Date(claims[k] * 1000).toLocaleTimeString()
                          : Array.isArray(claims[k])
                            ? claims[k].join(', ')
                            : String(claims[k])}</span
                      >
                    </div>`,
              )}
              <button
                class="btn ghost sm"
                style="margin-top:8px"
                @click=${() => this._act('refresh', async () => this._emit('tokens', await this.api.refresh(this.tokens.refresh_token)))}
              >
                ${this._busy === 'refresh' ? 'Refreshing…' : 'Refresh token now'}
              </button>
            </div>`
          : nothing}
      </section>

      <button class="btn ghost" @click=${() => this._emit('sign-out')}>Sign out</button>
    </div>`;
  }
}
customElements.define('ss-profile', SsProfile);
