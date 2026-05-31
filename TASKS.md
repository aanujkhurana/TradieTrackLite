# Production Readiness Tasks

This backlog turns TradieTrack Lite from an MVP into a production-ready and genuinely useful field app. Tasks are grouped roughly in recommended build order.

## Phase 1: Foundation

- [x] Add `.nvmrc` with a stable Node LTS version.
- [x] Update setup docs with exact supported Node and npm versions.
- [ ] Make the backend read `PORT` from `process.env.PORT`.
- [ ] Add a startup check that fails clearly when `MONGO_URI` is missing.
- [ ] Add `GET /api/health` for deployment and uptime checks.
- [ ] Add global Express error-handling middleware.
- [ ] Return consistent API error responses, for example `{ "error": { "code": "...", "message": "..." } }`.
- [ ] Validate Mongo ObjectIds before `findById`, `findByIdAndUpdate`, and `findByIdAndDelete`.
- [ ] Add request logging for method, path, status, and latency.

## Phase 2: Security And Accounts

- [ ] Add user authentication.
- [ ] Add a `User` model.
- [ ] Add job ownership with `userId` on every job.
- [ ] Ensure users can only list, edit, delete, and export their own jobs.
- [ ] Add protected route middleware.
- [ ] Restrict CORS to known frontend origins.
- [ ] Add API rate limiting.
- [ ] Sanitize values interpolated into PDF HTML.
- [ ] Move secrets and environment-specific values out of code.

## Phase 3: Job Model Improvements

- [ ] Separate job title from customer name.
- [ ] Add customer phone number.
- [ ] Add customer email.
- [ ] Add optional customer notes.
- [ ] Add tap-to-call support in the mobile app.
- [ ] Add tap-to-message or tap-to-email support.
- [ ] Add Mongoose `{ timestamps: true }`.
- [ ] Add indexes for `userId`, `status`, `reminder`, and `createdAt`.
- [ ] Preserve the current behavior where completing a job auto-sets `endDate` if missing.

## Phase 4: Real Photo Storage

- [ ] Choose a storage provider, such as S3 or Supabase Storage.
- [ ] Add backend upload endpoint or signed upload URL flow.
- [ ] Store remote image URLs instead of local device URI strings.
- [ ] Generate and store photo thumbnails.
- [ ] Add upload progress state in the frontend.
- [ ] Add upload failure and retry handling.
- [ ] Add photo delete support.
- [ ] Include stored photos in exported PDF reports.

## Phase 5: PDF Export

- [ ] Generate PDF files that can be downloaded or shared from mobile.
- [ ] Store generated PDFs in cloud storage.
- [ ] Return a hosted PDF URL instead of a temporary local file path.
- [ ] Add PDF report fields for customer, address, status, notes, photos, start date, end date, and total logged time.
- [ ] Add a clear PDF generation loading state.
- [ ] Add retry handling for PDF failures.
- [ ] Add backend tests for PDF success, missing job, and generation failure.

## Phase 6: Search, Filters, And Daily Workflow

- [ ] Add job search by title, customer, address, and notes.
- [ ] Add status filters for pending, in progress, and completed jobs.
- [ ] Add sorting by newest, status, reminder date, and completed date.
- [ ] Add overdue reminder indicators.
- [ ] Add a dedicated reminders view.
- [ ] Add a job timeline with created, started, completed, edited, and note events.
- [ ] Add pull-to-refresh and empty/error states for filtered lists.

## Phase 7: Offline Support

- [ ] Add local persistence for jobs on device.
- [ ] Cache recently loaded jobs for offline viewing.
- [ ] Allow creating and editing jobs while offline.
- [ ] Track unsynced local changes.
- [ ] Sync queued changes when the network returns.
- [ ] Show clear synced/unsynced state in the UI.
- [ ] Resolve basic sync conflicts safely.

## Phase 8: Invoicing And Business Value

- [ ] Add quote/invoice line items.
- [ ] Add labour and materials totals.
- [ ] Add tax/GST configuration.
- [ ] Export quote PDF.
- [ ] Export invoice PDF.
- [ ] Add paid/unpaid invoice status.
- [ ] Add a simple dashboard for open jobs, completed jobs, hours logged, overdue reminders, and unpaid invoices.

## Phase 9: Monetization

- [ ] Define free-tier limits for active jobs, photos, and PDF exports.
- [ ] Define paid-tier capabilities.
- [ ] Choose Stripe, RevenueCat, or platform-native subscriptions.
- [ ] Add subscription entitlement checks on backend features.
- [ ] Add frontend paywall states for limited features.
- [ ] Add billing tests for free and paid access rules.

## Phase 10: Quality, CI, And Observability

- [ ] Add backend linting.
- [ ] Add frontend linting.
- [ ] Add CI for backend tests.
- [ ] Add CI for frontend tests.
- [ ] Add deployment workflow for the backend.
- [ ] Add Expo build workflow for mobile releases.
- [ ] Add Sentry or equivalent error tracking.
- [ ] Add mobile crash reporting.
- [ ] Add backend latency and error monitoring.
- [ ] Add E2E smoke tests for create job, edit job, attach photo, and export PDF.

## Suggested First Sprint

- [ ] Add `.nvmrc`.
- [ ] Make backend `PORT` configurable.
- [ ] Add `GET /api/health`.
- [ ] Add global API error handler.
- [ ] Add ObjectId validation.
- [ ] Add authentication and job ownership design.
- [ ] Choose photo/PDF storage provider.
