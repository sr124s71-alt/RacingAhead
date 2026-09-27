const L = require('./lib');
const { P, H1, H1n, H2, H3, B, N, T, C, IMG, SP, cover, contents, build, LAND_W } = L;
const plan = require('./plan.json');
const res = require('./res.json');
const fmt = s => { const d = new Date(s + 'T00:00:00'); return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }); };
const OUT = process.argv[2];
const V = { version: 'v2.1 (AI-native release train; Shared Identity in R1)', status: 'Issued for client review — supersedes v2.0' };

const toc = ['1. Purpose and conventions', '2. Executive summary', '3. The AI-native delivery approach in brief', '4. Feature catalogue: 12 features in 6 monthly releases',
  '5. Date feasibility and release-train rules', '6. Planning basis and assumptions', '7. Work Breakdown Structure (WBS) and WBS dictionary', '8. Integrated schedule',
  '9. Detailed activity schedule', '10. Dependency management', '11. Critical path and schedule risk', '12. Milestones, gates and acceptance evidence',
  '13. Anatomy of a monthly release', '14. Resource plan: AI-native pod, loading and technical skills', '15. Baseline control and re-planning rules', 'Appendix A. SOW-to-WBS traceability'];

const s1 = cover({ title: 'Work Breakdown Structure & Integrated Project Plan', subtitle: 'Phase 2A, AI-native delivery: public launch with Shared Identity on 20 October 2026, then new features every month to Phase 2A completion on 23 March 2027', docId: 'SRV-SPS-2A-PLN-001', ...V });

const s2 = [
  ...contents(toc),
  H1('1. Purpose and conventions'),
  P('This is the integrated project plan for Phase 2A of the SportSeek programme, prepared by Srivin Platforms as delivery partner to RacingAhead / SportSeek. It breaks the Phase 2A scope in the SportSeek Phase 2 SOW into **12 customer-facing features delivered in 6 monthly releases**, schedules every work package, and dates every dependency on SportSeek and third parties.'),
  P('Version 2.1 moves **F3 Shared Identity into R1, the 20 October 2026 public launch**, at SportSeek\'s request. It follows version 2.0, which replaced the conventional plan in v1.0 with Srivin\'s **AI-native delivery model**. A small senior pod uses AI coding, testing and documentation agents under strict human review, so SportSeek gets features in production every month rather than every quarter. Where the SOW leaves an item open (marked ⚑ in the SOW), this plan does not assume an answer; it records a dated SportSeek decision (Section 10.3).'),
  ...T([['Companion document', 3], ['Purpose', 7]], [
    ['SRV-SPS-2A-DLM-002 Project Delivery Model', 'How the AI-native release train runs: AI-augmented lifecycle, cadence, governance, AI guardrails, quality, KT and support'],
    ['SRV-SPS-2A-TAD-003 Technical Approach', 'Architecture on React Native / .NET / PostgreSQL, per-feature design, and the AI-accelerated engineering approach'],
    ['SRV-SPS-2A-PLN-001a Project Plan workbook (.xlsx)', 'Schedule, dependency register, milestones and resource loading in spreadsheet form']]),
  ...B(['**Dates** are IST calendar dates; durations are working days (Mon–Fri). Public and festival holidays are applied once the joint holiday calendar is agreed.',
    '**Owner**: "Srivin", "SportSeek" or "Joint" (both, Srivin driving). **Predecessors**: a bare ID is Finish-to-Start, "SS" is Start-to-Start, "D-n" is an external dependency.',
    '**R1–R6** are the monthly releases; **F1–F12** are the features. SOW milestone numbers M1–M6 are kept in the traceability appendix.']),

  H1('2. Executive summary'),
  P('SportSeek came to Srivin for a faster go-to-market. This plan delivers it. **SportSeek goes public on 20 October 2026 with Shared Identity (one account across the User and Partner apps) live on day one, and then receives new features in production every month.** The full Phase 2A scope is live by **23 March 2027**, delivered by an AI-native pod of about 10 people.'),
  ...IMG('release_train.png', 640, 'Figure 1 — Phase 2A release train: 6 releases, 12 features, one release every month'),
  ...T([['Release', 1], ['Go-live', 1.5], ['Features', 5.5], ['SOW scope', 2]], [
    ['**R1**', '**Tue 20 Oct 2026**', 'Public launch of the hardened Phase 1 product + **F3** Shared identity & account linking (behind a remote switch with fallback to Phase 1 login)', 'Launch; M1 subset; M2'],
    ['**R2**', 'Tue 24 Nov 2026', '**F1** Email notifications + **F2** Booking & event reminders + **F4** Push & role-scoped preferences; merge of existing duplicate accounts', 'M6 (part); M2 (merge)'],
    ['**R3**', 'Tue 22 Dec 2026', '**F5** Cancellation & refunds + **F6** Web app for players', 'M4 (part); Web app'],
    ['**R4**', 'Wed 27 Jan 2027', '**F7** Generalised partner model (coach, physio, nutritionist) + **F8** Waitlist & edit alerts', 'M5; M4 (part)'],
    ['**R5**', 'Tue 23 Feb 2027', '**F9** Transaction Ledger + **F10** Web app for organisers & partners', 'M3; Web app'],
    ['**R6**', 'Tue 23 Mar 2027', '**F11** Split settlement & partner payouts + **F12** WhatsApp & full alert catalog — **Phase 2A complete**', 'M5/M3 (payouts); M6']]),
  H2('2.1 What changes versus a conventional plan'),
  P('The comparison below is against Srivin\'s own conventional estimate for the same scope (plan v1.0), not a market benchmark.'),
  ...T([['Measure', 3], ['Conventional (v1.0)', 2.5], ['AI-native (this plan)', 2.5], ['Difference', 2]], [
    ['First new feature in production', 'Jan 2027', '**20 Oct 2026** (launch day)', '~3 months sooner'],
    ['Release cadence', '4 releases in 7 months', '**6 releases, one every month**', 'Monthly value'],
    ['Shared Identity live', '27 Jan 2027', '**20 Oct 2026** (launch day)', '~3 months sooner'],
    ['Phase 2A complete', '4 May 2027', '**23 Mar 2027**', '6 weeks sooner'],
    ['Peak Srivin team', '~24.5 FTE', `**~${res.total[0]} FTE** (launch month, incl. identity); ~10.5 steady state`, '~40–55% smaller'],
    ['Total Srivin effort', '154 person-months', `**${res.pm} person-months**`, `${Math.round((1 - res.pm / 154) * 100)}% less`],
    ['Knowledge transfer', '2–4 weeks after each milestone', 'Continuous, with a signed checklist every release', 'No KT gaps']]),
  ...C('Key messages for the steering committee', [
    '**1. Speed is designed in, not promised.** AI agents write most first-draft code, tests and documentation from approved specifications, and senior engineers review and own every change. That is why a 10-person pod can release two features a month.',
    '**2. We are explicit about what AI does not speed up**: SportSeek decisions, app-store review, UAT, penetration testing, and third-party approvals (Razorpay Route, DLT and WhatsApp templates). These are dated dependencies in Section 10.3. Each one is on SportSeek\'s side of the table and can move a feature to the next train.',
    '**3. Fixed dates, flexible scope.** Every release date is fixed. If a feature is not release-ready, it rides the next monthly train behind a feature flag and the train still leaves on time.',
    '**4. Day-one prerequisites:** SportSeek\'s approval of Srivin\'s AI tooling on its code (D21, by 29 Sep) and SportSeek\'s identity decisions (D22, by 2 Oct). Without them, the plan reverts to conventional pace, or F3 moves to R2.',
    '**5. Shared Identity at launch is the plan\'s highest-risk item.** It ships behind a remote switch. If the identity pen test or UAT is not clean by 19 Oct, SportSeek still launches on 20 Oct on the existing Phase 1 login, and F3 is switched on in a fast-follow (Section 5).'], 'key'),

  H1('3. The AI-native delivery approach in brief'),
  P('AI changes the economics of building software; it does not change who is accountable. Our model puts AI agents inside every engineering step and keeps a named senior engineer responsible for everything that merges. The full model is in the Project Delivery Model (SRV-SPS-2A-DLM-002). The planning consequences are below.'),
  ...T([['Where AI accelerates delivery', 5], ['Where it does not, so the plan protects time for it', 5]], [
    ['Reading and documenting the live Phase 1 code (architecture, ERD, API catalogue) in days instead of weeks', 'SportSeek decisions and approvals (scope, designs, refund policy, merge rules)'],
    ['Drafting user stories, acceptance criteria, edge cases and UAT scripts from the SOW', 'App Store / Google Play review windows'],
    ['Generating implementation code and unit tests from approved specifications', 'UAT by SportSeek testers'],
    ['Generating API, regression and end-to-end tests; test data', 'Manual penetration testing (VAPT) before go-live'],
    ['Porting existing mobile journeys to the web against the same APIs', 'Razorpay Route enablement, DLT template registration, WhatsApp template approval'],
    ['Migration and reconciliation scripts; first-pass code review; living documentation', 'Production data migration windows and rehearsals']]),
  P('**Planning assumption:** AI-assisted build, test and documentation effort is planned at roughly 40–50% of our conventional estimate. No reduction is assumed for decisions, approvals, UAT or security testing. Actual velocity is measured from R2, and the plan is re-baselined at the R2 release review if needed (Section 15).'),

  H1('4. Feature catalogue: 12 features in 6 monthly releases'),
  ...T([['ID', 0.5], ['Feature', 2.4], ['What the user gets', 3.3], ['Rel.', 0.5], ['Depends on', 1.5], ['SOW ref.', 0.9]], [
    ['F1', 'Email notifications', 'Email alongside SMS for booking, registration and payment confirmations', 'R2', 'D14 email provider', '§10.1–10.2'],
    ['F2', 'Booking & event reminders', 'T-24h and T-2h reminders for bookings and events', 'R2', 'D12 templates / DLT', '§10.2'],
    ['F3', 'Shared identity & account linking', 'One account across User and Partner apps; OTP-verified linking; multiple roles; KYC status carried on the identity', '**R1**', 'D22 identity decisions', '§7, §9.1'],
    ['F4', 'Push notifications & preferences', 'Push on iOS/Android; notification preferences per role', 'R2', 'F3 roles; D14 FCM/APNs', '§7.4, §10'],
    ['F5', 'Cancellation & refunds', 'Cancel bookings and tournament registrations; refunds to original payment method via the gateway', 'R3', 'D11 refund policy', '§8.2, §9.3'],
    ['F6', 'Web app — players', 'Venue search, availability, booking, event registration and payment on the web', 'R3', 'F3 login; design system', '§3.1'],
    ['F7', 'Generalised partner model', 'Coach, physio and nutritionist partners onboard like facilities; new types enabled by admin configuration', 'R4', 'F3 roles', '§9.4'],
    ['F8', 'Waitlist & edit alerts', 'Join a waitlist for full slots/tournaments; alerts when a published event changes', 'R4', 'F4 channels; F5 states', '§9.3, §10.2'],
    ['F9', 'Transaction Ledger', 'Admin payment history, detail, filters, sorting, PDF/CSV statements, refund tracker', 'R5', 'F3; F5; D15', '§8'],
    ['F10', 'Web app — organisers & partners', 'Events, tournaments, scheduling, scoring, service and booking management on the web', 'R5', 'F6; F7', '§3.1'],
    ['F11', 'Split settlement & partner payouts', 'Razorpay Route linked accounts for all partner types; partner settlement view on web', 'R6', 'F7; F9; D10', '§8.2–8.3'],
    ['F12', 'WhatsApp & full alert catalog', 'WhatsApp channel and every SOW §10.2 trigger live', 'R6', 'F4; D13', '§10']], { size: 16 }),
  P('**Enablers** ship inside releases but are not counted as features: identity bootstrap of existing accounts (R1), platform foundation (R2), merge of existing duplicate accounts (R2), data import tools for completed events (R6), and the infrastructure operations runbook (R6).'),

  H1('5. Date feasibility and release-train rules'),
  P('As at the date of this plan (Sunday 27 September 2026) there are 16 working days before 20 October 2026. R1 now combines hardening with **F3 Shared Identity**, the most sensitive feature in Phase 2A, because it changes every login. This is achievable only with a tightly scoped F3, extra identity capacity in October, identity decisions by 2 October, and a safe fallback. The scope and fallback are set out below.'),
  H2('5.1 F3 in R1: scope, fallback and what follows in R2'),
  ...T([['In R1 (20 Oct)', 5], ['Follows in R2 (24 Nov)', 5]], [
    ['One identity service in .NET; User, Partner and Admin as separate OIDC clients with their own logins (SOW §7)', 'Merge of existing duplicate User/Partner accounts under SportSeek-approved rules (D18)'],
    ['OTP-verified account linking at registration: an existing phone/email adds the new role to the same identity (SOW §7.3)', 'Cross-app deep links from notifications (with F4)'],
    ['Multi-role identity; one credential and profile across apps; KYC/verification status carried on the identity', 'Notification preferences per role (F4)'],
    ['Bootstrap of every existing account 1:1 into the identity store; minimum-version enforcement', '—'],
    ['**Fallback**: F3 is controlled by a remote switch. If not cleared at Go/No-Go, the apps launch on Phase 1 login and F3 is switched on in a fast-follow (target 3 Nov)', '—']], { size: 17 }),
  ...C('Launch-date conditions', [
    'The 20 Oct date holds only if: **(a)** the NDA/SOW is executed and access to code, infrastructure, store consoles and the gateway dashboard is granted by **29 Sep**; **(b)** AI tooling is approved by **29 Sep** (D21); **(c)** SportSeek\'s identity decisions are made by **2 Oct** (D22); **(d)** launch scope is frozen at the Scope Gate on **1 Oct**; **(e)** legal content (including the shared-identity privacy notice) is supplied by **9 Oct**; **(f)** UAT testers are available **15–19 Oct**.',
    'Go/No-Go on 19 Oct is two decisions: whether to launch, and whether F3 is switched on. The launch never waits for F3.'], 'risk'),
  H2('5.2 Release-train rules'),
  ...N(['**Release dates are fixed** for the whole plan; they are the calendar SportSeek\'s marketing can plan around.', '**Scope flexes between trains.** A feature that misses its hardening entry criteria moves to the next train behind a feature flag. It is never forced into production.',
    '**Every release passes the same gates**: automated regression, security scans, UAT sign-off and Go/No-Go (Section 12). Security-sensitive releases (R1 identity, R3 refunds, R6 payouts) also get a targeted manual pen test, and R6 gets the full pre-completion VAPT.', '**Back-end changes can deploy continuously** behind flags; mobile store releases follow the monthly train.'], 'num'),

  H1('6. Planning basis and assumptions'),
  ...T([['#', 0.6], ['Assumption', 7], ['If it does not hold', 3]], [
    ['A1', 'Kick-off Tue 29 Sep 2026 with NDA and SOW/PO executed.', 'Launch at risk day-for-day'],
    ['A2', 'Phase 1 source code, DB schema and API documentation provided before kick-off (SOW §5).', 'Launch hardening slips'],
    ['A3', 'All accounts are SportSeek-owned; Srivin works within them (SOW §5, §15).', 'Access requests on the critical path'],
    ['A4', 'A named SportSeek Product Owner decides within 1 working day and approves UI within 2 working days.', 'Features ride the next train'],
    ['A5', 'SportSeek testers run UAT in the hardening week of each release (3 days).', 'Release slips to next train'],
    ['A6', 'Stack as confirmed: React Native mobile, .NET back end, PostgreSQL. React/Next.js proposed for web.', 'Skills mix re-planned'],
    ['A7', 'SportSeek approves AI tooling under enterprise terms (no training on SportSeek code or data; no production personal data in prompts) (D21).', 'Plan reverts to conventional pace and team'],
    ['A8', 'Razorpay is the gateway; Route split settlement will be integrated (SOW §8.3 NOTE).', 'F11 re-planned via change request'],
    ['A9', 'Ledger scope is Admin + partner settlement view on web (SOW §8.1–8.2); any mobile ledger view is confirmed by D15.', 'Adds scope to a later train'],
    ['A10', 'AI-assisted build effort planned at ~40–50% of conventional; no reduction for approvals, UAT, VAPT.', 'Re-baseline at R2 review'],
    ['A11', 'Phase 2B/2C scope excluded; the same train can continue into Phase 2B from April 2027.', '—']], { size: 17 }),

  H1('7. Work Breakdown Structure (WBS) and WBS dictionary'),
  P('The WBS is organised by release, so each Level-1 element is something SportSeek can accept on its own. Every Phase 2A scope item in SOW §3.1 and every deliverable in SOW §13 maps to a work package (Appendix A).'),
  H2('7.1 WBS hierarchy (Levels 1–2)'),
  ...T([['L1', 0.6], ['Element', 3.6], ['Level-2 work packages', 6.8]], [
    ['1', 'Programme Management & AI Delivery Governance', '1.1 Mobilisation & AI toolchain · 1.2 Kick-off · 1.3 Train plan, RAID, AI policy · 1.4 Governance cadence · 1.5 Change control · 1.6 Closure'],
    ['2', 'R1 — Public Launch + F3 Shared Identity', '2.1 AI-assisted assessment · 2.2 Scope Gate · 2.3 Env/CI-CD · 2.4 AI regression suite · 2.5 Defects · 2.6 F3 identity design · 2.7 F3 identity service · 2.8 F3 linking in apps · 2.9 F3 account bootstrap · 2.10 F3 switch & fallback · 2.11 Security, VAPT & identity pen test · 2.12 Load test · 2.13 Store & DPDP · 2.14 Freeze · 2.15 Store · 2.16 UAT · 2.17 Runbook · 2.18 Go/No-Go · 2.19 Launch · 2.20 Hypercare'],
    ['3', 'Discovery, Architecture & Design', '3.1 AI-generated as-is docs · 3.2 Story mapping · 3.3 HLD & ADRs · 3.4 HLD sign-off · 3.5 Design system · 3.6 Design approval · 3.7 Specs/UI/LLD one train ahead · 3.8 Open-item closure'],
    ['4', 'Platform Foundation (M1)', '4.1 IaC · 4.2 CI/CD gates incl. AI review · 4.3 Event bus, BFF, feature flags · 4.4 M1 acceptance'],
    ['5', 'R2 — F1, F2, F4', '5.1 F1 Email · 5.2 F2 Reminders · 5.3 F4 Push & preferences · 5.4 Duplicate-account merge · 5.5 Hardening & UAT · 5.6 Go-live · 5.7 Hypercare & KT'],
    ['6', 'R3 — F5, F6', '6.1 F5 Cancellation & refunds · 6.2 F6 Web (players) · 6.3 Hardening · 6.4 Go-live · 6.5 Hypercare & KT'],
    ['7', 'R4 — F7, F8', '7.1 F7 Partner model · 7.2 F8 Waitlist & edit alerts · 7.3 Hardening · 7.4 Go-live · 7.5 Hypercare & KT'],
    ['8', 'R5 — F9, F10', '8.1 F9 Ledger · 8.2 F10 Web (organisers & partners) · 8.3 Hardening · 8.4 Go-live · 8.5 Hypercare & KT'],
    ['9', 'R6 — F11, F12 & Phase completion', '9.1 F11 Route payouts · 9.2 F12 WhatsApp & catalog · 9.3 Import tools · 9.4 Hardening & full VAPT · 9.5 Go-live · 9.6 Hypercare · 9.7 Ops runbook · 9.8 Final KT · 9.9 Acceptance'],
    ['10', 'Continuous Support', '10.1 Phase 1 production support · 10.2 90-day warranty per release']], { size: 17 }),
  H2('7.2 WBS dictionary — key work packages'),
  ...T([['WBS', 0.6], ['Work package', 2], ['Key deliverables', 3.6], ['Completion / acceptance criteria', 3.6], ['SOW', 0.8]], [
    ['2.1', 'AI-assisted Phase 1 assessment', 'Codebase map, ERD, API inventory, dependency and security findings, defect triage, launch risks', 'Reviewed at the Scope Gate; each launch risk owned and decided', '5, 16'],
    ['2.4', 'AI-generated regression suite', 'Automated API and mobile regression covering every live Phase 1 journey', 'Suite green on the RC build; runs on every merge from then on', '14.1'],
    ['2.11', 'Security baseline & identity pen test', 'SAST, dependency, DAST reports; VAPT of launch surface; targeted identity pen test; remediation log', 'No open critical/high findings at Go/No-Go', '6.2'],
    ['3.3', 'HLD & ADRs', 'Target architecture, ADRs, integration and security design, NFR targets', 'Signed off by SportSeek (3.4)', '6, 13'],
    ['3.7', 'Feature specs & LLD', 'Per feature: spec, API contract (OpenAPI), DB changes, UI frames, acceptance tests. The spec is the input the AI agents build from.', 'Approved by PO and architect before its train starts', '9, 13'],
    ['2.7–2.10', 'F3 Shared identity (R1)', 'Identity service with OIDC clients per app; OTP-verified linking; roles; KYC status on identity; 1:1 bootstrap; remote switch', 'Existing User App phone/email registering on Partner App links to the same identity, with no duplicate; identity pen test clean', '7.3, 9.1'],
    ['6.1', 'F5 Cancellation & refunds', 'Policy rules; gateway refund API with idempotency; state machine; notifications', 'No double refund under retry; Phase 1 regression green', '8.2, 9.3'],
    ['5.4', 'Duplicate-account merge (R2)', 'Duplicate report; approved merge rules; migration & rollback scripts', 'Dry-run reconciles 100% of records; SportSeek approves (D18)', '7.3, 17'],
    ['7.1', 'F7 Partner model', 'Service-type registry; admin configuration; facility migration; verification per type', 'New type enabled without code; facility partners unaffected', '9.4'],
    ['8.1', 'F9 Transaction Ledger', 'Ingestion + reconciliation; admin screens; exports; refund tracker', 'Every gateway transaction appears within the sync window; exports match gateway exactly', '8.2'],
    ['9.1', 'F11 Split settlement', 'Route linked accounts for all partner types; settlement view on web', 'Test partners of every type receive split settlement in Razorpay test mode', '8.3'],
    ['6.2, 8.2', 'Web application', 'React/Next.js web app for players (R3), organisers & partners (R5)', 'Parity checklist vs mobile signed; browser and accessibility checks pass', '3.1'],
    ['per release', 'KT checklist', 'AI-maintained docs, walkthrough, checklist per release', 'Checklist signed within 5 working days of each go-live', '12.2']], { size: 16 }),
  H1('8. Integrated schedule'),
  ...IMG('gantt_roadmap.png', 620, 'Figure 2 — Phase 2A monthly release train (summary level; all activities in Section 9)'),
];

const s3 = [
  H1n('8. Integrated schedule (continued)'),
  ...IMG('gantt_launch.png', 720, 'Figure 3 — Release R1: day-level plan to the 20 October 2026 public launch'),
  H1('9. Detailed activity schedule'),
  P('Every activity with owner, dates, working-day duration and predecessors. The same data is in the workbook (SRV-SPS-2A-PLN-001a).'),
  ...T([['WBS', 0.55], ['Activity', 5.6], ['Owner', 0.95], ['Start', 0.95], ['Finish', 0.95], ['Days', 0.55], ['Predecessors', 1.5]],
    plan.rows.map(r => r.type === 'S' ? { group: `${r.id}   ${r.name}   (${fmt(r.start)} – ${fmt(r.end)})` } :
      [r.id, r.type === 'M' ? `◆ **${r.name}**` : r.name, r.owner, fmt(r.start), fmt(r.end), r.type === 'M' ? '0' : String(r.days), r.pred.replace(/,/g, ', ') || '—']),
    { width: LAND_W, size: 16 }),
  H1('10. Dependency management'),
  H2('10.1 Dependency types'),
  ...T([['Type', 1.5], ['Meaning', 5], ['How it is managed', 5]], [
    ['FS / SS', 'Finish-to-Start / Start-to-Start between activities', 'Tracked in the schedule; reviewed at every weekly demo'],
    ['Feature → feature', 'A feature needs another feature live first (e.g. F9 Ledger needs F5 refunds)', 'Encoded in the release order (Section 10.2); the order is the plan\'s backbone'],
    ['External (D-n)', 'Input or approval from SportSeek or a SportSeek-contracted third party', 'Dated register (10.3); escalated 5 working days before the need-by date; a late item moves its feature to the next train']], { width: LAND_W }),
  H2('10.2 Feature dependency chain'),
  ...T([['#', 0.5], ['Upstream', 3.2], ['Downstream', 3.2], ['Why', 6]], [
    ['I1', 'Identity decisions (D22, 2 Oct) and HLD & design-system sign-off (23 Oct)', 'F3 (R1); all features from R2', 'Specs and UI are the inputs the AI agents build from'],
    ['I2', 'F3 Shared identity (R1)', 'F4, duplicate merge, F6, F7, F9', 'Roles, login and per-person aggregation all hang off the shared identity'],
    ['I3', 'F4 Push & preferences (R2)', 'F8 Waitlist & edit alerts, F12', 'Waitlist offers and edit alerts are notification-driven'],
    ['I4', 'F5 Cancellation & refunds (R3)', 'F8 (booking states), F9 (refund tracker)', 'The Ledger reflects refunds; waitlist uses freed capacity'],
    ['I5', 'F6 Web app — players (R3)', 'F10 Web app — organisers & partners', 'Shared web shell, auth and design components'],
    ['I6', 'F7 Partner model (R4)', 'F10, F11', 'Partner web journeys and payouts need all partner types'],
    ['I7', 'F9 Ledger (R5)', 'F11 settlement view', 'Settlements shown through the Ledger read model']], { width: LAND_W, size: 16 }),
  H2('10.3 External dependency register (SportSeek and third parties)'),
  ...T([['ID', 0.5], ['Dependency', 5.2], ['Owner', 1.3], ['Need-by', 1.1], ['Unblocks', 1.3], ['Impact if late', 3.2]],
    plan.deps.map(x => [x.id, x.item, x.owner, /\d{4}/.test(x.needby) ? fmt(x.needby) : x.needby, x.impacts, x.ifLate]), { width: LAND_W, size: 16 }),
];

const s4 = [
  H1n('11. Critical path and schedule risk'),
  ...IMG('critical_path.png', 640, 'Figure 4 — Phase 2A critical path'),
  P('In a release train every release date is fixed, so the critical path is the **chain of feature dependencies**: identity (R1) → notifications and duplicate merge (R2) → refunds and web shell (R3) → partner model (R4) → ledger and partner web (R5) → payouts (R6). A slip in an upstream feature pushes its dependants to a later train. The mitigation is to protect the upstream features first. Identity gets the strongest engineers, the earliest decisions (D22) and extra capacity in October, and its remote switch keeps it off the launch\'s critical path.'),
  H2('11.1 Schedule risks'),
  ...T([['Risk', 3.5], ['Likelihood / impact', 1.4], ['Mitigation built into this plan', 5]], [
    ['AI tooling not approved on day one (D21)', 'Low–Medium / High', 'Enterprise-terms tooling and a written AI usage policy offered at kick-off; data-handling rules agreed up front'],
    ['Phase 1 assessment reveals more launch blockers than fit before 14 Oct', 'Medium / High', 'AI-assisted assessment in 3 days; Scope Gate 1 Oct; hardening prioritised over F3, which can be switched off'],
    ['F3 identity has 7 working days of build before the 14 Oct freeze', 'High / High', 'Tightly scoped F3 (Section 5.1); decisions by 2 Oct (D22); +1 .NET and +1 React Native engineer in October; identity pen test 13–16 Oct; remote switch with fallback to Phase 1 login'],
    ['Store review of apps with a new login flow takes longer than the buffer', 'Medium / High', 'Submit 14 Oct; login flow built to store guidelines; F3 is server-switchable, so an approved build can launch with F3 off'],
    ['SportSeek decisions and approvals cannot keep pace with a monthly train', 'Medium / High', '1-day decision / 2-day UI approval agreement (A4); weekly decision log; late items move to next train, not the whole release'],
    ['Third-party approvals (Route, DLT, WhatsApp templates)', 'Medium / Medium', 'Dated in the register months ahead; F11/F12 sit in the last train to maximise lead time'],
    ['AI-generated code quality or security regressions', 'Low–Medium / High', 'Human review of every merge, AI + SAST scans, full regression, targeted pen tests (Delivery Model §5, §14)'],
    ['Year-end holidays reduce R4 capacity', 'High / Low', 'R4 build window extended to 3.5 weeks; holiday calendar agreed at kick-off']], { size: 17 }),
  H1('12. Milestones, gates and acceptance evidence'),
  ...T([['ID', 0.6], ['Milestone / gate', 3.5], ['Date', 1.2], ['Decision owner', 1.3], ['Acceptance evidence', 4.2]], [
    ['1.2', 'Kick-off', '29 Sep 2026', 'Joint', 'Governance charter, AI usage policy, access checklist'],
    ['2.2', 'Launch Scope Gate', '01 Oct 2026', 'SportSeek', 'Assessment report; frozen launch scope incl. F3 scope and fallback; go-live criteria'],
    ['2.18', 'R1 Go/No-Go (launch; F3 on/off)', '19 Oct 2026', 'SportSeek', 'UAT sign-off incl. account-linking scenarios; VAPT and identity pen test clean; load test incl. login/OTP; runbook; store status'],
    ['2.19', 'R1 live — public launch with F3', '20 Oct 2026', 'Joint', 'Production smoke test incl. login and linking; dashboards green'],
    ['3.4 / 3.6', 'HLD and design-system sign-off', '23 Oct 2026', 'SportSeek', 'HLD, ADRs, design system'],
    ['4.4', 'M1 Foundation accepted', '06 Nov 2026', 'SportSeek', 'IaC, CI/CD gates, observability'],
    ['5.6', 'R2 live', '24 Nov 2026', 'SportSeek', 'UAT sign-off; duplicate-merge reconciliation report'],
    ['6.4', 'R3 live', '22 Dec 2026', 'SportSeek', 'UAT sign-off; refund pen test clean'],
    ['7.4', 'R4 live', '27 Jan 2027', 'SportSeek', 'UAT sign-off; facility regression green'],
    ['8.4', 'R5 live', '23 Feb 2027', 'SportSeek', 'UAT sign-off; ledger reconciled to gateway'],
    ['9.5', 'R6 live — Phase 2A complete', '23 Mar 2027', 'SportSeek', 'UAT sign-off; full VAPT with no open critical/high'],
    ['9.9', 'Phase 2A acceptance', '02 Apr 2027', 'SportSeek', 'All SOW §13 deliverables; KT checklists signed']], { size: 17 }),
  H1('13. Anatomy of a monthly release'),
  P('Every release R2–R6 follows the same four-week rhythm, so SportSeek\'s team always knows what happens when.'),
  ...T([['Week', 1], ['Build pod', 4.5], ['SportSeek', 3], ['Gate', 2]], [
    ['Week 1', 'Plan from approved specs; AI agents generate implementation and tests; engineers review daily; next train\'s specs start', 'PO available for clarifications', 'Specs approved (DoR)'],
    ['Week 2', 'Build continues; integration on Staging behind feature flags; weekly demo', 'Weekly demo feedback', '—'],
    ['Week 3', 'Feature complete (Friday); AI-generated regression and security scans; targeted pen test where applicable', 'UI approvals for next train', 'Feature complete'],
    ['Week 4', 'Hardening; UAT support; store submission; runbook update', 'UAT (3 days); Go/No-Go (Mon of release week)', 'UAT sign-off; Go/No-Go'],
    ['Release week', 'Release on Tuesday; one week of hypercare; KT checklist', 'KT checklist sign-off', 'KT signed']], { size: 17 }),
  H1('14. Resource plan: AI-native pod, loading and technical skills'),
  P('A small, senior, AI-augmented pod replaces the four-squad team of the conventional plan. Every engineer is senior enough to judge AI output, because in this model review quality determines product quality. Loading is monthly average FTE; October includes mobilisation from 28 September. SportSeek developers (Section 14.5) are additional.'),
  H2('14.1 Technology stack and the skills it demands'),
  ...T([['Layer', 1.7], ['Technology', 2.6], ['Skills we staff for', 5.7]], [
    ['Mobile apps', 'React Native (TypeScript), iOS and Android', 'OIDC/PKCE on mobile, push (FCM/APNs), deep links, schema-driven forms, store release engineering'],
    ['Back end', '.NET — ASP.NET Core, C#, EF Core with Npgsql', 'Modular monolith, OIDC identity, outbox messaging, Razorpay payments/refunds/Route, idempotent APIs'],
    ['Database', 'PostgreSQL (schema per domain)', 'Expand/contract migrations, JSONB, exclusion constraints, geo search, identity de-duplication'],
    ['Web', 'React + TypeScript, Next.js (proposed)', 'Server rendering for SEO, shared design tokens, data-heavy admin screens'],
    ['AI engineering', 'AI coding agents (e.g. Claude Code) and AI assistants under enterprise terms', 'Spec writing, context engineering, agent guardrails, critical review of generated code and tests'],
    ['Quality & operations', 'xUnit, Testcontainers, Jest, Detox/Maestro, Playwright, k6; IaC; OpenTelemetry', 'AI-generated test suites curated by engineers; CI/CD and observability']], { size: 17 }),
  H2('14.2 Pod composition and technical skills'),
  ...T([['Role', 1.9], ['Seniority', 1], ['Peak FTE', 0.6], ['Person-months', 0.8], ['Key technical skills', 3.6], ['How AI is used in the role', 2.4]],
    res.roles.map(r => [`**${r.role}**`, r.seniority, String(r.peak), String(r.pm), r.skills, r.tools]).concat([['**Total**', '', '', `**${res.pm}**`, '', '']]), { size: 15 }),
];

const s5 = [
  H1n('14. Resource plan (continued)'),
  H2('14.3 Monthly resource loading (FTE)'),
  ...IMG('resource_histogram.png', 780, 'Figure 5 — AI-native pod loading by skill group'),
  ...T([['Role', 3.4]].concat(res.months.map(m => [m, 0.9])).concat([['Person-months', 1.1]]),
    res.roles.map(r => [r.role].concat(r.load.map(v => v ? String(v) : '—')).concat([String(r.pm)]))
      .concat([['**Total Srivin FTE**'].concat(res.total.map(v => `**${v}**`)).concat([`**${res.pm}**`])]), { width: LAND_W, size: 16 }),
  P(`**How the loading follows the plan:** October carries the launch (hardening, regression, VAPT, load test) and F3 Shared Identity, with one extra .NET and one extra React Native engineer for identity, alongside AI-assisted discovery, at ${res.total[0]} FTE. From November a steady pod of about 10–11 FTE runs the monthly train. Specialists (security, performance) join for the releases that need them. April is acceptance and handover only. SportSeek developers who have worked in the pod take over module ownership as Srivin rolls off.`),
  L.BR(),
  H2('14.4 Resource-to-WBS assignment matrix'),
  P('● = primary responsibility; ○ = supporting or reviewing. Columns are the Level 1 WBS elements (Section 7.1).'),
  ...(() => {
    const cols = ['1 PM', '2 R1 Launch', '3 Design', '4 Found.', '5 R2', '6 R3', '7 R4', '8 R5', '9 R6', '10 Support'];
    const M = {
      'Delivery Lead / TPM (AI-native delivery)': 'PPssPPPPPs', 'Solution Architect & AI Engineering Lead': 'sPPPPPPPPs', 'Product Analyst (AI-assisted BA)': '-sP-PPPPP-',
      'Product Designer (UX/UI)': '--P-sPsPs-', 'Senior .NET Engineer (AI-augmented)': '-PsPPPPPPP', '.NET & PostgreSQL Engineer (AI-augmented)': '-sssPPPPPs',
      'Senior React Native Engineer (AI-augmented)': '-Ps-PsPssP', 'Senior React / Next.js Engineer (AI-augmented)': '--s--P-PP-', 'QA Automation Engineer (AI-assisted)': '-PssPPPPPs',
      'DevOps / SRE Engineer': '-P-PssssPP', 'Security Engineer (VAPT, on demand)': '-P--PP--P-', 'Performance Engineer (on demand)': '-P-----PP-' };
    Object.entries(M).forEach(([k, v]) => { if (v.length !== 10) throw new Error('matrix width ' + k); });
    return T([['Role', 3.4]].concat(cols.map(c => [c, 0.95])), res.roles.map(r => [r.role].concat([...M[r.role]].map(ch => ch === 'P' ? '●' : ch === 's' ? '○' : ''))), { width: LAND_W, size: 15 });
  })(),
];

const s6 = [
  H1n('14. Resource plan (continued)'),
  H2('14.5 SportSeek-provided resources'),
  ...T([['Role', 2.4], ['Number', 1.3], ['When', 2.4], ['Responsibilities', 4]], [
    ['Product Owner', '1 (named)', 'Throughout; decisions within 1 working day', 'Backlog priority, spec approval, acceptance, SOW open items'],
    ['Technical reviewer', '1 (part-time)', 'HLD, ADRs, weekly demo', '.NET / PostgreSQL / React Native review of designs'],
    ['SportSeek developers', '2 recommended (D9)', 'From R2 (26 Oct 2026)', 'Full pod members working with AI agents; become module owners after handover'],
    ['UAT testers', '2 recommended', 'Hardening week of every release; 15–19 Oct for R1', 'Business scenario testing across User, Partner, Admin and Web'],
    ['Operations lead', '1', 'From R3', 'Receives infrastructure handover (SOW §15.1)'],
    ['Legal / compliance', 'As needed', 'By 9 Oct; per release as needed', 'Privacy, DPDP, refund policy, AI usage approval']], { size: 17 }),
  H2('14.6 Continuity and roll-off'),
  ...B(['**Named, senior, stable pod**: the Delivery Lead, Architect, .NET, React Native and QA engineers stay for the whole engagement. Any change needs SportSeek notice and a two-week overlap.',
    '**Two-deep on critical skills**: .NET identity, PostgreSQL migrations, React Native releases and Razorpay integration are each held by at least two people across Srivin and SportSeek by R3.',
    '**Roll-off after sign-off**: engineers roll off only after the KT checklist for their features is signed. SportSeek keeps the AI-maintained documentation and the codebase assistant (Delivery Model §15).']),
  H1('15. Baseline control and re-planning rules'),
  ...B(['**Baselines**: this plan is Baseline 0 (v2.0). **Baseline 1** is set at the R2 release review (24 Nov 2026), using measured AI-assisted velocity from the first build cycle.',
    '**Tolerances**: release dates do not move. If a feature is forecast to miss its train, the PO decides within 2 working days whether to move it to the next train or swap in a later feature of similar size.',
    '**Change**: new scope follows SOW §18 (written request → impact assessment in 5 business days → SportSeek approval) and is slotted into a future train.',
    '**Reporting**: weekly demo and status (features on track per train, dependency register, RAID), plus a monthly release review with the sponsor.']),
  H1('Appendix A. SOW-to-WBS traceability'),
  ...T([['SOW reference', 3], ['Requirement', 4.5], ['Feature / WBS', 2.5]], [
    ['§3.1 Shared Identity; §7; §9.1 (M2)', 'Unified accounts, linking, roles, KYC reuse', 'F3 (2.6–2.10, R1); 5.4'],
    ['§3.1 Transaction Ledger; §8 (M3)', 'Ledger dashboard, statements, refunds, partner view', 'F9 (8.1); F11 (9.1)'],
    ['§3.1 Booking/Events; §9.3 (M4)', 'Cancellation, waitlist, edit alerts, data model, import tools', 'F5 (6.1); F8 (7.2); 9.3; 2.5'],
    ['§3.1 Partner & Service; §9.4 (M5)', 'Generalised service types; admin configuration', 'F7 (7.1); F11 (9.1)'],
    ['§3.1 Notification; §10 (M6)', 'Push, WhatsApp, Email; alert catalog', 'F1, F2 (5.1–5.2); F4 (5.3); F12 (9.2)'],
    ['§3.1 Web application', 'Web app for all existing functionality', 'F6 (6.2); F10 (8.2)'],
    ['§6.2 NFRs', 'Security, performance, availability, DPDP, environments, observability', '2.3, 2.6, 2.7, 4.x, all hardening WPs'],
    ['§12.1 M1', 'Foundation', '2.3, 4.1–4.4'],
    ['§12.2 KT', 'KT after every milestone with checklist', 'KT per release (5.7, 6.5, 7.5, 8.5), 9.8'],
    ['§13 Deliverables', 'Code, HLD/LLD, stories/tests, API docs, ERD, architecture, UI files, test suite, CI/CD, runbook, user docs, KT', '3.x, 4.2, 9.7, all feature WPs'],
    ['§14 Acceptance', 'Technical and functional acceptance', 'Hardening + Go/No-Go per release; 9.9'],
    ['§15.1 Infra transition', 'Operate-then-handover', '9.7'],
    ['§16 Warranty & support', '90-day warranty; Phase 1 support', '10.1, 10.2'],
    ['§18 Change management', 'Change process', '1.5']], { size: 17 }),
];

build({ out: OUT, title: 'SportSeek Phase 2A — WBS & Integrated Project Plan', subtitle: 'WBS, schedule and dependencies', short: 'WBS & Integrated Project Plan',
  sections: [{ cover: true, children: s1 }, { children: s2 }, { landscape: true, children: s3 }, { children: s4 }, { landscape: true, children: s5 }, { children: s6 }] });
