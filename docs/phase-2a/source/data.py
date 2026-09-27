import json, datetime as dt
D=lambda s: dt.date(*map(int,s.split('-')))
def wd(a,b):
    a,b=D(a),D(b); n=0
    while a<=b:
        if a.weekday()<5: n+=1
        a+=dt.timedelta(1)
    return n
# (id, name, owner, start, end, predecessors, stream, type)  type: T task, M milestone, S summary
R=[]
def S(i,n,s,e,st): R.append(dict(id=i,name=n,owner='',start=s,end=e,pred='',stream=st,type='S'))
def T(i,n,o,s,e,p,st): R.append(dict(id=i,name=n,owner=o,start=s,end=e,pred=p,stream=st,type='T'))
def M(i,n,o,d,p,st): R.append(dict(id=i,name=n,owner=o,start=d,end=d,pred=p,stream=st,type='M'))

S('1','Programme Management & AI Delivery Governance','2026-09-28','2027-04-09','pm')
T('1.1','Mobilisation: NDA, SOW/PO, access; AI toolchain set up under SportSeek-approved terms (D21)','Joint','2026-09-28','2026-09-30','','pm')
M('1.2','Kick-off workshop (SportSeek + Srivin)','Joint','2026-09-29','1.1SS','pm')
T('1.3','Release-train plan, RAID log, governance charter, AI usage policy','Srivin','2026-09-29','2026-10-02','1.2','pm')
T('1.4','Governance cadence: daily stand-up, weekly demo & status, monthly release review / steering','Srivin','2026-09-30','2027-04-09','1.2','pm')
T('1.5','Change control (SOW Section 18) — ongoing; scope flexes between trains, dates do not','Joint','2026-09-30','2027-04-09','1.2','pm')
T('1.6','Phase 2A closure: completion report, lessons learned, Phase 2B readiness','Joint','2027-04-05','2027-04-09','9.9','pm')

S('2','Release R1 — Public Launch + F1, F2 (20 Oct 2026)','2026-09-29','2026-11-06','launch')
T('2.1','AI-assisted Phase 1 assessment: codebase map, ERD, API inventory, dependency & security scan, defect triage','Srivin','2026-09-29','2026-10-01','1.2,D2','launch')
M('2.2','Launch Scope Gate: launch scope, go-live criteria, F1/F2 confirmed','SportSeek','2026-10-01','2.1','launch')
T('2.3','Environment, CI/CD & observability refinement (launch-critical)','Srivin','2026-09-30','2026-10-09','1.2','launch')
T('2.4','AI-generated regression suite for all live Phase 1 journeys (API + mobile)','Srivin','2026-10-01','2026-10-13','2.1SS','launch')
T('2.5','Remediation of critical/high Phase 1 defects in launch scope','Joint','2026-10-05','2026-10-14','2.2','launch')
T('2.6','Security baseline: SAST, dependency & DAST scans; VAPT of launch surface','Srivin','2026-10-05','2026-10-13','2.2','launch')
T('2.7','Performance / load test at SportSeek-defined launch concurrency','Srivin','2026-10-07','2026-10-13','2.3SS,D5','launch')
T('2.8','Store & compliance readiness: listings, privacy policy, DPDP notice/consent, account deletion','Joint','2026-10-05','2026-10-12','2.2,D6','launch')
T('2.9','F1 — Email notifications for all live alert triggers (booking, registration, payment)','Srivin','2026-10-05','2026-10-14','2.2,D14','launch')
T('2.10','F2 — Booking & event reminders (T-24h, T-2h) by Email/SMS','Srivin','2026-10-05','2026-10-14','2.2,D12','launch')
M('2.11','Code freeze & Release Candidate','Srivin','2026-10-14','2.5,2.9,2.10','launch')
T('2.12','App store submissions & review window','Joint','2026-10-14','2026-10-19','2.11,2.8','launch')
T('2.13','Full regression + VAPT retest + UAT by SportSeek testers','Joint','2026-10-15','2026-10-19','2.11','launch')
T('2.14','Launch runbook, rollback plan, on-call rota, war-room','Srivin','2026-10-12','2026-10-16','2.3','launch')
M('2.15','Go / No-Go','SportSeek','2026-10-19','2.12,2.13,2.14','launch')
M('2.16','R1 LIVE — public launch with F1 and F2','Joint','2026-10-20','2.15','launch')
T('2.17','Hypercare (daily triage, extended monitoring)','Srivin','2026-10-20','2026-11-06','2.16','launch')

S('3','Discovery, Architecture & Design (AI-assisted, runs alongside launch)','2026-10-05','2027-02-26','design')
T('3.1','AI-generated as-is documentation: architecture, ERD, API catalogue, integration map','Srivin','2026-10-05','2026-10-09','2.1','design')
T('3.2','Story mapping for F3–F12; AI-drafted stories & acceptance criteria refined with PO','Joint','2026-10-05','2026-10-16','3.1SS,D8','design')
T('3.3','HLD & ADRs (identity, event bus, service-type model, web framework)','Srivin','2026-10-12','2026-10-23','3.1','design')
M('3.4','HLD sign-off','SportSeek','2026-10-23','3.3','design')
T('3.5','Design system (atomic) with AI-assisted exploration; tokens shared by mobile & web','Srivin','2026-10-05','2026-10-23','3.2SS','design')
M('3.6','Design system approval','SportSeek','2026-10-23','3.5','design')
T('3.7','Feature specs, UI and LLD — produced one train ahead of build (spec-driven development)','Joint','2026-10-19','2027-02-26','3.3SS','design')
T('3.8','Closure of SOW open items (ledger visibility, alert catalog, SLAs, NFRs, refund policy, Route)','SportSeek','2026-10-05','2027-01-08','D10,D11,D15,D16,D20','design')

S('4','Platform Foundation (M1) — built in the first build cycle','2026-10-19','2026-11-06','identity')
T('4.1','Infrastructure-as-Code; Dev / Staging / Prod promotion','Srivin','2026-10-19','2026-10-30','3.3SS','identity')
T('4.2','CI/CD quality gates incl. AI code review, SAST, dependency & secret scanning, coverage','Srivin','2026-10-19','2026-10-30','3.3SS','identity')
T('4.3','Event bus (transactional outbox), API Gateway/BFF, feature-flag service','Srivin','2026-10-26','2026-11-06','3.4','identity')
M('4.4','M1 Foundation accepted','SportSeek','2026-11-06','4.1,4.2,4.3','identity')

S('5','Release R2 — F3 Shared Identity, F4 Push & Preferences (24 Nov 2026)','2026-10-26','2026-11-30','identity')
T('5.1','F3 — Shared identity: OIDC clients per app, OTP-verified account linking, multi-role, KYC reuse','Joint','2026-10-26','2026-11-13','3.4,3.6','identity')
T('5.2','F4 — Push notifications (FCM/APNs) + role-scoped notification preferences','Srivin','2026-10-26','2026-11-13','3.4,D14','notif')
T('5.3','Hardening: regression, targeted pen test on identity, UAT; store submission','Joint','2026-11-16','2026-11-20','5.1,5.2','release')
M('5.4','R2 LIVE — F3, F4','Joint','2026-11-24','5.3','release')
T('5.5','Hypercare + KT checklist sign-off (R2)','Srivin','2026-11-24','2026-11-30','5.4','release')

S('6','Release R3 — F5 Cancellation & Refunds, F6 Web App (Players) (22 Dec 2026)','2026-11-25','2026-12-29','booking')
T('6.1','F5 — Cancellation & refunds for bookings and tournament registrations (gateway refund API, policy rules)','Srivin','2026-11-25','2026-12-11','5.4,D11','booking')
T('6.2','F6 — Web app for players: search, availability, booking, event registration, payments','Srivin','2026-11-25','2026-12-11','5.4,3.6','web')
T('6.3','Enabler — reconciliation & migration of existing duplicate accounts','Joint','2026-11-25','2026-12-11','5.4,D18','identity')
T('6.4','Hardening: regression, targeted pen test on refunds, UAT; store submission','Joint','2026-12-14','2026-12-18','6.1,6.2,6.3','release')
M('6.5','R3 LIVE — F5, F6','Joint','2026-12-22','6.4','release')
T('6.6','Hypercare + KT checklist sign-off (R3)','Srivin','2026-12-22','2026-12-29','6.5','release')

S('7','Release R4 — F7 Generalised Partner Model, F8 Waitlist & Edit Alerts (27 Jan 2027)','2026-12-23','2027-02-02','partner')
T('7.1','F7 — Generalised partner/service model; coach, physio, nutritionist enabled by admin configuration','Srivin','2026-12-23','2027-01-15','6.5','partner')
T('7.2','F8 — Waitlist with time-boxed offers + event-edited-after-publish notifications','Srivin','2026-12-23','2027-01-15','6.5','booking')
T('7.3','Hardening: facility regression, UAT; store submission (reduced capacity over year-end)','Joint','2027-01-18','2027-01-22','7.1,7.2','release')
M('7.4','R4 LIVE — F7, F8','Joint','2027-01-27','7.3','release')
T('7.5','Hypercare + KT checklist sign-off (R4)','Srivin','2027-01-27','2027-02-02','7.4','release')

S('8','Release R5 — F9 Transaction Ledger, F10 Web App (Organisers & Partners) (23 Feb 2027)','2027-01-28','2027-03-02','ledger')
T('8.1','F9 — Transaction Ledger: webhook ingestion + reconciliation, admin history/detail, PDF/CSV export, refund tracker','Srivin','2027-01-28','2027-02-12','7.4,D15','ledger')
T('8.2','F10 — Web app for organisers & partners: events, tournaments, scoring, service & booking management','Srivin','2027-01-28','2027-02-12','7.4','web')
T('8.3','Hardening: reconciliation check vs gateway, UAT; store submission','Joint','2027-02-15','2027-02-19','8.1,8.2','release')
M('8.4','R5 LIVE — F9, F10','Joint','2027-02-23','8.3','release')
T('8.5','Hypercare + KT checklist sign-off (R5)','Srivin','2027-02-23','2027-03-02','8.4','release')

S('9','Release R6 — F11 Split Settlement & Partner Payouts, F12 WhatsApp & Full Alert Catalog (23 Mar 2027)','2027-02-24','2027-04-09','notif')
T('9.1','F11 — Razorpay Route onboarding for all partner types + partner settlement view (web)','Srivin','2027-02-24','2027-03-12','8.4,D10','partner')
T('9.2','F12 — WhatsApp channel + full SOW Section 10.2 alert catalog','Srivin','2027-02-24','2027-03-12','8.4,D13','notif')
T('9.3','Enabler — offline import tools for completed-event data','Srivin','2027-02-24','2027-03-05','8.4,D19','booking')
T('9.4','Hardening: full end-to-end regression, performance test, full VAPT (pre-completion), UAT','Joint','2027-03-15','2027-03-19','9.1,9.2,9.3','release')
M('9.5','R6 LIVE — F11, F12 — PHASE 2A COMPLETE','Joint','2027-03-23','9.4','release')
T('9.6','Hypercare','Srivin','2027-03-23','2027-04-02','9.5','release')
T('9.7','Infrastructure operations runbook & transition plan (SOW 15.1)','Srivin','2027-03-08','2027-03-26','9.1SS','release')
T('9.8','Final KT: platform operations and architecture walkthrough','Srivin','2027-03-24','2027-04-02','9.5','release')
M('9.9','Phase 2A acceptance & KT checklist sign-off','SportSeek','2027-04-02','9.7,9.8','release')

S('10','Continuous Support Obligations','2026-10-20','2027-06-21','release')
T('10.1','Phase 1 production monitoring & bug fixes (SOW Section 16)','Srivin','2026-10-20','2027-04-09','2.16','release')
T('10.2','90-day warranty per release (R1 → 18 Jan 2027 … R6 → 21 Jun 2027)','Srivin','2026-10-20','2027-06-21','2.16','release')
for r in R:
    r['days']=0 if r['type']=='M' else wd(r['start'],r['end'])

# External dependencies on SportSeek / third parties
DEP=[
('D1','Mutual NDA and SOW/PO executed','SportSeek','2026-09-29','1.1','Start of all work'),
('D2','Phase 1 source code, DB schema, API docs; cloud, repo, store-console and gateway dashboard access','SportSeek','2026-09-29','2.1, 3.1','Launch assessment cannot start'),
('D3','Named Product Owner (decisions within 1 working day); UAT testers for the last week of every release','SportSeek','2026-09-29','2.2, all UAT','Release slips to next train'),
('D4','Launch scope and go-live criteria sign-off','SportSeek','2026-10-01','2.2','Freeze date at risk'),
('D5','Expected launch peak concurrent users (load-test target)','SportSeek','2026-10-05','2.7','Load test runs against an assumed figure'),
('D6','Legal content: privacy policy, terms, DPDP notice text, store listing copy & assets','SportSeek','2026-10-09','2.8, 2.12','Store submission blocked'),
('D7','Apple App Store & Google Play developer accounts (SportSeek-owned) with release rights','SportSeek','2026-09-29','2.12','Store submission blocked'),
('D8','Requirement tool decision (JIRA or Trello) and workspace','SportSeek','2026-10-02','3.2','Backlog managed off-tool temporarily'),
('D9','Names of SportSeek developers joining the pod (2 recommended)','SportSeek','2026-10-23','R2 onward','Capacity plan re-baselined'),
('D10','Written confirmation that Razorpay Route (split settlement) is enabled for coach, physio and nutritionist partner categories','SportSeek / Razorpay','2026-11-06','9.1','F11 moves to a later train; SOW 8.3 compliance design unconfirmed'),
('D11','Refund & cancellation business policy (approver, timeframes, non-refundable items)','SportSeek','2026-11-13','6.1','F5 moves to a later train'),
('D12','Email/SMS templates for F1–F2 (SMS templates registered on DLT); full alert catalog and templates by 8 Jan 2027','SportSeek','2026-10-05','2.9, 2.10, 9.2','F2 SMS reminders ship as email-only; F12 slips'),
('D13','WhatsApp Business Solution Provider contract; Meta-approved message templates','SportSeek','2027-02-05','9.2','WhatsApp part of F12 slips to next train'),
('D14','Email provider account (by 5 Oct) and FCM/APNs credentials (by 30 Oct) in SportSeek accounts','SportSeek','2026-10-05','2.9, 5.2','F1 or F4 slips'),
('D15','Decision: Transaction Ledger in Admin + partner web only, or also in User/Partner apps (SOW 8.1 open item)','SportSeek','2027-01-08','8.1','Ledger scope unconfirmed'),
('D16','Warranty SLA numbers (acknowledge/resolve times) — SOW Section 16 open item','SportSeek','2026-10-30','Support model','Default proposal applies'),
('D17','UI/UX approvals turned around within 2 working days of submission','SportSeek','Rolling','3.6, 3.7','Feature rides the next train'),
('D18','Approval of account-merge rules for existing duplicate identities','SportSeek','2026-11-20','6.3','Identity migration moves to R4'),
('D19','Historical completed-event data files for import','SportSeek','2027-02-19','9.3','Import tool tested with synthetic data only'),
('D20','Phase 2A NFR targets: API p95 latency, peak concurrency, uptime SLA','SportSeek','2026-10-30','3.3, all hardening','Performance acceptance undefined'),
('D21','Approval of Srivin\'s AI tooling on SportSeek code (enterprise terms, no training on client data, data-handling rules)','SportSeek','2026-09-29','All','Delivery falls back to conventional pace and team size'),
]
json.dump(dict(rows=R,deps=[dict(zip(['id','item','owner','needby','impacts','ifLate'],d)) for d in DEP]),open('plan.json','w'),indent=1)
# sanity: weekends
bad=[r['id'] for r in R if D(r['start']).weekday()>4 or D(r['end']).weekday()>4 or D(r['end'])<D(r['start'])]
print(len(R),'rows; weekend/order issues:',bad)
