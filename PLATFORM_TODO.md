# Platform Standing To-Do

Items that are known gaps, stubs, or "coming soon" placeholders. Ordered by impact.

---

## File Storage
- **Native file upload** for deliverable submissions (currently URL-only: Google Drive, Dropbox, OneDrive)
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

## Maarova Portal (Next Steps)
- Expand question bank (currently ~5 per module, needs 20-30+ per module for production)
- PDF report generation (currently placeholder button)
- Maarova admin pages in CFA platform (org management, user provisioning, analytics)
- 360 rater email invitations (records created, emails not yet sent)
- Coach matching AI integration (placeholder API exists)
- WhatsApp notification integration for assessment reminders

---

## Minor UX Gaps
- **Talent Pipeline page** -- exists but content depth unknown, needs audit
- **Knowledge Hub** -- component exists but integration depth unknown
- **Client portal password reset** -- no forgot password mechanism

---

## Completed (2026-03-16)

### Platform Fixes
- ~~**POST `/api/time-entries`** has no role guard~~ -- Fixed: guards to CONSULTANT + EM only
- ~~**`/consultants/[id]`** no guard preventing CONSULTANTs from viewing other profiles~~ -- Fixed: redirects to /dashboard
- ~~**`/api/ai/ask`** blocks CONSULTANTs~~ -- Fixed: open to consultants with scoped data
- ~~**Settings `isAdmin`** includes DIRECTOR~~ -- Fixed: now PARTNER + ADMIN only
- ~~**Back link in ProjectTabs** goes to /dashboard~~ -- Fixed: goes to /projects
- ~~**Consultant profile back link** goes to /consultants for CONSULTANTs~~ -- Fixed: goes to /dashboard
- ~~**Deliverable Details toggle** z-index in ConsultantMatchingWidget~~ -- Fixed: collapses details on assign
- ~~**Deliverable management** (edit, reassign)~~ -- Built: full edit/reassign flow with audit trail
- ~~**Academy assessment crash** (opts.map not a function)~~ -- Fixed: proper JSON parsing
- ~~**Academy resources links** not clickable~~ -- Fixed: external links render as `<a>` tags
- ~~**Assessment retry** creates duplicate answers~~ -- Fixed: clears old answers before saving
- ~~**Imara references** in database~~ -- Fixed: replaced with Nuru
- ~~**Em dash violations** (7 instances)~~ -- Fixed across all files
- ~~**Missing `/clients/[id]` detail page**~~ -- Built with contacts, projects, deliverables
- ~~**User delete + resend invite**~~ -- Built in admin user management
- ~~**Invite email HTML escaping bug**~~ -- Fixed, overhauled with CFA intro and role descriptions
- ~~**Password validation mismatch** (8 vs 10 chars)~~ -- Synced client-side to match server regex
- ~~**"Native upload coming soon" text**~~ -- Removed, now says "Google Drive, Dropbox, OneDrive"
- ~~**ChangePasswordForm "Minimum 8 characters"**~~ -- Updated to "Minimum 10 characters"

### Maarova Marketing
- ~~**Maarova hero CTAs link to /#contact**~~ -- Fixed: link to /maarova/demo and /maarova/assessment
- ~~**Maarova not MECE**~~ -- Built 7 sub-pages: assessment, recruitment, development, intelligence, services, demo
- ~~**No cross-navigation between Maarova pages**~~ -- Built MaarovaNav component on all sub-pages
- ~~**Services page orphaned**~~ -- Linked from landing page with dedicated banner
- ~~**"Book a Consultation" CTA inconsistency**~~ -- Changed to "Book a Demo" on services page

### Client Portal
- ~~**Basic dashboard**~~ -- Upgraded with welcome header, stat cards, enriched project cards
- ~~**Basic project detail**~~ -- Upgraded with phase stepper, all deliverables, payment milestones
- ~~**No client portal invite email**~~ -- Built: automated email when portal access enabled
- ~~**No CFA logo in client portal**~~ -- Added to all portal pages
- ~~**Impact Dashboard**~~ -- Built at /client/projects/[id]/impact
- ~~**Executive Summary**~~ -- Built at /client/projects/[id]/report (printable)
- ~~**Document Repository**~~ -- Built at /client/projects/[id]/documents
- ~~**Deliverable Feedback**~~ -- Built at /client/projects/[id]/deliverables/[id] with comments
- ~~**Knowledge Library**~~ -- Built at /client/knowledge
- ~~**Expansion CTA**~~ -- Built component + API for pipeline feed
- ~~**Satisfaction Pulse**~~ -- Built component + API for monthly rating
- ~~**Tab navigation missing on sub-pages**~~ -- Added ClientProjectNav to all project sub-pages
- ~~**Deliverable detail unreachable**~~ -- Deliverable names now link to detail page
- ~~**Knowledge library not linked from dashboard**~~ -- Added link card

### Maarova Portal (New)
- ~~**Auth system**~~ -- JWT-based, separate from platform and client portal
- ~~**Portal layout**~~ -- Dark sidebar with Maarova branding
- ~~**Login page**~~ -- Dark-themed with CFA logo
- ~~**Dashboard**~~ -- Assessment status, coaching, development goals
- ~~**Assessment engine**~~ -- 6 modules with 6 question formats, auto-save, scoring
- ~~**Scoring engine**~~ -- DISC, Values, EQ, CILTI, Culture, 360, Composite (7 modules)
- ~~**Results pages**~~ -- SVG radar chart, dimension breakdown, archetype
- ~~**AI report generation**~~ -- Claude-powered leadership profile narrative
- ~~**Development goals**~~ -- CRUD + AI-suggested goals
- ~~**Coaching match**~~ -- Placeholder with coach model
- ~~**360 feedback**~~ -- Request management, rater invitations, token-based public rater page
- ~~**Schema**~~ -- 15 new models, 9 enums, migration applied

---

*Last updated: 2026-03-16*
