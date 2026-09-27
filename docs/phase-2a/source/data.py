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

S('1','Programme Management & Governance','2026-09-28','2027-06-04','pm')
T('1.1','Mobilisation: NDA, SOW/PO execution, team onboarding, access provisioning','Joint','2026-09-28','2026-09-30','','pm')
M('1.2','Kick-off workshop (SportSeek + Srivin)','Joint','2026-09-29','1.1SS','pm')
T('1.3','Integrated plan, RAID log, communication plan, governance charter','Srivin','2026-09-29','2026-10-09','1.2','pm')
T('1.4','Governance cadence: daily stand-ups, weekly status, fortnightly demos, monthly steering','Srivin','2026-09-30','2027-06-04','1.2','pm')
T('1.5','Change control (per SOW Section 18) — ongoing','Joint','2026-09-30','2027-06-04','1.2','pm')
M('1.6','Phase 2A plan re-baseline & milestone costing sign-off','SportSeek','2026-11-13','3.4FS,3.3FS','pm')
T('1.7','Phase 2A closure: completion report, lessons learned, handover sign-off','Joint','2027-05-31','2027-06-04','13.9','pm')

S('2','Release 2A.0 — Public Launch (20 Oct 2026)','2026-09-29','2026-11-13','launch')
T('2.1','Phase 1 technical & launch-readiness assessment (code, infra, security, data, defects)','Srivin','2026-09-29','2026-10-01','1.2','launch')
M('2.2','Launch Scope Gate: launch scope, go-live criteria & quick-win list frozen','SportSeek','2026-10-01','2.1','launch')
T('2.3','Environment, CI/CD & observability refinement (M1, launch-critical subset)','Srivin','2026-09-30','2026-10-09','1.2','launch')
T('2.4','Remediation of critical/high Phase 1 defects in launch scope','Joint','2026-10-05','2026-10-14','2.2','launch')
T('2.5','Security baseline: SAST, dependency & DAST scans; VAPT of launch surface','Srivin','2026-10-05','2026-10-13','2.2','launch')
T('2.6','Performance / load test at SportSeek-defined launch concurrency','Srivin','2026-10-07','2026-10-13','2.3SS,D5','launch')
T('2.7','Store & compliance readiness: listings, privacy policy, DPDP notice/consent, account deletion check','Joint','2026-10-05','2026-10-12','2.2,D6','launch')
T('2.8','Gate-approved quick wins (only items that fit the freeze date)','Joint','2026-10-05','2026-10-14','2.2','launch')
M('2.9','Code freeze & Release Candidate build','Srivin','2026-10-14','2.4,2.8','launch')
T('2.10','App store submissions & review window (buffer to 19 Oct)','Joint','2026-10-14','2026-10-19','2.9,2.7','launch')
T('2.11','Full regression + VAPT retest + UAT by SportSeek testers','Joint','2026-10-15','2026-10-19','2.9','launch')
T('2.12','Launch runbook, rollback plan, on-call rota, war-room set-up','Srivin','2026-10-12','2026-10-16','2.3','launch')
M('2.13','Go / No-Go decision','SportSeek','2026-10-19','2.10,2.11,2.12','launch')
M('2.14','PUBLIC LAUNCH — Release 2A.0 live','Joint','2026-10-20','2.13','launch')
T('2.15','Hypercare (daily triage, extended monitoring)','Srivin','2026-10-20','2026-11-13','2.14','launch')
T('2.16','KT-0: launch operations, runbook & monitoring walkthrough','Srivin','2026-11-02','2026-11-13','2.14','launch')

S('3','Phase 2A Discovery, Architecture & Design','2026-10-05','2027-01-29','design')
T('3.1','Phase 1 deep-dive: codebase, data model, APIs, integrations','Srivin','2026-10-05','2026-10-16','1.1,D2','design')
T('3.2','Requirement workshops per module; user stories & acceptance criteria in SportSeek tool','Joint','2026-10-12','2026-11-06','3.1SS,D8','design')
T('3.3','Closure of open items flagged in SOW (ledger visibility, alert catalog, SLAs, perf targets, refund policy, Route enablement)','SportSeek','2026-10-05','2026-11-06','D10,D11,D15,D16,D20','design')
T('3.4','High-Level Design: target architecture, ADRs, integration & security design','Srivin','2026-10-19','2026-11-06','3.1','design')
M('3.5','HLD sign-off','SportSeek','2026-11-13','3.4','design')
T('3.6','UX research, design system (atomic: atoms → templates), colour & typography','Srivin','2026-10-12','2026-11-20','3.2SS','design')
M('3.7','Design system approval','SportSeek','2026-11-20','3.6','design')
T('3.8','Module wireframes & UI — one sprint ahead of build (Identity → Notifications → Partner → Booking → Ledger)','Srivin','2026-10-26','2027-01-22','3.6SS','design')
T('3.9','Web application UX (responsive layouts for all Phase 1 journeys)','Srivin','2026-11-16','2027-01-29','3.6SS','design')
T('3.10','Low-Level Design per module — one sprint ahead of build','Srivin','2026-11-09','2027-01-29','3.4','design')
T('3.11','Test strategy & automation approach sign-off','Srivin','2026-11-02','2026-11-13','3.4SS','design')

S('4','Platform Foundation (M1 — refine)','2026-11-16','2026-12-11','identity')
T('4.1','Infrastructure-as-Code; Dev / Staging / Prod promotion process','Srivin','2026-11-16','2026-11-27','3.5','identity')
T('4.2','CI/CD quality gates: tests, coverage, SAST, dependency & secret scanning','Srivin','2026-11-16','2026-11-27','3.5','identity')
T('4.3','Async event bus foundation (transactional outbox)','Srivin','2026-11-16','2026-11-27','3.5','identity')
T('4.4','API Gateway / BFF with app-scoped tokens','Srivin','2026-11-16','2026-12-11','3.5','identity')
T('4.5','Observability: tracing, dashboards, alerting','Srivin','2026-11-16','2026-11-27','2.3','identity')
M('4.6','M1 complete — Foundation accepted','SportSeek','2026-11-27','4.1,4.2,4.3,4.5','identity')

S('5','M2 — Shared Identity','2026-11-16','2027-01-08','identity')
T('5.1','Identity service core; User, Partner, Admin registered as separate OAuth2/OIDC clients','Srivin','2026-11-16','2026-12-11','3.5','identity')
T('5.2','Registration, OTP & login refactor on User, Partner and Admin clients','Joint','2026-11-16','2026-12-25','5.1SS','identity')
T('5.3','Account-linking flow (detect existing phone/email; add role, never duplicate)','Srivin','2026-11-30','2026-12-25','5.1SS','identity')
T('5.4','Role management (multi-role identity; role-scoped data)','Srivin','2026-11-30','2026-12-25','5.1SS','identity')
T('5.5','KYC/verification attached to identity and reused across roles','Srivin','2026-12-14','2026-12-25','5.4SS','identity')
T('5.6','Profile management; credential changes applied to the one shared account','Srivin','2026-12-14','2026-12-25','5.1','identity')
T('5.7','Existing-account reconciliation & migration (duplicate detection, merge rules)','Joint','2026-12-14','2027-01-08','5.3SS,D18','identity')
T('5.8','Backward compatibility for live app versions; forced-upgrade strategy','Srivin','2026-12-28','2027-01-08','5.2','identity')
M('5.9','M2 build complete','Srivin','2027-01-08','5.2,5.3,5.4,5.5,5.6,5.7,5.8','identity')

S('6','M6 — Notification Platform Expansion','2026-11-30','2027-02-05','notif')
T('6.1','Notification service core: template management & versioning, routing, delivery tracking','Srivin','2026-11-30','2026-12-25','4.3,D12','notif')
T('6.2','Push channel (FCM / APNs)','Srivin','2026-12-14','2026-12-25','6.1SS,D14','notif')
T('6.3','Email channel (SportSeek-contracted provider)','Srivin','2026-12-14','2026-12-25','6.1SS,D14','notif')
T('6.4','Role-scoped notification preferences; cross-app deep links with app-switch handling','Srivin','2026-12-28','2027-01-08','6.1,5.4','notif')
M('6.5','Notification core build complete (ships in 2A.1)','Srivin','2027-01-08','6.1,6.2,6.3,6.4','notif')
T('6.6','WhatsApp channel via SportSeek-contracted BSP; approved templates','Srivin','2027-01-11','2027-01-22','6.5,D13','notif')
T('6.7','Alert catalog triggers (SOW Section 10.2) wired to domain events','Srivin','2027-01-11','2027-02-05','6.5,D12','notif')

S('7','M5 — Generalised Partner & Service Model','2026-12-28','2027-02-19','partner')
T('7.1','Service-type registry & data model (shared + type-specific fields)','Srivin','2026-12-28','2027-01-08','3.10SS,5.4','partner')
T('7.2','Migration of existing facilities to the generalised model (zero regression)','Srivin','2027-01-04','2027-01-22','7.1SS','partner')
T('7.3','Admin configuration to enable new service types without code','Srivin','2027-01-11','2027-01-22','7.1','partner')
T('7.4','Partner App onboarding for coach, physio and nutritionist service types','Joint','2027-01-11','2027-02-05','7.1,5.9','partner')
T('7.5','Verification workflow per service type (Admin Portal)','Srivin','2027-01-25','2027-02-05','7.3','partner')
T('7.6','Partner KYC/payout fields; Razorpay Route linked-account onboarding','Srivin','2027-01-25','2027-02-19','7.4SS,D10','partner')
T('7.7','Verified services visible in User App listings','Srivin','2027-02-08','2027-02-19','7.5','partner')
M('7.8','M5 build complete','Srivin','2027-02-19','7.2,7.4,7.5,7.6,7.7','partner')

S('8','M4 — Booking, Events & Tournaments Hardening','2027-01-11','2027-03-05','booking')
T('8.1','Consistent event/tournament data model aligned with Partner/Service model','Srivin','2027-01-11','2027-01-15','7.1','booking')
T('8.2','Booking cancellation & refund flow (gateway refund API; policy rules)','Srivin','2027-01-11','2027-01-29','8.1SS,D11','booking')
T('8.3','Tournament registration cancellation & refund','Srivin','2027-01-25','2027-02-05','8.2SS','booking')
T('8.4','Waitlist for full slots/tournaments with time-boxed offers','Srivin','2027-01-25','2027-02-19','8.1,6.5','booking')
T('8.5','Event-edited-after-publish notifications to registered users','Srivin','2027-02-08','2027-02-19','6.7','booking')
T('8.6','Offline data import tools for completed-event data (validation, dry-run)','Srivin','2027-02-22','2027-03-05','8.1,D19','booking')
M('8.7','M4 build complete','Srivin','2027-02-19','8.2,8.3,8.4,8.5','booking')

S('9','Release 2A.1 — Shared Identity + Notification Core','2027-01-11','2027-04-27','release')
T('9.1','System integration test, regression & security scan','Srivin','2027-01-11','2027-01-15','5.9,6.5','release')
T('9.2','UAT by SportSeek testers; defect fixes','Joint','2027-01-18','2027-01-22','9.1','release')
M('9.3','Go / No-Go 2A.1','SportSeek','2027-01-25','9.2','release')
M('9.4','Release 2A.1 live (identity migration executed)','Joint','2027-01-27','9.3','release')
T('9.5','KT-1: Identity & Notification (checklist sign-off)','Srivin','2027-01-27','2027-02-09','9.4','release')
T('9.6','90-day warranty — 2A.1','Srivin','2027-01-27','2027-04-27','9.4','release')

S('10','Release 2A.2 — Partner Generalisation + Booking Hardening + Multi-channel','2027-02-22','2027-06-14','release')
T('10.1','SIT, regression, performance test & VAPT','Srivin','2027-02-22','2027-03-05','7.8,8.7,6.7','release')
T('10.2','UAT by SportSeek testers; defect fixes','Joint','2027-03-08','2027-03-12','10.1','release')
M('10.3','Go / No-Go 2A.2','SportSeek','2027-03-15','10.2','release')
M('10.4','Release 2A.2 live','Joint','2027-03-16','10.3','release')
T('10.5','KT-2: Partner/Service, Booking hardening, Notifications','Srivin','2027-03-16','2027-03-30','10.4','release')
T('10.6','90-day warranty — 2A.2','Srivin','2027-03-16','2027-06-14','10.4','release')

S('11','M3 — Transaction Ledger','2027-02-08','2027-03-19','ledger')
T('11.1','Gateway data ingestion: webhooks + scheduled reconciliation against Razorpay APIs','Srivin','2027-02-08','2027-02-19','5.9,D10','ledger')
T('11.2','Ledger read model & APIs (idempotent, gateway reference as key)','Srivin','2027-02-08','2027-03-05','11.1SS','ledger')
T('11.3','Admin ledger: history (filters, sort on every column), transaction detail','Srivin','2027-02-22','2027-03-05','11.2SS,3.8','ledger')
T('11.4','Statement export (PDF/CSV) matching gateway records','Srivin','2027-03-01','2027-03-12','11.2SS','ledger')
T('11.5','Refund status tracker','Srivin','2027-03-08','2027-03-19','8.2,11.2','ledger')
T('11.6','Partner settlement view (web application)','Srivin','2027-03-08','2027-03-19','7.6,11.2,12.1','ledger')
M('11.7','M3 build complete — reconciliation verified vs gateway','Srivin','2027-03-19','11.3,11.4,11.5,11.6','ledger')

S('12','Web Application (port of Phase 1 mobile functionality)','2026-11-30','2027-04-02','web')
T('12.1','Web architecture, app shell, authentication against Identity service','Srivin','2026-11-30','2026-12-11','3.7,4.4SS','web')
T('12.2','User journeys: venue search, availability, slot booking, payments','Srivin','2026-12-14','2027-01-22','3.9SS,12.1','web')
T('12.3','Organiser journeys: events, tournaments, registration, scheduling/brackets, scoring','Srivin','2027-01-11','2027-02-19','12.2SS','web')
T('12.4','Partner journeys: facility/service management, bookings, settlements','Srivin','2027-02-08','2027-03-19','7.4,12.1','web')
T('12.5','Web parity for 2A features (identity/roles, preferences, cancellation, waitlist)','Srivin','2027-03-08','2027-03-26','9.4,7.8,8.7','web')
T('12.6','Cross-browser, responsive & accessibility testing; SEO for public pages','Srivin','2027-03-22','2027-04-02','12.5SS','web')
M('12.7','Web application build complete','Srivin','2027-04-02','12.2,12.3,12.4,12.5,12.6','web')

S('13','Release 2A.3 — Transaction Ledger + Web Application (Phase 2A complete)','2027-04-05','2027-08-02','release')
T('13.1','SIT, end-to-end regression, performance test & VAPT (pre-go-live pen test)','Srivin','2027-04-05','2027-04-16','11.7,12.7,8.6','release')
T('13.2','UAT by SportSeek testers; defect fixes','Joint','2027-04-19','2027-04-30','13.1','release')
M('13.3','Go / No-Go 2A.3','SportSeek','2027-05-03','13.2','release')
M('13.4','Release 2A.3 live — PHASE 2A COMPLETE','Joint','2027-05-04','13.3','release')
T('13.5','Hypercare','Srivin','2027-05-04','2027-06-04','13.4','release')
T('13.6','KT-3: Ledger, Web application, full-platform operations','Srivin','2027-05-04','2027-05-21','13.4','release')
T('13.7','Infrastructure operations runbook & transition plan (SOW 15.1)','Srivin','2027-04-19','2027-05-21','13.1','release')
T('13.8','90-day warranty — 2A.3','Srivin','2027-05-04','2027-08-02','13.4','release')
M('13.9','Phase 2A acceptance & KT checklist sign-off','SportSeek','2027-05-28','13.6,13.7','release')

S('14','Continuous Support Obligations','2026-10-20','2027-01-18','release')
T('14.1','Phase 1 production monitoring & bug fixes (SOW Section 16)','Srivin','2026-10-20','2027-06-04','2.14','release')
T('14.2','90-day warranty — 2A.0 launch fixes','Srivin','2026-10-20','2027-01-18','2.14','release')

for r in R:
    r['days']=0 if r['type']=='M' else wd(r['start'],r['end'])

# External dependencies on SportSeek / third parties
DEP=[
('D1','Mutual NDA and SOW/PO executed','SportSeek','2026-09-29','1.1','Start of all work'),
('D2','Phase 1 source code, DB schema, API docs; cloud, repo, store-console and gateway dashboard access','SportSeek','2026-09-29','2.1, 3.1','Launch assessment cannot start'),
('D3','Named Product Owner (decisions within 1 working day during launch window); UAT testers for 15–19 Oct','SportSeek','2026-09-29','2.2, 2.11','Launch gate and UAT slip'),
('D4','Launch scope and go-live criteria sign-off','SportSeek','2026-10-01','2.2','Freeze date at risk'),
('D5','Expected launch peak concurrent users (load-test target)','SportSeek','2026-10-05','2.6','Load test runs against an assumed figure'),
('D6','Legal content: privacy policy, terms, DPDP notice text, store listing copy & assets','SportSeek','2026-10-09','2.7, 2.10','Store submission blocked'),
('D7','Apple App Store & Google Play developer accounts (SportSeek-owned) with release rights','SportSeek','2026-09-29','2.10','Store submission blocked'),
('D8','Requirement tool decision (JIRA or Trello) and workspace','SportSeek','2026-10-05','3.2','Backlog managed off-tool temporarily'),
('D9','Names and availability of SportSeek developers joining the squads','SportSeek','2026-11-13','5.x onward','Capacity plan re-baselined'),
('D10','Written confirmation that Razorpay Route (split settlement) is enabled for coach, physio and nutritionist partner categories','SportSeek / Razorpay','2026-11-06','7.6, 11.x','Ledger compliance-light design cannot be confirmed (SOW 8.3)'),
('D11','Refund & cancellation business policy (approver, timeframes, non-refundable items)','SportSeek','2026-12-11','8.2, 8.3','Refund flows cannot be finalised'),
('D12','Alert catalog confirmed; message templates supplied; new SMS templates registered on DLT','SportSeek','2026-11-27','6.1, 6.7','Triggers ship without approved content'),
('D13','WhatsApp Business Solution Provider contract; Meta-approved message templates','SportSeek','2027-01-08','6.6','WhatsApp channel slips to next release'),
('D14','Email provider and FCM/APNs credentials in SportSeek accounts','SportSeek','2026-11-27','6.2, 6.3','Channel build blocked'),
('D15','Decision: is the Transaction Ledger needed in User/Partner apps, or Admin + partner web only (SOW 8.1 open item)','SportSeek','2026-11-06','3.8, 11.x','Ledger scope unconfirmed'),
('D16','Warranty SLA numbers (acknowledge/resolve times) — SOW Section 16 open item','SportSeek','2026-11-06','Support model','Default proposal applies'),
('D17','UI/UX approvals turned around within 3 working days of submission','SportSeek','Rolling','3.7, 3.8','Build start for that module slips day-for-day'),
('D18','Approval of account-merge rules for existing duplicate identities','SportSeek','2026-12-11','5.7','Identity migration cannot execute'),
('D19','Historical completed-event data files for import','SportSeek','2027-02-05','8.6','Import tool tested with synthetic data only'),
('D20','Phase 2A NFR targets: API p95 latency, peak concurrency, uptime SLA','SportSeek','2026-11-06','3.4, 10.1, 13.1','Performance acceptance undefined'),
]
json.dump(dict(rows=R,deps=[dict(zip(['id','item','owner','needby','impacts','ifLate'],d)) for d in DEP]),open('plan.json','w'),indent=1)
# sanity: weekends
bad=[r['id'] for r in R if D(r['start']).weekday()>4 or D(r['end']).weekday()>4 or D(r['end'])<D(r['start'])]
print(len(R),'rows; weekend/order issues:',bad)
