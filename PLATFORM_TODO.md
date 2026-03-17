# Platform Standing To-Do

Items that are known gaps, stubs, or "coming soon" placeholders. Ordered by impact.

---

## Director / Partner Management System (Backlogged Feature)
- Full Director onboarding portal (5-step wizard)
- Director dashboard with practice-level P&L
- Executive coaching system via Nuru
- Partner-level board reporting

---

## Maarova Portal (Next Steps)
- Expand question bank (currently ~5 per module, needs 20-30+ per module for production)
- Coach matching AI integration (placeholder API exists)
- WhatsApp notification integration for assessment reminders

---

## Minor UX Gaps
- **Talent Pipeline page** -- exists but content depth unknown, needs audit
- **Knowledge Hub** -- component exists but integration depth unknown

---

## Completed (2026-03-16)

### Security & API Hardening (2026-03-17)
- ~~**Deliverable IDOR vulnerability**~~ -- Fixed: PATCH/DELETE now verify project ownership, EMs scoped to their projects
- ~~**Invoice race condition**~~ -- Fixed: invoice number generation now uses existence check + retry loop
- ~~**Missing invoice GET endpoint**~~ -- Built: GET /api/invoices with clientId/projectId/status filters, EM scoped
- ~~**Missing consultant ratings GET**~~ -- Built: GET /api/consultant-ratings with role-based scoping, consultants see own
- ~~**Invoice financial validation**~~ -- Fixed: quantity must be > 0, unitPrice must be >= 0
- ~~**Timesheet hours validation**~~ -- Fixed: minimum 0.25h enforced (was allowing 0)
- ~~**Password regex inconsistency**~~ -- Fixed: unified to `[^a-zA-Z0-9]` across all 8 validation points
- ~~**Platform forgot password**~~ -- Built: /forgot-password, /reset-password, API routes, email template
- ~~**Maarova forgot password**~~ -- Built: /maarova/portal/forgot-password, reset-password, API routes, email template
- ~~**Client contact edit**~~ -- Built: PATCH endpoint on /api/clients/[id]/contacts, inline edit UI
- ~~**Footer broken links**~~ -- Fixed: all anchors replaced with real page routes, MECE structure
- ~~**Navbar/Footer not MECE**~~ -- Fixed: Navbar (About, Services, Maarova, Insights, Careers, Contact), Footer (Services, Company, Contact)
- ~~**SEO metadata missing**~~ -- Built: OG tags, Twitter cards, title template, web manifest, PWA icons, apple-touch-icon

### Infrastructure & Core Systems
- ~~**Native file upload**~~ -- Built: Cloudflare R2 integration (`lib/r2.ts`), presigned upload API, drag-and-drop FileUpload component, wired into DeliverableSubmit
- ~~**Notification preferences**~~ -- Built: `notificationPreferences` JSON field on User, GET/PATCH API at `/api/settings/notifications`, toggle UI component wired to DB
- ~~**Timesheet model redesign**~~ -- Built: `DAILY` rate type, `hoursWorked`/`periodMonth`/`periodYear`/`isForBilling`/`rejectionReason` on TimeEntry, `estimatedDays` on Assignment, rate-type-aware logging UX
- ~~**Proposal system**~~ -- Built: Proposal model with CRUD, AI generation via Nuru, status transitions (Draft > Review > Sent > Accepted/Rejected), PDF export, list/detail/filter UI
- ~~**Client portal password reset**~~ -- Built: forgot-password + reset-password pages, token-based flow with 1-hour expiry, email template
- ~~**Maarova 360 rater emails**~~ -- Built: invitation emails sent automatically when raters are added
- ~~**Maarova admin analytics**~~ -- Built: completion funnel, score distribution, avg completion time, org detail user management enhancements
- ~~**Maarova PDF report**~~ -- Built: client-side PDF export for assessment results

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

*Last updated: 2026-03-17*
