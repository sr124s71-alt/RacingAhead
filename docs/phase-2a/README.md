# SportSeek Phase 2A — Srivin Platforms delivery pack

Prepared by Srivin Platforms for RacingAhead / SportSeek (v1.0, 27 Sep 2026). Baseline: SportSeek Phase 2 SOW v1.0 (15 Jul 2026) and the SportsSeek App High Level Requirements.

| # | Document | Files |
|---|----------|-------|
| 01 | WBS & Integrated Project Plan: WBS, schedule, dependencies, critical path, milestones, resource loading with technical skills (Section 13) | `01_WBS_and_Integrated_Project_Plan.docx` / `.pdf` |
| 01a | Project Plan workbook: schedule with weekly Gantt, external dependency register, milestones, monthly resource loading and skills | `01a_Project_Plan_Workbook.xlsx` |
| 02 | Project Delivery Model: lifecycle, agile cadence, governance, quality, release, change, risk, KT, support | `02_Project_Delivery_Model.docx` / `.pdf` |
| 03 | Technical Approach: architecture, per-module design, NFRs, engineering practices, launch plan | `03_Technical_Approach.docx` / `.pdf` |

## Delivery model (v2.1): AI-native release train, Shared Identity at launch

A lean, senior AI-native pod (about 10-11 FTE; 14.25 in launch month; 69.5 person-months) ships new features to production every month (12 features in 6 releases) from the public launch. Phase 2A is complete on **23 Mar 2027**.

| Release | Go-live | Features |
|---|---|---|
| R1 | **Tue 20 Oct 2026** | Public launch + **F3 Shared identity & account linking** (remote switch with fallback to Phase 1 login) |
| R2 | Tue 24 Nov 2026 | F1 Email + F2 Reminders + F4 Push & preferences; merge of existing duplicate accounts |
| R3 | Tue 22 Dec 2026 | F5 Cancellation & refunds + F6 Web app (players) |
| R4 | Wed 27 Jan 2027 | F7 Generalised partner model + F8 Waitlist & edit alerts |
| R5 | Tue 23 Feb 2027 | F9 Transaction Ledger + F10 Web app (organisers & partners) |
| R6 | Tue 23 Mar 2027 | F11 Split settlement & payouts + F12 WhatsApp & full alert catalog. **Phase 2A complete** |

Stack: React Native (mobile), .NET / ASP.NET Core (back end), PostgreSQL; React + Next.js proposed for web.

## Regenerating

`source/` holds the generators. `plan.json` (built by `data.py`) is the single source for every date in all documents.

```bash
cd source
python3 data.py                 # schedule + dependency data -> plan.json
python3 figs.py                 # Gantt, architecture, critical-path figures (matplotlib)
python3 res.py && python3 figs_res.py   # resource loading data + histogram
npm install docx                # docx generator
node wbs.js out_wbs.docx        # also writes out_wbs.html (print version)
node dlm.js out_dlm.docx; node tad.js out_tad.docx
node topdf.js "$PWD/out_wbs.html" "$PWD/out_wbs.pdf" "WBS &amp; Integrated Project Plan"   # Playwright/Chromium
python3 xlsx.py                 # Excel workbook (openpyxl)
```
