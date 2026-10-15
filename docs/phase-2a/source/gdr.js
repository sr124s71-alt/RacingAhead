const L = require('./lib');
const { P, H1, H1n, H2, B, N, T, C, cover, contents, build, LAND_W } = L;
const g = require('./gdr.json');
const OUT = process.argv[2];
const fmt = s => /\d{4}-\d{2}-\d{2}/.test(s) ? new Date(s + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : s;
const sevOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const all = [...g.conflicts, ...g.gaps];
const count = s => all.filter(x => x.sev === s).length;
const decs = [...g.decisions].sort((a, b) => (/\d{4}/.test(a[4]) ? a[4] : '9999') < (/\d{4}/.test(b[4]) ? b[4] : '9999') ? -1 : 1);

const toc = ['1. Purpose, sources and method', '2. Executive summary', '3. How to read this register', '4. Conflict register: vision vs SOW',
  '5. Architecture gap register', '6. Decision register', '7. Vision-to-architecture traceability', '8. Launch-week actions (15–20 October 2026)',
  '9. Industry best practices and standards', '10. Register governance and next steps'];

const s1 = cover({ title: 'Gap & Decision Register', subtitle: 'SportSeek vision, SOW and Srivin architecture: conflicts, gaps, decisions required and industry best practices',
  docId: 'SRV-SPS-2A-GDR-004', version: 'v1.0', date: '15 October 2026', status: 'Issued for SportSeek steering review',
  baseline: 'SOW v1.0; High Level Requirements; SportSeek vision boards (15 Oct 2026); Srivin pack v2.1' });

const s2 = [
  ...contents(toc),
  H1('1. Purpose, sources and method'),
  P('This register records where SportSeek\'s product vision, the Phase 2 SOW and Srivin\'s Phase 2A architecture do not line up. It also records the decisions needed to close each gap and the industry practices the platform should follow. It is a working tool for the SportSeek steering committee: every item has an owner, a need-by date and a recommended resolution.'),
  ...T([['Ref.', 0.6], ['Source', 4], ['Version / scope', 5.4]], g.sources),
  H2('Method'),
  ...N(['Read all four sources, including the SOW figures (Figure 1 architecture and §11 persona journeys) and all ten vision boards.',
    'List every capability, principle and data element the vision shows, and map each to the SOW scope and to the Srivin architecture (Section 7).',
    'Classify each mismatch: a **Conflict** (two SportSeek documents disagree, so SportSeek must choose) or a **Gap** (the Srivin architecture does not yet provide what the vision or SOW needs).',
    'Assign severity, a recommended resolution, an owner and a need-by date tied to the release plan.']),
  ...C('Scope note', 'Regulatory points (RBI, DPDP, tax, consumer protection, intermediary rules) are flagged because they shape the architecture. They are not legal or tax advice, and each needs confirmation by SportSeek\'s advisers.', 'note'),

  H1('2. Executive summary'),
  P(`The Srivin architecture is a sound foundation for the SportSeek vision. Its layers (experience → shared services → business domains → data) and its domain boundaries match the vision\'s own architecture board. The review found **${g.conflicts.length} conflicts** between SportSeek\'s vision and the SOW, and **${g.gaps.length} gaps** in the Srivin architecture. **${g.decisions.length} decisions** are logged.`),
  ...T([['Severity', 2], ['Conflicts + gaps', 2], ['Meaning', 6]], [
    ['**Critical**', String(count('Critical')), 'Regulatory or launch risk; decide immediately'],
    ['**High**', String(count('High')), 'Costly rework if not decided before the next design milestone'],
    ['**Medium**', String(count('Medium')), 'Needs a decision before the phase that uses it'],
    ['**Low**', String(count('Low')), 'Backlog or scope-tagging decision']]),
  ...C('Decisions needed in the next two weeks', [
    '**DEC-04 — Under-18 users at launch (17 Oct).** The vision shows athletes aged 14–17. Shared Identity goes live on 20 Oct. SportSeek needs a legal view on DPDP parental consent before launch, even if the answer is an interim age gate.',
    '**DEC-05, DEC-11, DEC-14, DEC-17, DEC-18, DEC-21 — HLD principles (23 Oct):** organisation model, cache/storage/search, separate rewards ledger, event capture from R2, partner API, international-ready data.',
    '**DEC-01 and DEC-03 — SSO/super-app and community timing (30 Oct):** the vision roadmap promises both; the SOW does not.',
    '**DEC-02 — Wallet (13 Nov):** the vision shows a stored balance and partner "Withdraw"; the SOW forbids holding funds. This is a regulatory decision, and marketing should stop showing a wallet until it is made.',
    '**DEC-12 — Order line items and fee engine (13 Nov):** needed before refunds (F5) are built.'], 'risk'),

  H1('3. How to read this register'),
  ...T([['Field', 2], ['Meaning', 8]], [
    ['ID', '**C-n** conflict between SportSeek documents; **G-n** gap in Srivin architecture; **DEC-n** decision. Every C and G links to one DEC.'],
    ['Severity', 'Critical, High, Medium or Low (Section 2).'],
    ['Need-by', 'Latest date the decision can be taken without moving a release or forcing rework. Derived from the WBS & Integrated Project Plan v2.1.'],
    ['Owner', 'The person or function who decides. Srivin recommends; SportSeek decides unless the item is a Srivin design choice.'],
    ['Status', '**Open** → **Decided** (with date and outcome) → **Closed** (reflected in design and plan). **Tracked** means already in the WBS dependency register.']]),

  H1('4. Conflict register: vision vs SOW'),
  P('Each conflict is a place where two SportSeek documents disagree. Srivin cannot resolve these alone; each needs a SportSeek decision.'),
  ...g.conflicts.flatMap(c => [H2(`${c.id} — ${c.title}  [${c.sev}]`),
    ...T([['Aspect', 1.8], ['Detail', 8.2]], [['Vision says', c.vision], ['SOW says', c.sow], ['Impact', c.impact], ['Options', c.options], ['**Srivin recommendation**', `**${c.rec}**`], ['Decision', c.dec]], { boldFirst: true, size: 17 })]),
];

const s3 = [
  H1n('5. Architecture gap register'),
  P('Gaps in the Srivin Phase 2A architecture (Technical Approach v2.1) against the vision and the SOW, sorted by severity.'),
  ...T([['ID', 0.5], ['Gap', 1.9], ['Sev.', 0.7], ['Evidence (source)', 2.6], ['Impact', 2.4], ['Recommended resolution', 3], ['When', 1.4], ['Owner', 1.1], ['DEC', 0.7]],
    [...g.gaps].sort((a, b) => sevOrder[a.sev] - sevOrder[b.sev]).map(x => [x.id, `**${x.title}**`, x.sev, x.evidence, x.impact, x.rec, x.when, x.owner, x.dec]), { width: LAND_W, size: 14 }),
  H1('6. Decision register'),
  P('All decisions, sorted by need-by date. Status as at 15 October 2026.'),
  ...T([['ID', 0.8], ['Decision required', 2.6], ['Srivin recommendation', 3.6], ['Owner', 1.6], ['Need-by', 1.1], ['If late', 2.4], ['Status', 1]],
    decs.map(d => [d[0], `**${d[1]}**`, d[2], d[3], fmt(d[4]), d[5], d[6]]), { width: LAND_W, size: 14 }),
  H1('7. Vision-to-architecture traceability'),
  P('Every capability shown on the vision boards, mapped to the Srivin architecture and SOW phase. **Covered** = in the plan; **Partial** = in the plan with a gap; **Planned** = later SOW phase; **Gap / Conflict / Out of scope** = see the linked register item.'),
  ...T([['Vision area', 1.4], ['Capability (vision boards)', 4], ['Architecture component / phase', 3.6], ['Status', 1.3], ['Register items', 1.4]], g.trace, { width: LAND_W, size: 15 }),
];

const s4 = [
  H1n('8. Launch-week actions (15–20 October 2026)'),
  P('Release R1 code froze on 14 October and goes live on 20 October with Shared Identity (F3). None of the actions below changes the frozen build. They protect the launch and keep R2 design options open.'),
  ...T([['#', 0.5], ['Action', 5], ['Owner', 2], ['By', 1.2], ['Links', 1.3]], [
    ['1', 'Legal view on whether under-18s may register at launch; if not cleared, apply an interim age gate in registration copy and terms', 'SportSeek Legal / PO', '17 Oct', 'DEC-04, G3'],
    ['2', 'Confirm the F3 identity schema can take Organisation/Membership and guardian links as additive tables in R2, with no change to R1 data', 'Srivin Architect', '17 Oct', 'G2, G3'],
    ['3', 'Brief marketing and stakeholders: R1 delivers shared identity with separate app logins, not SSO, and no wallet', 'SportSeek PO / Srivin Delivery Lead', '19 Oct', 'C1, C2'],
    ['4', 'Add CERT-In incident-reporting steps and log-retention settings to the launch runbook', 'Srivin DevOps / SportSeek Ops', '19 Oct', 'Section 9'],
    ['5', 'Table this register at the first post-launch steering meeting; assign owners to every Open item', 'Srivin Delivery Lead', '23 Oct', 'All']], { size: 17 }),
];

const s5 = [
  H1n('9. Industry best practices and standards'),
  P('The practices below are the industry standards Srivin recommends SportSeek adopt across the platform, with how each applies to SportSeek and where it stands today. **Adopted** = already in the Srivin plan; **Partial** = in the plan with a gap; **Planned** = to be added in the HLD or a later release; **Gap** = not yet planned and linked to a register item. Regulatory references need confirmation by SportSeek\'s advisers.'),
  ...T([['Area', 1.2], ['Practice', 3], ['Standard / reference', 2.6], ['How it applies to SportSeek', 3.8], ['Status', 1.1], ['Link', 1]],
    g.practices.map(p => [p[0], `**${p[1]}**`, p[2], p[3], p[4], p[5]]), { width: LAND_W, size: 14 }),
];

const pc = st => g.practices.filter(p => p[4].startsWith(st)).length;
const s6 = [
  H1n('10. Register governance and next steps'),
  ...T([['Status of best practices', 4], ['Count', 1.5]], [['Adopted', String(pc('Adopted'))], ['Partial', String(pc('Partial'))], ['Planned', String(pc('Planned'))], ['Gap', String(pc('Gap'))]]),
  H2('Governance'),
  ...B(['**Owner of the register:** Srivin Delivery Lead. **Review:** weekly in the programme status meeting; monthly at the release review / steering committee.',
    '**Closing an item:** the decision is recorded with date and outcome, and the change is reflected in the Technical Approach (TDD), the WBS and, where needed, a change request under SOW §18.',
    '**Escalation:** a decision not taken by its need-by date is escalated one level (Delivery Model §10), with the release impact stated.']),
  H2('Next steps'),
  ...N(['Steering review of this register and assignment of owners (by 23 Oct 2026).', 'HLD sign-off incorporates DEC-05, 07, 11, 14, 17, 18 and 21 (23 Oct 2026).',
    'Technical Approach (TDD) updated to v2.2 once the HLD decisions are taken, as agreed with SportSeek.', 'WBS and dependency register updated for any decision that changes release scope.'], 'num2'),
];

build({ out: OUT, title: 'SportSeek Phase 2A — Gap & Decision Register', subtitle: 'Gap & Decision Register', short: 'Gap & Decision Register',
  sections: [{ cover: true, children: s1 }, { children: s2 }, { landscape: true, children: s3 }, { children: s4 }, { landscape: true, children: s5 }, { children: s6 }] });
