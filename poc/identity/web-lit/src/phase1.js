import { LitElement, html, nothing } from 'lit';
import { ApiError } from './api.js';
import { base } from './shared.js';

/** The Phase 1 login the apps fall back to while Shared Identity is switched off. */
export class SsPhase1 extends LitElement {
  static properties = {
    api: { attribute: false },
    variant: {},
    _identifier: { state: true },
    _password: { state: true },
    _account: { state: true },
    _error: { state: true },
    _busy: { state: true },
  };

  static styles = base;

  constructor() {
    super();
    this._identifier = '';
    this._password = '';
    this._account = null;
    this._error = null;
    this._busy = false;
  }

  async _signIn() {
    this._busy = true;
    this._error = null;
    try {
      this._account = await this.api.phase1Login(this._identifier, this._password);
    } catch (e) {
      this._error = e instanceof ApiError ? e.message : String(e);
    } finally {
      this._busy = false;
    }
  }

  render() {
    const a = this._account;
    return html`<div class="stack">
      <div class="notice warn rise">
        <b>Shared Identity is switched off</b>This app is using the Phase 1 login, with separate accounts per app. Nothing created with Shared
        Identity is lost: switch it back on and everyone signs in as before.
      </div>
      ${a
        ? html`<div class="card stack">
            <span class="eyebrow">Phase 1 ${this.variant === 'partner' ? 'partner' : 'user'} account</span>
            <h1>${a.businessName ?? a.name}</h1>
            <div>
              <div class="kv"><span>Phase 1 account</span><span>#${a.legacyId}</span></div>
              ${a.businessName ? html`<div class="kv"><span>Owner</span><span>${a.name}</span></div>` : nothing}
              ${a.partnerType ? html`<div class="kv"><span>Partner type</span><span>${a.partnerType}</span></div>` : nothing}
              ${a.kycStatus ? html`<div class="kv"><span>KYC</span><span>${a.kycStatus}</span></div>` : nothing}
            </div>
            <button class="btn ghost" @click=${() => (this._account = null)}>Sign out</button>
          </div>`
        : html`<div class="card stack">
            <h1>Sign in</h1>
            <p class="muted">Phase 1 demo accounts use the password <span class="mono">demo1234</span>.</p>
            <label class="field"
              >Mobile number or email
              <input
                id="p1-id-${this.variant}"
                placeholder=${this.variant === 'partner' ? '98765 43210' : '98123 45678'}
                .value=${this._identifier}
                @input=${(e) => (this._identifier = e.target.value)}
            /></label>
            <label class="field"
              >Password
              <input
                id="p1-pw-${this.variant}"
                type="password"
                .value=${this._password}
                @input=${(e) => (this._password = e.target.value)}
                @keydown=${(e) => e.key === 'Enter' && this._signIn()}
            /></label>
            ${this._error ? html`<div class="notice danger" role="alert">${this._error}</div>` : nothing}
            <button class="btn" ?disabled=${!this._identifier || !this._password || this._busy} @click=${() => this._signIn()}>
              ${this._busy ? 'Signing in…' : 'Sign in'}
            </button>
          </div>`}
    </div>`;
  }
}
customElements.define('ss-phase1', SsPhase1);
