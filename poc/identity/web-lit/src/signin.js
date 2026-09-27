import { LitElement, css, html, nothing } from 'lit';
import { ApiError } from './api.js';
import { APPS, base, mark } from './shared.js';

const ROLE_CHOICES = {
  user: [
    ['Player', 'Play & book'],
    ['EventOrganiser', 'Organise events'],
  ],
  partner: [
    ['FacilityPartner', 'Facility Partner'],
    ['Coach', 'Coach'],
    ['Physio', 'Physio'],
    ['Nutritionist', 'Nutritionist'],
  ],
  admin: [],
};

const SCENARIO = {
  register: ['ok', 'New account'],
  'sign-in': ['info', 'Welcome back'],
  link: ['warn', 'Existing SportSeek account found'],
};

/** Register, sign in or link with a one-time code (or a password). Emits `signed-in` with the tokens. */
export class SsSignIn extends LitElement {
  static properties = {
    api: { attribute: false },
    variant: {},
    _mode: { state: true },
    _identifier: { state: true },
    _role: { state: true },
    _start: { state: true },
    _code: { state: true },
    _name: { state: true },
    _password: { state: true },
    _busy: { state: true },
    _error: { state: true },
    _sms: { state: true },
  };

  static styles = [
    base,
    css`
      :host {
        display: block;
        position: relative;
      }
      .intro {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin: 6px 2px 4px;
      }
      .otp {
        font-family: var(--mono);
        font-size: 26px;
        font-weight: 700;
        letter-spacing: 0.62em;
        padding: 12px 0 12px 0.62em;
        text-align: center;
      }
      .sms {
        position: sticky;
        top: 8px;
        z-index: 5;
        display: flex;
        gap: 11px;
        align-items: flex-start;
        width: 100%;
        text-align: left;
        border: 0;
        border-radius: 18px;
        padding: 11px 13px;
        background: rgb(255 255 255 / 0.86);
        backdrop-filter: blur(14px) saturate(1.4);
        -webkit-backdrop-filter: blur(14px) saturate(1.4);
        box-shadow: 0 10px 30px -10px rgb(16 24 40 / 0.35), 0 0 0 1px rgb(16 24 40 / 0.06);
        animation: drop 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
        color: var(--text);
      }
      .sms:hover {
        box-shadow: 0 12px 34px -10px rgb(16 24 40 / 0.4), 0 0 0 2px var(--brand);
      }
      .sms .icon {
        flex: none;
        width: 34px;
        height: 34px;
        border-radius: 9px;
        display: grid;
        place-items: center;
        background: #34C759;
        color: #fff;
      }
      .sms .meta {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: var(--muted);
        font-weight: 600;
      }
      .sms .text {
        font-size: 13.5px;
        line-height: 1.35;
        margin-top: 2px;
      }
      .sms .code {
        font-family: var(--mono);
        font-weight: 800;
        font-size: 16px;
        letter-spacing: 0.06em;
        color: var(--brand-deep);
      }
      .sms .cta {
        display: block;
        margin-top: 4px;
        font-size: 12px;
        font-weight: 700;
        color: var(--brand);
      }
      .waiting {
        text-align: center;
        font-size: 12.5px;
        color: var(--faint);
        padding: 6px;
      }
      .foot {
        text-align: center;
        font-size: 12px;
        color: var(--faint);
        line-height: 1.5;
      }
    `,
  ];

  constructor() {
    super();
    this._mode = 'otp';
    this._identifier = '';
    this._start = null;
    this._code = '';
    this._name = '';
    this._password = '';
    this._busy = false;
    this._error = null;
    this._sms = null;
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.variant === 'admin') this._identifier = '+91 90000 00001';
    this._role = ROLE_CHOICES[this.variant][0]?.[0];
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this._poll);
  }

  async _run(fn) {
    this._busy = true;
    this._error = null;
    try {
      await fn();
    } catch (e) {
      this._error = e instanceof ApiError ? e.message : String(e);
    } finally {
      this._busy = false;
    }
  }

  _watchInbox() {
    clearInterval(this._poll);
    const check = async () => {
      if (!this._start) return;
      const inbox = await this.api.otpInbox().catch(() => []);
      this._sms = inbox.find((m) => m.challengeId === this._start?.challengeId) ?? null;
    };
    check();
    this._poll = setInterval(check, 1200);
  }

  _requestOtp = () =>
    this._run(async () => {
      this._start = await this.api.requestOtp(this._identifier, this.variant === 'admin' ? undefined : this._role);
      this._code = '';
      this._sms = null;
      this._watchInbox();
    });

  _verify = () =>
    this._run(async () => {
      const t = await this.api.otpToken(
        this._start.challengeId,
        this._code.trim(),
        this.variant === 'admin' ? undefined : this._role,
        this._name.trim() || undefined,
      );
      clearInterval(this._poll);
      this.dispatchEvent(new CustomEvent('signed-in', { detail: t, bubbles: true, composed: true }));
    });

  _passwordSignIn = () =>
    this._run(async () => {
      const t = await this.api.passwordToken(this._identifier, this._password);
      this.dispatchEvent(new CustomEvent('signed-in', { detail: t, bubbles: true, composed: true }));
    });

  _reset = () => {
    clearInterval(this._poll);
    this._start = null;
    this._sms = null;
    this._code = '';
    this._error = null;
  };

  _onKey(e, action) {
    if (e.key === 'Enter') action();
  }

  render() {
    const v = this.variant;
    const s = this._start;
    const verifyLabel = s?.scenario === 'link' ? 'Verify & link account' : s?.scenario === 'register' ? 'Verify & create account' : 'Verify & sign in';

    return html`
      <div class="stack">
        ${s && this._sms
          ? html`<button class="sms" @click=${() => (this._code = this._sms.code)} aria-label="Use code ${this._sms.code}">
              <span class="icon">${mark('user', 18)}</span>
              <span style="flex:1;min-width:0">
                <span class="meta"><span>MESSAGES · SportSeek</span><span>now</span></span>
                <span class="text"
                  ><span class="code">${this._sms.code}</span> is your SportSeek verification code for ${APPS[v].label}. Do not share it.</span
                >
                <span class="cta">Tap to fill the code</span>
              </span>
            </button>`
          : nothing}

        <div class="intro">
          <span class="eyebrow">${v === 'admin' ? 'Restricted access' : s ? 'Step 2 of 2 · Verify' : 'Step 1 of 2 · Your number'}</span>
          <h1>${v === 'admin' ? 'Admin sign in' : s ? 'Enter your code' : 'Sign in or register'}</h1>
          <p class="muted">
            ${v === 'admin'
              ? 'Admin access is granted by SportSeek. It can never be self-registered.'
              : 'One SportSeek account works across the User and Partner apps.'}
          </p>
        </div>

        <div class="card stack rise">
          ${v !== 'admin' && !s
            ? html`<div class="segmented" role="group" aria-label="Sign-in method">
                ${[
                  ['otp', 'One-time code'],
                  ['password', 'Password'],
                ].map(
                  ([m, l]) =>
                    html`<button aria-pressed=${this._mode === m} @click=${() => ((this._mode = m), (this._error = null))}>${l}</button>`,
                )}
              </div>`
            : nothing}
          ${!s
            ? html`
                <label class="field"
                  >Mobile number or email
                  <input
                    id="identifier-${v}"
                    inputmode="email"
                    autocomplete="username"
                    placeholder="98765 43210"
                    .value=${this._identifier}
                    @input=${(e) => (this._identifier = e.target.value)}
                    @keydown=${(e) => this._onKey(e, this._mode === 'otp' ? this._requestOtp : this._passwordSignIn)}
                /></label>
                ${this._mode === 'otp' && ROLE_CHOICES[v].length
                  ? html`<div class="stack" style="gap:8px">
                      <span class="field" style="font-size:13px;font-weight:650">${v === 'partner' ? 'I am a' : 'I want to'}</span>
                      <div class="row">
                        ${ROLE_CHOICES[v].map(
                          ([r, l]) =>
                            html`<button class="chip ${this._role === r ? 'on' : ''}" aria-pressed=${this._role === r} @click=${() => (this._role = r)}>
                              ${l}
                            </button>`,
                        )}
                      </div>
                    </div>`
                  : nothing}
                ${this._mode === 'password'
                  ? html`<label class="field"
                      >Password
                      <input
                        id="password-${v}"
                        type="password"
                        autocomplete="current-password"
                        .value=${this._password}
                        @input=${(e) => (this._password = e.target.value)}
                        @keydown=${(e) => this._onKey(e, this._passwordSignIn)}
                    /></label>`
                  : nothing}
              `
            : html`
                <div class="notice ${SCENARIO[s.scenario][0]}">
                  <b>${SCENARIO[s.scenario][1]}</b>${s.message}
                  ${s.fromPhase1 ? html`<br />This number is on an existing Phase 1 account; verifying it connects that account.` : nothing}
                </div>
                ${s.scenario === 'register'
                  ? html`<label class="field"
                      >Your name
                      <input
                        id="name-${v}"
                        autocomplete="name"
                        placeholder="As you'd like it shown"
                        .value=${this._name}
                        @input=${(e) => (this._name = e.target.value)}
                    /></label>`
                  : nothing}
                <label class="field"
                  >6-digit code
                  <input
                    id="otp-${v}"
                    class="otp"
                    inputmode="numeric"
                    autocomplete="one-time-code"
                    maxlength="6"
                    placeholder="······"
                    .value=${this._code}
                    @input=${(e) => (this._code = e.target.value.replace(/\D/g, ''))}
                    @keydown=${(e) => this._onKey(e, this._verify)}
                /></label>
                ${!this._sms ? html`<div class="waiting">Waiting for the SMS…</div>` : nothing}
              `}
          ${this._error ? html`<div class="notice danger" role="alert">${this._error}</div>` : nothing}
          ${!s && this._mode === 'otp'
            ? html`<button class="btn" ?disabled=${!this._identifier.trim() || this._busy} @click=${this._requestOtp}>
                ${this._busy ? 'Sending…' : 'Send code'}
              </button>`
            : nothing}
          ${!s && this._mode === 'password'
            ? html`<button class="btn" ?disabled=${!this._identifier.trim() || !this._password || this._busy} @click=${this._passwordSignIn}>
                ${this._busy ? 'Signing in…' : 'Sign in'}
              </button>`
            : nothing}
          ${s
            ? html`<button class="btn" ?disabled=${this._code.length !== 6 || this._busy} @click=${this._verify}>
                  ${this._busy ? 'Verifying…' : verifyLabel}
                </button>
                <button class="btn ghost" @click=${this._reset}>Use a different number</button>`
            : nothing}
        </div>
        <p class="foot">
          ${this._mode === 'password' && !s
            ? 'A password never adds a new app to your account. Use a one-time code for that.'
            : 'Demo: codes appear as a notification on this screen instead of an SMS.'}
        </p>
      </div>
    `;
  }
}
customElements.define('ss-signin', SsSignIn);

