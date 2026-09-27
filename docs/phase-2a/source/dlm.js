const L = require('./lib');
const { P, H1, H1n, H2, H3, B, N, T, C, IMG, SP, BR, cover, contents, build } = L;
const res = require('./res.json');
const OUT = process.argv[2];
const V = { version: 'v2.0 (AI-native release train)', status: 'Issued for client review — supersedes v1.0' };

const toc = ['1. Purpose and scope', '2. Our understanding of the engagement', '3. Why AI-native, and what it changes', '4. Delivery model at a glance',
  '5. The AI-augmented delivery lifecycle', '6. R1: the 20 October launch', '7. The monthly release train', '8. The AI-native pod', '9. RACI matrix',
  '10. Governance, escalation and decisions', '11. Communication plan', '12. Quality management', '13. Environments, releases and feature flags',
  '14. AI governance: security, confidentiality and IP', '15. Knowledge transfer and transition', '16. Change management', '17. Risk management',
  '18. Hypercare, warranty and support', '19. Delivery metrics', '20. Tooling', '21. Commercial alignment', '22. Our commitments to SportSeek'];

const s1 = cover({ title: 'Project Delivery Model', subtitle: 'How Srivin Platforms delivers SportSeek Phase 2A with an AI-native pod: public launch on 20 October 2026, then two features in production every month', docId: 'SRV-SPS-2A-DLM-002', ...V });

const s2 = [
  ...contents(toc),
  H1('1. Purpose and scope'),
  P('This document sets out how Srivin Platforms will deliver Phase 2A of the SportSeek programme for RacingAhead / SportSeek. It covers the AI-augmented lifecycle, the monthly release train, the pod, governance, the guardrails around AI, quality, knowledge transfer and support. Every ceremony, gate and control described here is one we will run.'),
  P('The schedule, feature catalogue and resource loading are in SRV-SPS-2A-PLN-001 (WBS & Integrated Project Plan). The engineering approach is in SRV-SPS-2A-TAD-003 (Technical Approach). Scope references cite the SportSeek Phase 2 SOW v1.0 as "SOW §n".'),

  H1('2. Our understanding of the engagement'),
  P('Phase 1 is live with a User App, a Partner App and an Admin Web Portal, built on **React Native, .NET and PostgreSQL**, with a payment gateway and SMS alerts already integrated (SOW §2.1). Phase 2A must unify identity, generalise partners, harden bookings, add a Transaction Ledger, expand notifications and deliver a web application (SOW §3.1). It must do so without disrupting a live product, and with SportSeek owning every account, repository and tool (SOW §5, §15).'),
  P('SportSeek chose Srivin for **speed to market**. A plan that simply staffs a large team to a conventional timeline would give SportSeek nothing it could not do in-house. This model is built to put working features in customers\' hands every month, starting on launch day.'),

  H1('3. Why AI-native, and what it changes'),
  ...T([['Conventional delivery', 5], ['Srivin AI-native delivery', 5]], [
    ['Large team; much of the effort goes into writing first-draft code, tests and documents', 'Small senior pod; AI agents produce first drafts, and engineers spend their time on design, review and hard problems'],
    ['Quarterly-style milestones; value arrives late', '**A release every month, two features each**, from 20 Oct 2026'],
    ['Documentation written at the end, often stale', 'Documentation generated and updated with every change; always current'],
    ['KT as a 2–4 week event after each milestone', 'Continuous KT: SportSeek developers work inside the pod; a signed checklist every release'],
    ['Regression testing grows slower as scope grows', 'AI-generated regression suites grow with every feature and run on every merge']]),
  H2('3.1 Principles'),
  ...T([['Principle', 2.6], ['In practice', 7.4]], [
    ['Humans own every outcome', 'AI drafts; a named senior engineer reviews, tests and merges. No AI output reaches production without human review and passing quality gates.'],
    ['Specs before code', 'Every feature starts from an approved specification (story, API contract, data changes, UI, acceptance tests). The spec is what the agents build from, so quality starts upstream.'],
    ['Fixed dates, flexible scope', 'The monthly train always leaves. A feature that is not ready rides the next one behind a feature flag.'],
    ['Production first', 'SportSeek is live with real payments: regression, rollback and monitoring are in place before anything ships.'],
    ['Transparent by default', 'SportSeek sees the same backlog, demos, metrics and AI usage data we do.'],
    ['SportSeek ownership', 'All code, prompts/specs, documentation and AI-generated artefacts are SportSeek\'s (SOW §19). Everything lives in SportSeek\'s accounts.']]),
  ...C('What AI does not speed up, and how we plan for it', 'SportSeek decisions, UI approvals, UAT, app-store review, manual penetration testing and third-party approvals (Razorpay Route, DLT and WhatsApp templates) take the time they take. The plan gives each one a dated slot and a need-by date. When one is late, the affected feature moves to the next train and the release still ships.', 'note'),

  H1('4. Delivery model at a glance'),
  ...IMG('release_train.png', 640, 'Figure 1 — Six monthly releases, twelve features'),
  ...T([['Layer', 2], ['Mechanism', 4], ['Cadence', 2], ['Who decides', 2]], [
    ['Programme', 'Release-train plan, RAID, dependency register, change control', 'Monthly release review', 'Sponsor + Product Owner'],
    ['Release', 'Gates: Specs approved → Feature complete → UAT sign-off → Go/No-Go → KT signed', 'Every month', 'Product Owner'],
    ['Build', 'Weekly cycles inside each train; daily stand-up; weekly demo', 'Weekly', 'Product Owner (priority), pod (how)'],
    ['Launch (R1)', 'War-room with daily triage to 20 Oct', 'Daily', 'Launch Lead + Product Owner']]),
];

const s3 = [
  H1('5. The AI-augmented delivery lifecycle'),
  P('AI is used in every stage, and every stage has a human gate. This table is the core of the model.'),
  ...T([['Stage', 1.5], ['What AI does', 3.4], ['What people do', 3.2], ['Human gate', 1.9]], [
    ['Understand', 'Reads the Phase 1 codebase: architecture map, ERD, API catalogue, dependency and vulnerability scan, defect clustering', 'Architect validates findings and judges risk', 'Assessment accepted at Scope Gate'],
    ['Specify', 'Drafts stories, Given/When/Then criteria, edge cases, API contracts and test cases from the SOW and workshops', 'Analyst and PO challenge, refine and prioritise', 'PO approves spec (Definition of Ready)'],
    ['Design', 'Explores layouts and copy within the design system; exports tokens to code', 'Designer leads; usability checks with users', 'SportSeek UI approval (2 working days)'],
    ['Build', 'Coding agents implement from the spec and generate unit tests, following repo conventions and module boundaries', 'Engineers review, refactor, handle complex logic and own the merge', 'Human code review + CI gates'],
    ['Verify', 'Generates API, regression and E2E tests and test data; first-pass AI code review; SAST triage', 'QA curates suites and runs exploratory testing; specialists run manual pen tests', 'Feature complete; no open critical/high'],
    ['Release', 'Drafts release notes, runbook updates and change summaries', 'DevOps releases; SportSeek runs UAT and Go/No-Go', 'UAT sign-off; Go/No-Go'],
    ['Operate & hand over', 'Keeps docs current with every merge; answers questions over the codebase; triages logs and alerts', 'On-call engineers resolve; SportSeek team takes ownership', 'KT checklist signed']], { size: 17 }),
  H2('5.1 Human-in-the-loop rules (non-negotiable)'),
  ...N(['No AI-generated change merges without review and approval by a named engineer, who is accountable for it as if they wrote it.', 'All quality gates apply equally to AI-generated and hand-written code: tests, coverage, static analysis, security scans.',
    'Security-sensitive areas (identity, payments, refunds, payouts, KYC data) get a second senior reviewer and a targeted manual pen test before release.', 'Agents work only in non-production environments with synthetic or masked data; they have no production credentials.',
    'Generated dependencies and snippets are licence-checked; no code is accepted that the reviewing engineer cannot explain.'], 'num'),

  H1('6. R1: the 20 October launch'),
  P('R1 takes SportSeek public on a hardened, security-tested and monitored Phase 1 product, with **F1 Email notifications** and **F2 Booking & event reminders** on day one.'),
  ...T([['Time (IST)', 1.6], ['Activity', 3.6], ['Participants', 3], ['Output', 2.6]], [
    ['09:30 daily', 'Launch stand-up', 'Launch pod, SportSeek PO / tech lead', 'Launch board updated; blockers owned'],
    ['17:00 daily', 'Defect and risk triage', 'Launch Lead, QA, PO', 'Fix / defer / de-scope decisions logged'],
    ['01 Oct', 'Launch Scope Gate', 'SportSeek PO & sponsor; Srivin lead & architect', 'Frozen scope incl. F1/F2; go-live criteria'],
    ['14 Oct', 'Code freeze', 'Launch pod', 'Release candidate; store submissions'],
    ['19 Oct', 'Go/No-Go', 'SportSeek sponsor (decides), PO, Srivin lead', 'Signed Go/No-Go record'],
    ['20 Oct', 'Launch and war-room', 'Pod on-call; SportSeek ops', 'Live; hourly health reports on launch day']]),
  H2('6.1 Go-live criteria (proposed for the 1 Oct Scope Gate)'),
  ...N(['No open severity-1/2 defects in launch journeys; AI-generated regression suite green.', 'VAPT of the launch surface with no open critical/high findings (SOW §6.2).', 'Load test passed at SportSeek\'s launch concurrency (D5).',
    'Monitoring, alerting and on-call live; rollback rehearsed; backup restore verified.', 'Privacy policy, terms and DPDP notice published; store listings approved or in final review.', 'UAT sign-off by SportSeek testers. F1/F2 are included only if they meet the same bar; otherwise they follow within two weeks.'], 'num2'),

  H1('7. The monthly release train'),
  ...T([['Week', 1], ['Pod', 4.5], ['SportSeek', 3], ['Gate', 2]], [
    ['Week 1', 'Plan from approved specs; agents implement; daily review; next train\'s specs start', 'PO clarifications', 'Specs approved'],
    ['Week 2', 'Build and integrate on Staging behind flags; weekly demo', 'Demo feedback', '—'],
    ['Week 3', 'Feature complete Friday; regression, security scans, targeted pen test', 'UI approvals for next train', 'Feature complete'],
    ['Week 4', 'Hardening; UAT support; store submission', 'UAT (3 days); Go/No-Go Monday', 'UAT; Go/No-Go'],
    ['Release week', 'Release Tuesday; one week of hypercare', 'KT checklist sign-off', 'KT signed']]),
  H2('7.1 Ceremonies'),
  ...T([['Ceremony', 2], ['When', 2], ['Time-box', 1.2], ['Participants', 2.6], ['Output', 2.6]], [
    ['Train planning', 'Monday, week 1', '1.5 h', 'Pod, PO', 'Train goal: the two features, with acceptance criteria'],
    ['Daily stand-up', 'Daily 09:30', '15 min', 'Pod incl. SportSeek developers', 'Blockers raised and owned'],
    ['Weekly demo', 'Every Friday', '45 min', 'Pod, PO, SportSeek stakeholders', 'Working software shown; feedback into backlog'],
    ['Spec & design review', 'Weekly (Thu)', '1 h', 'Analyst, designer, architect, PO', 'Next train\'s specs and UI approved'],
    ['Release review / retro', 'After each release', '1 h', 'Pod, PO, sponsor', 'Metrics, lessons, AI-playbook improvements']]),
  H2('7.2 Definition of Ready and Done'),
  ...T([['', 1.4], ['Criteria', 8.6]], [
    ['Ready', 'Spec approved: story, acceptance criteria, API contract, data changes, UI approved, dependencies cleared, test data known. **If it is not ready, the agents do not start.**'],
    ['Done (feature)', 'Merged after human review; unit/API/E2E tests green; coverage and security gates passed; docs and API collection updated automatically and checked; behind a feature flag; demoed and accepted by PO.'],
    ['Done (release)', 'Full regression green; targeted pen test where applicable; UAT signed; release notes and runbook updated; deployed via the pipeline into SportSeek infrastructure (SOW §14).']], { size: 17 }),

  H1('8. The AI-native pod'),
  P(`One cross-functional pod of about 10–11 people, all senior enough to judge AI output. Total planned effort is ${res.pm} person-months, against 154 in our conventional estimate for the same scope. Roles, skills and monthly loading are in the WBS & Integrated Project Plan, Section 14.`),
  ...T([['Role', 2.6], ['Accountability in the AI-native model', 7.4]], [
    ['Delivery Lead / TPM', 'Runs the release train; owns plan, RAID, dependencies, decisions log and AI governance; single point of accountability.'],
    ['Solution Architect & AI Engineering Lead', 'Architecture and ADRs; owns the AI engineering playbook (spec templates, context and prompt standards, agent guardrails, review rules); second reviewer on security-sensitive code.'],
    ['Product Analyst', 'Turns SOW and workshops into approved specs with AI assistance; UAT scenarios; traceability.'],
    ['Product Designer', 'Design system and feature UI; usability checks; design tokens shared by mobile and web.'],
    ['Senior .NET / .NET & PostgreSQL Engineers', 'Direct coding agents from specs; review, harden and own back-end and database changes; migrations and reconciliation.'],
    ['Senior React Native / React Engineers', 'Direct agents on mobile and web; own device testing, performance, accessibility and store releases.'],
    ['QA Automation Engineer', 'Curates AI-generated test suites; owns quality gates; exploratory testing; UAT support.'],
    ['DevOps / SRE', 'Pipelines, environments, observability, releases, on-call.'],
    ['Security & Performance Engineers (on demand)', 'Targeted pen tests (R2, R3, R6) and full VAPT (R6); load tests (R1, R5, R6).']]),
  H2('8.1 SportSeek inside the pod'),
  ...B(['**2 SportSeek developers recommended** (D9) join from R2 as full pod members, working with the same AI tooling. They learn the AI-native way of working as well as the code.',
    '**Product Owner** approves specs and accepts features weekly; **UAT testers** test in the hardening week of each release.',
    'By R6, SportSeek engineers have built and shipped parts of every module and can run the train themselves or scale it into Phase 2B.']),

  H1('9. RACI matrix'),
  P('R = Responsible, A = Accountable, C = Consulted, I = Informed. Aligned with SOW §15.'),
  ...T([['Activity', 3.6], ['SportSeek PO', 1], ['SportSeek Tech / Ops', 1.1], ['SportSeek UAT', 1], ['Srivin Delivery Lead', 1], ['Srivin Architect', 1], ['Srivin Pod', 1]], [
    ['Product priorities & release scope', 'A/R', 'C', 'I', 'C', 'C', 'I'],
    ['Feature specs', 'A (approve)', 'C', 'I', 'C', 'R', 'R'],
    ['UI/UX design', 'A (approve)', 'C', 'I', 'I', 'C', 'R'],
    ['HLD / ADRs', 'C', 'A (approve)', 'I', 'I', 'R', 'C'],
    ['AI usage policy & tooling approval', 'A', 'C', 'I', 'R', 'R', 'I'],
    ['Development incl. AI-generated code & review', 'I', 'C (review)', 'I', 'A', 'C', 'R'],
    ['Testing (functional, regression, security)', 'I', 'I', 'I', 'A', 'C', 'R'],
    ['UAT execution & sign-off', 'A', 'C', 'R', 'C', 'I', 'C'],
    ['Go/No-Go', 'A', 'C', 'C', 'R (prepare)', 'C', 'I'],
    ['Third-party contracts & approvals', 'A/R', 'C', 'I', 'C', 'C', 'I'],
    ['Infrastructure operation (until handover)', 'I', 'C', 'I', 'A', 'C', 'R'],
    ['KT checklist per release', 'A', 'R (receive)', 'I', 'R', 'R', 'R'],
    ['Change requests', 'A (approve)', 'C', 'I', 'R (assess)', 'C', 'I']], { size: 16 }),

  H1('10. Governance, escalation and decisions'),
  ...T([['Forum', 2.2], ['Frequency', 1.6], ['Attendees', 2.8], ['Purpose', 3.8]], [
    ['Release review (acts as steering)', 'Monthly, after each release', 'Sponsor, PO; Srivin Engagement Director, Delivery Lead', 'Release outcome, next train scope, metrics, top risks, change requests'],
    ['Weekly demo & status', 'Every Friday', 'PO, SportSeek tech, pod', 'Working software; train on-track status; decisions log; dependency register'],
    ['Design authority', 'Fortnightly / on demand', 'Architect, SportSeek tech reviewer', 'ADRs and technical decisions'],
    ['Launch war-room', 'Daily to 6 Nov 2026', 'Launch pod, PO', 'Section 6']]),
  ...T([['Level', 1], ['Escalated to', 3], ['Trigger', 3.5], ['Response', 2.5]], [
    ['L1', 'Engineer ↔ PO', 'Clarification or blocker', 'Same working day'],
    ['L2', 'Delivery Lead ↔ PO / tech lead', 'Decision or dependency at risk of missing need-by date', '1 working day'],
    ['L3', 'Engagement Director ↔ Sponsor', 'A feature at risk of missing two trains; commercial issue', '2 working days'],
    ['Launch', 'Launch Lead → Delivery Lead → Sponsor', 'Any risk to 20 Oct or go-live criteria', '4 business hours']]),
  P('Every SportSeek decision is logged with options, Srivin\'s recommendation and a need-by date derived from the train. A decision missing its date moves the affected feature, not the release.'),

  H1('11. Communication plan'),
  ...T([['Communication', 2.8], ['Audience', 2.4], ['Frequency', 1.5], ['Owner', 1.4]], [
    ['Weekly status (train progress, decisions, dependencies, RAID) — AI-drafted from tool data, reviewed by the Delivery Lead', 'PO, sponsor', 'Weekly (Fri)', 'Delivery Lead'],
    ['Weekly demo of working software', 'SportSeek stakeholders', 'Weekly', 'Pod'],
    ['Release notes (business and technical)', 'SportSeek business, support, ops', 'Monthly', 'QA / Delivery Lead'],
    ['Release review pack with delivery and AI metrics', 'Sponsor, PO', 'Monthly', 'Delivery Lead'],
    ['Incident communication', 'SportSeek ops, PO, sponsor (S1)', 'As needed', 'On-call lead']]),

  H1('12. Quality management'),
  ...T([['Level', 2], ['Scope', 3.6], ['How AI helps', 2.6], ['When', 1.8]], [
    ['Unit', 'Domain logic and edge cases', 'Generated with code from the spec; reviewed', 'Every commit'],
    ['API / integration', 'Endpoints, DB (Testcontainers), adapters', 'Generated from OpenAPI contracts', 'Every merge'],
    ['Regression', 'All live journeys, mobile and web', 'Suite generated from journey inventory; grows each release', 'Nightly + pre-release'],
    ['Security', 'SAST/SCA/secrets in CI; DAST; manual pen tests', 'AI triage of scanner findings', 'CI + R1, R2, R3, R6'],
    ['Performance', 'Load at SportSeek targets (D20)', 'Scripts generated from API catalogue', 'R1, R5, R6'],
    ['UAT', 'Business scenarios', 'Scenario scripts drafted from specs', 'Hardening week']], { size: 17 }),
  ...T([['Severity', 1.3], ['Definition', 5.2], ['Example', 3.5]], [
    ['S1 Critical', 'Production down, data loss, security breach, or payments failing broadly', 'Payments not captured'],
    ['S2 High', 'Core journey broken for some users, or a wrong financial or identity outcome', 'Duplicate identity on linking'],
    ['S3 Medium', 'Feature misbehaves with a workaround', 'A ledger filter ignores one status'],
    ['S4 Low', 'Cosmetic', 'Alignment or copy issues']]),

  H1('13. Environments, releases and feature flags'),
  ...B(['**Dev / Staging / Production** in SportSeek accounts. Agents and engineers work in Dev; Staging holds synthetic or masked data only; Production changes go only through the pipeline.',
    '**Continuous delivery behind flags**: back-end changes deploy when ready and stay dark until the release; mobile ships on the monthly train via store submission in week 4.',
    '**Rollback**: expand/contract database migrations and flag kill-switches make every release reversible.',
    '**Minimum-version enforcement** on the apps, so API changes (e.g. identity in R2) never strand old clients.']),

  H1('14. AI governance: security, confidentiality and IP'),
  ...T([['Control', 2.6], ['How it works', 7.4]], [
    ['Approved tooling only', 'AI tools are used only under enterprise/business terms that exclude training on customer code and data, and only after SportSeek approves them (D21). The tool list is part of the governance charter.'],
    ['Data handling', 'No production personal, KYC or transaction data in prompts, agent contexts or non-production environments. Secrets are never placed in prompts; secret scanning runs in CI.'],
    ['Least privilege for agents', 'Agents run in development workspaces with repository access only. They have no production credentials and cannot deploy; deployment is a pipeline action approved by a person.'],
    ['Human accountability', 'Every merge has a named human reviewer. Security-sensitive changes have two.'],
    ['IP and licensing', 'All outputs, including code, tests, specs, prompts and documentation, belong to SportSeek on payment (SOW §19). Dependencies are licence-scanned; the reviewing engineer confirms generated code contains no copied third-party material.'],
    ['Audit trail', 'Pull requests record AI assistance, reviewers and checks. AI usage metrics are reported monthly.'],
    ['DPDP', 'AI governance sits inside the same DPDP-aligned data controls as the rest of the engagement.']], { size: 17 }),

  H1('15. Knowledge transfer and transition'),
  ...B(['**Continuous KT**: SportSeek developers build inside the pod from R2, and specs, ADRs, API docs and runbooks are generated and kept current with every merge. There is no end-of-milestone documentation cliff.',
    '**Per-release KT checklist** (SOW §12.2) signed within 5 working days of each go-live, covering walkthrough, docs, runbook, and a change made by a SportSeek engineer.',
    '**Codebase assistant for SportSeek**: we set up an AI assistant configured on SportSeek\'s own repositories and documentation, within SportSeek\'s approved tooling. SportSeek\'s team can keep asking "how does X work?" long after handover.',
    '**Infrastructure**: operate → co-operate (from R3) → handover, with the operations runbook delivered in R6 (SOW §15.1).',
    'We are proposing continuous KT instead of a 2-week-to-1-month KT window after each milestone (SOW §12.2). The checklist sign-off the SOW requires is retained.']),

  H1('16. Change management'),
  P('SOW §18 applies: a written request, then a Srivin impact assessment within 5 business days, then SportSeek\'s decision, then an updated baseline. The release train makes change cheaper. New scope is slotted into a future train, and swapping features of similar size between trains is a PO decision recorded in the decision log, with no change request needed.'),

  H1('17. Risk management'),
  ...T([['#', 0.5], ['Risk', 3.4], ['P / I', 0.9], ['Mitigation', 4.3], ['Owner', 1]], [
    ['R1', 'AI tooling not approved by SportSeek on day one', 'L-M / H', 'Enterprise-terms tools; written AI policy at kick-off; fallback plan at conventional pace', 'Delivery Lead'],
    ['R2', 'Launch blockers found late in Phase 1', 'M / H', 'AI-assisted assessment in 3 days; Scope Gate; F1/F2 de-scoped before launch is risked', 'Delivery Lead'],
    ['R3', 'SportSeek decision/approval pace lags the monthly train', 'M / H', '1-day decision and 2-day UI approval agreement; weekly decision log; affected feature moves, not the release', 'SportSeek PO'],
    ['R4', 'Quality or security issues in AI-generated code', 'L-M / H', 'Human review, dual review on sensitive code, full gates, targeted pen tests', 'Architect'],
    ['R5', 'Over-reliance on AI erodes team understanding', 'L / M', 'Engineers must explain every merge; SportSeek developers in the pod; living docs', 'Architect'],
    ['R6', 'Third-party approvals (Route, DLT, WhatsApp)', 'M / M', 'Need-by dates months ahead; those features in the last train', 'SportSeek'],
    ['R7', 'Duplicate identities in existing data', 'M / M', 'Early duplicate report; approved merge rules; rehearsed migration', 'Architect'],
    ['R8', 'App-store review delays a mobile release', 'L-M / M', 'Submission in week 4; web and back end unaffected; features stay behind flags', 'Delivery Lead']], { size: 17 }),

  H1('18. Hypercare, warranty and support'),
  ...B(['**Hypercare**: 20 Oct – 6 Nov 2026 for the launch; one week after every later release; 23 Mar – 2 Apr 2027 for R6.', '**Warranty**: 90 days per release at no additional cost (SOW §16). **Phase 1 support** included (SOW §16).',
    '**AI-assisted operations**: log and alert triage speeds up diagnosis; fixes follow the same review and release gates.']),
  ...T([['Severity', 1.6], ['Acknowledge', 1.8], ['Workaround / restore', 2.6], ['Permanent fix', 2.6]], [
    ['S1 Critical', '30 min (24×7 in hypercare)', '4 hours', 'Next hotfix'],
    ['S2 High', '2 business hours', '1 business day', 'Next release or hotfix'],
    ['S3 Medium', '1 business day', 'As agreed', 'Next release'],
    ['S4 Low', '2 business days', '—', 'Backlog']]),
  ...C('Note', 'These SLA figures are a Srivin proposal. The SOW leaves them open (SOW §16 ⚑, D16).', 'note'),

  H1('19. Delivery metrics'),
  ...T([['Area', 2], ['Metric', 4.6], ['Target', 3.4]], [
    ['Throughput', 'Features in production per month', '2 per month from R1'],
    ['Predictability', 'Releases on their fixed date; features that moved trains', '100% on date; moved features reported with reasons'],
    ['Speed', 'Lead time from approved spec to production; deployment frequency', 'Reported monthly'],
    ['Quality', 'Escaped S1/S2 defects; change failure rate; mean time to restore', 'Zero S1/S2 escapes as the aim'],
    ['Security', 'Open critical/high vulnerabilities at release', 'Zero'],
    ['AI effectiveness', 'Share of merged changes that were AI-assisted; review time; rework rate on AI-generated code', 'Reported monthly; used to tune the playbook'],
    ['Ownership', 'KT checklist items signed; SportSeek-authored merges', 'Rising every release']]),

  H1('20. Tooling'),
  ...T([['Purpose', 2.4], ['Tool', 4.2], ['Ownership', 3.4]], [
    ['AI engineering', 'AI coding agents (e.g. Claude Code) and assistants under enterprise terms, approved by SportSeek', 'Configured on SportSeek repositories; usage logged'],
    ['Backlog, specs, tests', 'JIRA or Trello (SportSeek decision, D8)', 'SportSeek-owned; Srivin operates'],
    ['Code & CI/CD', 'SportSeek version control and pipelines', 'SportSeek-owned'],
    ['Design', 'Figma or tool agreed with SportSeek', 'Files handed over (SOW §13)'],
    ['API docs', 'OpenAPI + Postman collections, generated and checked each merge (SOW §13)', 'In SportSeek repositories'],
    ['Observability', 'Logging, error tracking, metrics, uptime (SOW §6.2)', 'SportSeek cloud']]),

  H1('21. Commercial alignment'),
  P('The release train also offers a simpler commercial shape, for inclusion in the proposal the SOW requests:'),
  ...B(['**Price per release**: a fixed fee for each monthly release (two features), invoiced on UAT sign-off. SportSeek pays for delivered, accepted features and can approve costs one release at a time, as the SOW Next Steps ask.',
    '**Launch (R1)** priced separately as a fixed-scope hardening engagement.', '**Optional continuation** into Phase 2B on the same train from April 2027, at the same per-release structure.',
    'Rates, payment terms and any outcome-linked elements will be in the commercial proposal.']),

  H1('22. Our commitments to SportSeek'),
  ...N(['**Public on 20 Oct 2026**, with two new features on day one.', '**Two features in production every month**, on fixed release dates, to Phase 2A completion on **23 Mar 2027**.',
    `**A lean senior pod** (${res.pm} person-months, less than half the conventional estimate), with every AI output reviewed and owned by a named engineer.`, '**Transparency**: weekly working software, monthly metrics including AI usage.',
    '**Ownership**: SportSeek\'s accounts, code, docs and AI artefacts; SportSeek developers able to run the train themselves.'], 'num3'),
];

build({ out: OUT, title: 'SportSeek Phase 2A — Project Delivery Model', subtitle: 'Delivery approach', short: 'Project Delivery Model',
  sections: [{ cover: true, children: s1 }, { children: [...s2, ...s3] }] });
