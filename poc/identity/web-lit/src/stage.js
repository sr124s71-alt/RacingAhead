import { LitElement, css, html, unsafeCSS } from 'lit';
import { MOCK } from './api.js';
import { APPS, base, mark } from './shared.js';
import './app-shell.js';

const GUIDE = [
  ['user', 'Register in the User App', 'Any Indian mobile, e.g. 98111 22233. The code arrives as a notification: tap it.'],
  ['partner', 'Use the same number in the Partner App', 'The account is found, and a role is added only after you prove ownership by OTP.'],
  ['admin', 'Watch the Admin Portal', 'Pre-filled admin number. One identity with both roles, the audit trail, the Phase 1 bootstrap and the remote switch.'],
];

// Faint court markings for the floodlit stage (a tennis court, drawn once as a data URI).
const COURT = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 560" fill="none" stroke="#94A3B8" stroke-opacity="0.35" stroke-width="2"><rect x="60" y="40" width="1080" height="480"/><path d="M60 100h1080M60 460h1080M600 40v480M330 100v360M870 100v360M330 280h540"/></svg>',
)}")`;

/**
 * The demo stage: User and Partner apps on phones, the Admin Portal in a browser window, all in one page
 * and sharing one Identity API. Below 1180px it becomes tabs, one app at a time.
 */
export class SsStage extends LitElement {
  static properties = {
    _wide: { state: true },
    _tab: { state: true },
  };

  static styles = [
    base,
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: 14px;
        height: 100%;
        overflow: hidden;
        padding: 18px 20px 14px;
        color: #E2E8F0;
        background: radial-gradient(900px 420px at 12% -8%, rgb(56 189 248 / 0.16), transparent 62%),
          radial-gradient(800px 420px at 88% -12%, rgb(250 204 21 / 0.1), transparent 60%), ${unsafeCSS(COURT)} center 115% / min(1400px, 130%) auto no-repeat,
          #0B1220;
      }
      .top {
        display: flex;
        gap: 22px;
        align-items: flex-end;
        justify-content: space-between;
        flex-wrap: wrap;
      }
      .title .eyebrow {
        color: #7DD3FC;
      }
      .title h1 {
        font-size: clamp(22px, 2.4vw, 30px);
        color: #F8FAFC;
        font-stretch: 125%;
        margin-top: 4px;
      }
      .title p {
        color: #94A3B8;
        font-size: 13.5px;
        margin-top: 4px;
      }
      ol {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
        flex: 1;
        max-width: 980px;
      }
      li {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        padding: 10px 12px;
        border-radius: 12px;
        background: rgb(148 163 184 / 0.07);
        border: 1px solid rgb(148 163 184 / 0.12);
      }
      .num {
        flex: none;
        width: 24px;
        height: 24px;
        border-radius: 7px;
        display: grid;
        place-items: center;
        font-family: var(--display);
        font-weight: 800;
        font-size: 13px;
        color: #fff;
      }
      .num.user {
        background: var(--user);
      }
      .num.partner {
        background: var(--partner);
      }
      .num.admin {
        background: var(--admin);
      }
      li b {
        display: block;
        color: #F1F5F9;
        font-size: 13px;
      }
      li span.t {
        color: #A3B1C6;
        font-size: 12px;
        line-height: 1.4;
      }
      .floor {
        flex: 1;
        min-height: 0;
        display: grid;
        grid-template-columns: 384px 384px minmax(0, 1fr);
        grid-template-rows: minmax(0, 1fr);
        gap: 22px;
        justify-content: center;
      }
      .phone {
        position: relative;
        min-height: 0;
        max-height: 860px;
        padding: 11px;
        border-radius: 48px;
        background: #04070D;
        box-shadow: 0 0 0 1.5px #2B3549, 0 0 0 5px #0E1522, 0 34px 70px -24px rgb(0 0 0 / 0.8);
      }
      .phone .screen {
        height: 100%;
        border-radius: 38px;
        overflow: hidden;
        position: relative;
      }
      .island {
        position: absolute;
        top: 20px;
        left: 50%;
        translate: -50% 0;
        width: 100px;
        height: 28px;
        border-radius: 999px;
        background: #04070D;
        z-index: 3;
      }
      .browser {
        min-height: 0;
        display: flex;
        flex-direction: column;
        border-radius: 14px;
        overflow: hidden;
        background: #fff;
        box-shadow: 0 0 0 1px #2B3549, 0 34px 70px -24px rgb(0 0 0 / 0.8);
      }
      .chrome {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 10px 14px;
        background: #E9ECF2;
        border-bottom: 1px solid #D6DBE4;
      }
      .dots {
        display: flex;
        gap: 7px;
      }
      .dots i {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #FF5F57;
      }
      .dots i:nth-child(2) {
        background: #FEBC2E;
      }
      .dots i:nth-child(3) {
        background: #28C840;
      }
      .url {
        flex: 1;
        max-width: 460px;
        margin: 0 auto;
        padding: 5px 12px;
        border-radius: 8px;
        background: #fff;
        color: #5A6478;
        font-size: 12.5px;
        text-align: center;
        font-family: var(--mono);
      }
      .browser ss-app {
        flex: 1;
      }
      .tabs {
        display: flex;
        gap: 6px;
        padding: 4px;
        border-radius: 14px;
        background: rgb(148 163 184 / 0.1);
      }
      .tabs button {
        flex: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        border: 0;
        padding: 10px 6px;
        border-radius: 10px;
        background: none;
        color: #CBD5E1;
        font-weight: 700;
        font-size: 13.5px;
        white-space: nowrap;
      }
      .tabs button[aria-selected='true'] {
        color: #fff;
        background: var(--tab);
      }
      .single {
        flex: 1;
        min-height: 0;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 0 0 1px #2B3549, 0 24px 50px -24px rgb(0 0 0 / 0.8);
      }
      .single ss-app[hidden] {
        display: none;
      }
      .foot {
        color: #8391A7;
        font-size: 12px;
        line-height: 1.5;
        max-width: 110ch;
      }
      @media (max-width: 1500px) {
        .floor {
          grid-template-columns: 360px 360px minmax(0, 1fr);
          gap: 16px;
        }
      }
      @media (max-width: 700px) {
        .foot {
          display: none;
        }
        .title h1 {
          font-size: 22px;
        }
      }
      @media (max-width: 460px) {
        .tabs svg {
          display: none;
        }
        .tabs button {
          font-size: 13px;
        }
      }
      @media (max-width: 1180px) {
        :host {
          padding: 14px 16px 12px;
        }
        ol {
          display: none;
        }
      }
    `,
  ];

  constructor() {
    super();
    this._tab = 'user';
    this._wide = window.innerWidth > 1180;
    this._onResize = () => (this._wide = window.innerWidth > 1180);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('resize', this._onResize);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('resize', this._onResize);
  }

  _floor() {
    if (this._wide)
      return html`<div class="floor">
        ${['user', 'partner'].map(
          (v) => html`<div class="phone"><div class="screen"><span class="island"></span><ss-app variant=${v} device="phone"></ss-app></div></div>`,
        )}
        <div class="browser">
          <div class="chrome">
            <span class="dots"><i></i><i></i><i></i></span>
            <span class="url">admin.sportseek.in/identity</span>
          </div>
          <ss-app variant="admin" device="browser"></ss-app>
        </div>
      </div>`;

    // Narrow screens: one app at a time. All three stay mounted so each keeps its session.
    return html`<div class="tabs" role="tablist">
        ${['user', 'partner', 'admin'].map(
          (v) => html`<button
            role="tab"
            aria-selected=${this._tab === v}
            style="--tab: var(--${v})"
            @click=${() => (this._tab = v)}
          >
            ${mark(v, 16)} ${APPS[v].label}
          </button>`,
        )}
      </div>
      <div class="single">
        ${['user', 'partner', 'admin'].map((v) => html`<ss-app variant=${v} ?hidden=${this._tab !== v}></ss-app>`)}
      </div>`;
  }

  render() {
    return html`
      <div class="top">
        <div class="title">
          <span class="eyebrow">SportSeek Phase 2A · F3 prototype</span>
          <h1>Shared Identity</h1>
          <p>One person, one SportSeek ID, across the User and Partner apps.</p>
        </div>
        <ol>
          ${GUIDE.map(
            ([v, t, d], i) => html`<li>
              <span class="num ${v}">${i + 1}</span>
              <span><b>${t}</b><span class="t">${d}</span></span>
            </li>`,
          )}
        </ol>
      </div>
      ${this._floor()}
      <p class="foot">
        ${MOCK
          ? 'Prototype: the Identity API runs in your browser, and your test data stays on this device. Codes are shown on screen instead of being texted. Start over from Admin Portal → Remote switch → Reset demo data.'
          : 'Connected to the Identity API. Codes are shown on screen by the Development environment instead of being texted.'}
      </p>
    `;
  }
}
customElements.define('ss-stage', SsStage);
