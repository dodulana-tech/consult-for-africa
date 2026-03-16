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
- **Rate-type aware timesheet model** -- current model uses `estimatedHours` from assignment as per-session hours, which is conceptually wrong
  - Four rate types need different UX: HOURLY (user enters hours), DAILY (logs 1 day), MONTHLY (selects period), FIXED_PROJECT (activity-only)
  - Schema changes needed: add `DAILY` to `RateType` enum, add `hoursWorked`, `periodMonth`, `periodYear`, `isForBilling`, `rejectionReason` to `TimeEntry`, add `estimatedDays` to `Assignment`
  - Files: `components/platform/TimesheetManager.tsx`, `app/api/time-entries/route.ts`, `app/(platform)/timesheets/page.tsx`

---

## Proposals
- Proposal Generator in Nuru links to `/proposals` which has no full implementation beyond the AI draft
- Needs: Proposal model in schema, CRUD pages, PDF export

---

## Director / Partner Management System (Backlogged Feature)
- Full Director onboarding portal (5-step wizard)
- Director dashboard with practice-level P&L
- Executive coaching system via Nuru
- Partner-level board reporting

---

## Minor UX Gaps
- **Talent Pipeline page** -- exists but content depth unknown, needs audit
- **Knowledge Hub** -- component exists but integration depth unknown

---

## Completed (2026-03-16)

- ~~**POST `/api/time-entries`** has no role guard~~ -- Fixed: guards to CONSULTANT + EM only
- ~~**`/consultants/[id]`** no guard preventing CONSULTANTs from viewing other profiles~~ -- Fixed: redirects to /dashboard
- ~~**`/api/ai/ask`** blocks CONSULTANTs~~ -- Fixed: open to consultants with scoped data (own assignments, deliverables, timesheets only)
- ~~**Settings `isAdmin`** includes DIRECTOR~~ -- Fixed: now PARTNER + ADMIN only
- ~~**Back link in ProjectTabs** goes to /dashboard~~ -- Fixed: goes to /projects
- ~~**Consultant profile back link** goes to /consultants for CONSULTANTs~~ -- Fixed: goes to /dashboard for consultants
- ~~**Deliverable Details toggle** z-index in ConsultantMatchingWidget~~ -- Fixed: collapses details on assign
- ~~**Deliverable management** (edit, reassign)~~ -- Built: full edit/reassign flow with audit trail
- ~~**Academy assessment crash** (opts.map not a function)~~ -- Fixed: proper JSON parsing for options/caseStudy
- ~~**Academy resources links** not clickable~~ -- Fixed: external links now render as `<a>` tags
- ~~**Assessment retry** creates duplicate answers~~ -- Fixed: clears old answers before saving
- ~~**Imara references** in database~~ -- Fixed: replaced with Nuru in all stored records

---

*Last updated: 2026-03-16*
