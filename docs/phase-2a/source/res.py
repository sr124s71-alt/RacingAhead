import json
M=['Oct 26','Nov 26','Dec 26','Jan 27','Feb 27','Mar 27','Apr 27']
# (group, role, seniority, loading per month Oct..Apr, primary skills, AI-augmented way of working / tools)
R=[
('mgmt','Delivery Lead / TPM (AI-native delivery)','Senior (12+ yrs)',[1,1,1,1,1,1,0.5],
 'Release-train planning and dependency management; stakeholder and steering management; RAID and change control; metrics-driven delivery; governance of AI usage (policy, audit trail, data handling)',
 'AI-generated status reports, RAID and dependency tracking from JIRA/Trello and repository data; JIRA / Trello'),
('mgmt','Solution Architect & AI Engineering Lead','Senior (12+ yrs)',[1,1,1,1,1,1,0.25],
 'ASP.NET Core modular monolith and domain design; PostgreSQL architecture; OAuth2/OIDC; event-driven integration; Razorpay incl. Route; React Native and React architecture; OWASP ASVS. Owns the AI engineering playbook: specs, prompt/context standards, agent guardrails and review rules',
 'AI coding agents (e.g. Claude Code) for codebase analysis, spike prototypes and ADR drafting; C4 diagrams'),
('design','Product Analyst (AI-assisted BA)','Mid–Senior (6+ yrs)',[1,1,1,1,1,1,0.25],
 'Story mapping; Given/When/Then acceptance criteria; booking, payments/refunds and partner domains; SOW traceability; UAT scenario design',
 'AI drafts stories, acceptance criteria, edge cases and UAT scripts from the SOW and specs; analyst and PO refine'),
('design','Product Designer (UX/UI)','Mid–Senior (6+ yrs)',[1,1,1,1,0.5,0.25,0],
 'Atomic design system; mobile and responsive web UI; usability testing; accessibility (WCAG 2.1 AA); design tokens shared by React Native and React',
 'AI-assisted layout and copy exploration and design-to-code token export; Figma or agreed tool'),
('backend','Senior .NET Engineer (AI-augmented)','Senior (8+ yrs)',[3,2,2,2,2,2,0.5],
 'C# / ASP.NET Core; EF Core with Npgsql; OIDC implementation (e.g. OpenIddict); Razorpay payments, refunds, Route and webhooks; notification channel integrations; idempotent APIs; background processing',
 'Spec-driven development with AI coding agents: agents generate code and tests from the approved spec, engineers review, harden and own every merge'),
('backend','.NET & PostgreSQL Engineer (AI-augmented)','Senior (8+ yrs)',[1,1,1,1,1,1,0],
 'Schema-per-domain design; EF Core migrations (expand/contract); JSONB with schema validation; exclusion constraints against double-booking; geospatial queries; query tuning; identity de-duplication and data-migration scripts; reconciliation SQL',
 'AI-generated migration and reconciliation scripts, verified against Testcontainers PostgreSQL before any environment'),
('mobile','Senior React Native Engineer (AI-augmented)','Senior (7+ yrs)',[2,1,1,1,1,1,0.25],
 'React Native + TypeScript on iOS/Android; OIDC with PKCE; push (FCM/APNs); deep links and app-switch handling; schema-driven forms; store release engineering with Fastlane; minimum-version enforcement',
 'AI agents generate screens from design tokens and specs, and component and E2E tests; engineer reviews and tunes on real devices'),
('web','Senior React / Next.js Engineer (AI-augmented)','Senior (7+ yrs)',[0,1,1,1,1,0.5,0],
 'React + TypeScript with Next.js; server rendering for SEO; shared design tokens; data-heavy admin screens (ledger tables, filters, exports); WCAG 2.1 AA',
 'AI agents port Phase 1 mobile journeys to web against the shared API; parity checks generated from the mobile journey inventory'),
('qa','QA Automation Engineer (AI-assisted)','Mid–Senior (6+ yrs)',[2,1,1,1,1,1,0.25],
 'Test strategy and quality gates; API, mobile and web automation; payment/refund scenarios in Razorpay test mode; UAT support',
 'AI generates API tests from OpenAPI specs, regression suites from user journeys, and test data; engineer curates and maintains the suite'),
('ops','DevOps / SRE Engineer','Senior (7+ yrs)',[1,1,0.5,0.5,0.5,0.5,0.25],
 'Infrastructure as code in SportSeek\'s cloud; CI/CD for .NET and React Native; managed PostgreSQL; OpenTelemetry observability; secrets; release automation; on-call',
 'AI-assisted IaC authoring, pipeline configuration and log/incident triage'),
('spec','Security Engineer (VAPT, on demand)','Senior (8+ yrs)',[0.75,0.25,0.25,0,0.25,0.5,0],
 'Web, API and mobile penetration testing (OWASP WSTG, MASTG); targeted pen tests on identity (R1), refunds (R3) and payouts (R6); full VAPT before Phase 2A completion',
 'AI-assisted SAST triage and threat-model drafting; manual testing by the specialist'),
('spec','Performance Engineer (on demand)','Mid–Senior (6+ yrs)',[0.5,0,0,0,0.25,0.25,0],
 'Load test design; .NET API profiling; PostgreSQL query analysis; capacity recommendations',
 'AI-generated k6 scripts from the API catalogue; engineer designs workload models'),
]
G={'mgmt':'Programme & architecture','design':'Analysis & UX','backend':'.NET & PostgreSQL','mobile':'React Native','web':'React web','qa':'Quality engineering','ops':'DevOps / SRE','spec':'Specialists'}
tot=[round(sum(r[3][i] for r in R),2) for i in range(len(M))]
pm=round(sum(tot),2)
json.dump(dict(months=M,roles=[dict(group=g,role=n,seniority=s,load=l,skills=k,tools=t,pm=round(sum(l),2),peak=max(l)) for g,n,s,l,k,t in R],groups=G,total=tot,pm=pm),open('res.json','w'),indent=1)
print(tot,pm)
