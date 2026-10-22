# F3 Shared Identity: Product Backlog coverage of the POC

Source: **SRV-SPS-2A-BLG-004 Product Backlog v1.0** (28 Sep 2026), feature F3 *Shared Identity & Account Linking* (R1) and the identity enablers. This maps every acceptance criterion to what the POC does, where it shows in the demo, and which automated test proves it.

**Status:** ✅ in the POC and demonstrable · 🟡 in the POC with a stated difference · ⬜ not in the POC (and why)

Tests are in `tests/` and run with `dotnet test` (18 tests against a real PostgreSQL). Demo locations refer to the web demo stage (`start-all.bat` → http://localhost:8082, or the shareable prototype link).

## F3-S01 Register with phone and verify by OTP (5 pts, Must)

| Acceptance criterion | Status | In the demo | Automated test |
|---|---|---|---|
| New phone: OTP sent; account created only after OTP verification | ✅ | User App → number → **Send code** → **Verify & create account** | `Existing_UserApp_phone_registers_on_PartnerApp…` |
| Wrong or expired OTP rejected with a clear retry | ✅ | Wrong code shows *Incorrect code. N attempt(s) left*; **Send a new code** button | `Wrong_otp_never_links…` |
| Repeated failures rate-limited per phone / device / IP | ✅ | 5 wrong codes lock the number for 15 min; 5 codes per number, 10 per device, 30 per IP per window | `Wrong_otp_never_links…`, `Otp_requests_are_rate_limited_per_number`, `Otp_requests_are_limited_per_device_across_numbers` |
| Phone already verified: guided to log in or link, no duplicate | ✅ | Same number in the other app shows **Existing SportSeek account found** | `Existing_UserApp_phone_registers_on_PartnerApp…` |

## F3-S02 Detect existing identity and link (8 pts, Must) — the SOW acceptance criterion

| Acceptance criterion | Status | In the demo | Automated test |
|---|---|---|---|
| Must prove ownership again by OTP before any linking | ✅ | Partner App: wrong code is refused, nothing linked | `Wrong_otp_never_links…` |
| Role added to the existing identity; no second record; profile and KYC visible from both apps | ✅ | **Linked to your existing SportSeek account**; "One ID across apps" diagram; KYC submitted in one app shows in the other | `Existing_UserApp_phone…`, `Kyc_submitted_in_PartnerApp_is_visible_in_UserApp` |
| Audit log with identity ID, contact, role added, timestamp | ✅ | Admin → **Audit log** → ROLE_LINKED with masked contact, role, existing roles and reason | `Every_linking_decision_is_audited` |
| Automated test: User App phone registers on Partner App → same identity, role added, no duplicate | ✅ | — | `Existing_UserApp_phone_registers_on_PartnerApp__same_identity_role_added_no_duplicate` |

## F3-S03 Same credentials on every app, no SSO (5 pts, Must)

| Acceptance criterion | Status | In the demo | Automated test |
|---|---|---|---|
| Same credentials on User App, Partner App and Admin Portal | ✅ | **Demo identity: Kavya Reddy** signs in to both apps with one password; the admin signs in with code or password | `Demo_identity_signs_in_to_both_apps_with_one_password…`, `One_credential_works_in_every_linked_app…` |
| App-scoped token with only that app's roles | ✅ | Profile → **What this app's token carries** | `Tokens_are_app_scoped…` |
| Signed in on the User App ≠ signed in on the Partner App (no SSO) | ✅ | Each panel signs in separately | (by design: separate clients and sessions) |
| Compromised refresh token / lost device revocable per device without affecting other devices | ✅ | Profile → **Signed-in devices** → **Sign out** another device: that panel is signed out within seconds, this one stays | `Signing_out_one_device_leaves_the_other_devices_signed_in` |

🟡 Difference: the POC issues tokens through a custom OTP grant and the password grant on the OpenIddict server. Production uses Authorization Code + PKCE per app, as the Technical Approach and this story's rationale say.

## F3-S04 Bootstrap every Phase 1 account 1:1 (5 pts, Must)

| Acceptance criterion | Status | In the demo | Automated test |
|---|---|---|---|
| Every Phase 1 account has exactly one identity with contacts and roles carried over | 🟡 | Admin → **Phase 1 & bootstrap** → **Run bootstrap** | `Bootstrap_loads_phase1_accounts_1_to_1…` |
| Reconciliation: Phase 1 account count = identity count (before dedup) | ✅ | **Reconciliation matches: 11 Phase 1 accounts = 11 identities** | `Phase1_session_moves_onto_shared_identity…` (checks reconciliation) |
| Old app build prompted to update, not allowed on the retired flow | ✅ | Admin → **Remote switch** → minimum version 1.1.0 → apps show **Update required**; API answers 426 | `Apps_below_the_minimum_version_get_426` |

🟡 Difference to raise with SportSeek (D22): the story says contacts are carried over **verified**. The POC carries them over **unverified** until the person proves ownership by OTP. Phase 1 contains the same phone on separate User and Partner records (3 planted cases), and marking both verified would break the "one verified contact, one identity" rule and let either record claim the other. A person signs in with OTP once, and their contact becomes verified.

## F3-S05 Remote switch with fallback to the Phase 1 login (3 pts, Must)

| Acceptance criterion | Status | In the demo | Automated test |
|---|---|---|---|
| Flag off: apps launch on the existing Phase 1 login | ✅ | Admin → **Remote switch** off → apps show **Shared Identity is switched off** | `Switching_F3_off_falls_back_to_phase1_login…` |
| Flag switched on: existing sessions not broken, users migrated transparently | ✅ | Signed in with the Phase 1 login (e.g. `98123 45678` / `demo1234`), switch on → **Moved to Shared Identity**, no sign-in | `Phase1_session_moves_onto_shared_identity_when_F3_is_switched_on…` |
| Switch off again after a defect, without an app store release | ✅ | Toggle works both ways at runtime | `Switching_F3_off…` |

## F3-S06 Admin view of roles and KYC (3 pts, Should)

| Acceptance criterion | Status | In the demo | Automated test |
|---|---|---|---|
| All roles, verified contacts and KYC status in one view | ✅ | Admin → **Identities** (also shows each identity's signed-in devices) | `Existing_UserApp_phone…` |
| Approve or reject pending KYC with a reason; status updates immediately | ✅ | **Verify KYC**, or **Reject…** → reason → the person sees *Not accepted: reason* and can resubmit | `Admin_rejects_kyc_with_a_reason…` |

## F3-S07 Targeted pen test before launch (5 pts, Must)

⬜ A delivery activity (13–16 Oct), not a POC feature. The controls it would test are in the POC: OTP proof before linking, hashed codes, attempt caps, per number / device / IP limits, lockout, app-scoped tokens, per-device revocation, admin never self-granted, audit of every decision.

## Identity enablers and related stories

| Story | Status | Note |
|---|---|---|
| EN-S01 Duplicate report with matching signal | ✅ | Admin → Phase 1 & bootstrap → **Duplicate candidates**: each phone/email shared by more than one identity, with the records |
| EN-S02 Merge duplicates under approved rules | ⬜ | R2, needs SportSeek's merge rules (D18). Detection is ready; merge, re-pointing and rollback are not in the POC |
| F4-S02 Role-scoped notification preferences | ⬜ | R2 (F4). The identity model keeps roles separate per identity, which this builds on |

## Ready-made demo data

| Who | Sign in | What it shows |
|---|---|---|
| **Kavya Reddy** (demo identity) | `+91 90000 00002` or `kavya.reddy@example.com`, password `Demo@2026` | Player on the User App, Coach on the Partner App, KYC verified once: Shared Identity without registering first |
| **SportSeek Ops Admin** | `+91 90000 00001`, OTP or password `Admin@2026` | Admin Portal |
| Phase 1 accounts | e.g. Sneha `98123 45678`, Arjun `98765 43210`, password `demo1234` | Phase 1 login, bootstrap, duplicates, hand-over |
