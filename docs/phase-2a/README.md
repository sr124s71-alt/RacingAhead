# SportSeek Phase 2A — Srivin Platforms delivery pack

Prepared by Srivin Platforms for RacingAhead / SportSeek (v1.0, 27 Sep 2026). Baseline: SportSeek Phase 2 SOW v1.0 (15 Jul 2026) and the SportsSeek App High Level Requirements.

| # | Document | Files |
|---|----------|-------|
| 01 | WBS & Integrated Project Plan: WBS, schedule, dependencies, critical path, milestones, resource loading with technical skills (Section 13) | `01_WBS_and_Integrated_Project_Plan.docx` / `.pdf` |
| 01a | Project Plan workbook: schedule with weekly Gantt, external dependency register, milestones, monthly resource loading and skills | `01a_Project_Plan_Workbook.xlsx` |
| 02 | Project Delivery Model: lifecycle, agile cadence, governance, quality, release, change, risk, KT, support | `02_Project_Delivery_Model.docx` / `.pdf` |
| 03 | Technical Approach: architecture, per-module design, NFRs, engineering practices, launch plan | `03_Technical_Approach.docx` / `.pdf` |

## Technology stack

React Native (mobile apps), .NET / ASP.NET Core (back end), PostgreSQL (database); React + Next.js proposed for the new web application.

## Resource loading (Srivin, indicative)

Peak about 24.5 FTE (Jan 2027); 154 person-months from Oct 2026 to Jun 2027. The source data is `source/res.py` -> `res.json`.

## Key dates (Baseline 0)

| Release | Scope | Go-live |
|---|---|---|
| 2A.0 Public Launch | Hardened, security- and load-tested Phase 1 | **Tue 20 Oct 2026** |
| 2A.1 | M2 Shared Identity + M6 Notification core | Wed 27 Jan 2027 |
| 2A.2 | M5 Partner/Service + M4 Booking hardening + M6 complete | Tue 16 Mar 2027 |
| 2A.3 | M3 Transaction Ledger + Web application — Phase 2A complete | Tue 4 May 2027 |

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
