import { LitElement, css, html, nothing } from 'lit';
import { API_URL, APP_VERSION, isBelow, loadSession, makeApi, saveSession } from './api.js';
import { APPS, base, mark } from './shared.js';
import './signin.js';
import './profile.js';
import './phase1.js';
import './admin.js';

/**
 * One app (User, Partner or Admin): its own OIDC client and its own session. Polls config so the
 * remote switch and minimum version take effect live.
 */
export class SsApp extends LitElement {
  static properties = {
    variant: { reflect: true },
    device: { reflect: true },
    _config: { state: true },
    _configError: { state: true },
    _tokens: { state: true },
    _clock: { state: true },
  };

  static styles = [
    base,
    css`
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
        background: var(--paper);
      }
      :host([variant='user']) {
        --brand: var(--user);
        --brand-deep: var(--user-deep);
        --brand-tint: var(--user-tint);
      }
      :host([variant='partner']) {
        --brand: var(--partner);
        --brand-deep: var(--partner-deep);
        --brand-tint: var(--partner-tint);
      }
      :host([variant='admin']) {
        --brand: var(--admin);
        --brand-deep: var(--admin-deep);
        --brand-tint: var(--admin-tint);
      }
      .status {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 28px 4px;
        font-size: 14px;
        font-weight: 700;
        color: #fff;
        background: var(--brand);
        font-variant-numeric: tabular-nums;
      }
      .status svg {
        display: block;
      }
      header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 18px 16px;
        color: #fff;
        background: var(--brand);
      }
      :host([device='browser']) header {
        padding: 14px 22px;
      }
      .logo {
        flex: none;
        width: 38px;
        height: 38px;
        border-radius: 11px;
        display: grid;
        place-items: center;
        background: rgb(255 255 255 / 0.16);
        box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.25);
      }
      .brand {
        font-family: var(--display);
        font-stretch: 118%;
        font-weight: 800;
        font-size: 18px;
        letter-spacing: -0.01em;
        line-height: 1.1;
      }
      .tagline {
        font-size: 12px;
        opacity: 0.82;
        margin-top: 2px;
      }
      .ver {
        margin-left: auto;
        font-size: 11px;
        font-weight: 600;
        opacity: 0.72;
        font-family: var(--mono);
      }
      main {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        padding: 16px 16px 28px;
        scrollbar-width: thin;
      }
      .inner {
        max-width: 460px;
        margin: 0 auto;
      }
      :host([variant='admin']) .inner {
        max-width: 1040px;
      }
      :host([device='browser']) main {
        padding: 22px 24px 32px;
      }
      .update {
        text-align: center;
        padding: 28px 18px;
      }
      .update .ring {
        width: 64px;
        height: 64px;
        margin: 0 auto 14px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: var(--brand-tint);
        color: var(--brand-deep);
        font-size: 28px;
        font-weight: 800;
      }
    `,
  ];

  constructor() {
    super();
    this.device = 'plain';
    this._config = null;
    this._configError = null;
    this._tokens = null;
    this._clock = this._now();
  }

  _now() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  connectedCallback() {
    super.connectedCallback();
    this._api = makeApi(this.variant);
    this._tokens = loadSession(this.variant);
    const load = () =>
      this._api.config().then(
        (c) => ((this._config = c), (this._configError = null)),
        (e) => (this._configError = e.message),
      );
    load();
    this._poll = setInterval(() => {
      load();
      this._clock = this._now();
    }, 3000);
    this.addEventListener('signed-in', (e) => this._setTokens(e.detail));
    this.addEventListener('tokens', (e) => this._setTokens(e.detail));
    this.addEventListener('sign-out', () => this._setTokens(null));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this._poll);
  }

  _setTokens(t) {
    this._tokens = t;
    saveSession(this.variant, t);
    this.shadowRoot?.querySelector('main')?.scrollTo({ top: 0 });
  }

  _body() {
    const c = this._config;
    const v = this.variant;
    if (!c)
      return html`<div class="card">
        ${this._configError ? html`<div class="notice danger">${this._configError}</div>` : html`<p class="muted">Connecting to ${API_URL}…</p>`}
      </div>`;
    if (v !== 'admin' && isBelow(APP_VERSION, c.minAppVersion))
      return html`<div class="card update rise">
        <div class="ring">↑</div>
        <h1>Update required</h1>
        <p class="muted" style="margin:10px 0 12px">
          Version ${APP_VERSION} is no longer supported. Update to ${c.minAppVersion} or later to keep using ${APPS[v].name}.
        </p>
        <p class="hint">The API also refuses this build (426), so old apps in the field cannot call changed APIs.</p>
      </div>`;
    if (v !== 'admin' && !c.sharedIdentityEnabled) return html`<ss-phase1 .api=${this._api} variant=${v}></ss-phase1>`;
    if (!this._tokens) return html`<ss-signin .api=${this._api} variant=${v}></ss-signin>`;
    if (v === 'admin') return html`<ss-admin .api=${this._api} .tokens=${this._tokens}></ss-admin>`;
    return html`<ss-profile .api=${this._api} .tokens=${this._tokens} variant=${v}></ss-profile>`;
  }

  render() {
    const a = APPS[this.variant];
    return html`
      ${this.device === 'phone'
        ? html`<div class="status" aria-hidden="true">
            <span>${this._clock}</span>
            <span class="row" style="gap:5px">
              <svg width="17" height="11" viewBox="0 0 17 11"><g fill="#fff"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="5" width="3" height="6" rx="1"/><rect x="9" y="2.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></g></svg>
              <svg width="25" height="12" viewBox="0 0 25 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="#fff" opacity=".6"/><rect x="2" y="2" width="16" height="8" rx="1.6" fill="#fff"/><rect x="22.5" y="4" width="1.8" height="4" rx=".9" fill="#fff" opacity=".6"/></svg>
            </span>
          </div>`
        : nothing}
      <header>
        <div class="logo">${mark(this.variant, 22)}</div>
        <div>
          <div class="brand">${a.name}</div>
          <div class="tagline">${a.tagline}</div>
        </div>
        <span class="ver">v${APP_VERSION}</span>
      </header>
      <main><div class="inner">${this._body()}</div></main>
    `;
  }
}
customElements.define('ss-app', SsApp);
