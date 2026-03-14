# Platform Standing To-Do

Items that are known gaps, stubs, or "coming soon" placeholders. Ordered by impact.

---

## File Storage
- **Native file upload** for deliverable submissions (currently URL-only: Google Drive, Dropbox)
  - Files: `components/platform/DeliverableSubmit.tsx`, `components/platform/DeliverableReview.tsx`
  - Needs: S3/Cloudflare R2 bucket, signed upload endpoint, progress indicator
  - Affects: all deliverable submissions across all user types

---

## Notifications
- **Granular notification preferences** in Settings
  - File: `app/(platform)/settings/page.tsx` (line ~130)
  - Toggles are hardcoded "on" with no backend state
  - Needs: `notificationPreferences` field on User model (JSON or separate table), PATCH API, wired toggles

---

## Timesheets (MECE Redesign Required)
- **Rate-type aware timesheet model** — current model uses `estimatedHours` from assignment as per-session hours, which is conceptually wrong
  - Four rate types need different UX: HOURLY (user enters hours), DAILY (logs 1 day), MONTHLY (selects period), FIXED_PROJECT (activity-only)
  - Schema changes needed: add `DAILY` to `RateType` enum, add `hoursWorked`, `periodMonth`, `periodYear`, `isForBilling`, `rejectionReason` to `TimeEntry`, add `estimatedDays` to `Assignment`
  - Files: `components/platform/TimesheetManager.tsx`, `app/api/time-entries/route.ts`, `app/(platform)/timesheets/page.tsx`

---

## RBAC Fixes (MECE Audit)
- **POST `/api/time-entries`** has no role guard — any authenticated user can create time entries (should be CONSULTANT only)
- **`/consultants/[id]`** — no guard preventing CONSULTANTs from viewing other consultant profiles by direct URL (including rates)
- **`/api/ai/ask`** — blocks CONSULTANTs at API level but UI now shows them Imara features (need to open with scoped data)
- **Settings `isAdmin`** still includes DIRECTOR — should be `["PARTNER", "ADMIN"]`

---

## Proposals
- Proposal Generator in Imara links to `/proposals` which has no full implementation beyond the AI draft
- Needs: Proposal model in schema, CRUD pages, PDF export

---

## Director / Partner Management System (Backlogged Feature)
- Full Director onboarding portal (5-step wizard)
- Director dashboard with practice-level P&L
- Executive coaching system via Imara
- Partner-level board reporting

---

## Minor UX Gaps
- **Deliverable `Details` toggle** still visible when assign form is open in `ConsultantMatchingWidget` — small z-index / layout conflict
- **"Back" link in ProjectTabs** goes to `/dashboard` not `/projects` — probably should go to projects list
- **Consultant profile back link** (`/consultants/[id]`) goes to `/consultants` but CONSULTANTs are redirected away from that page
- **Talent Pipeline page** — exists but content depth unknown, needs audit
- **Knowledge Hub** — component exists but integration depth unknown

---

*Last updated: 2026-03-14*
