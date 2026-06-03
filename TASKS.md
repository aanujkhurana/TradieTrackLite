# TradieTrack Lite Tasks

This backlog reflects the current product direction: a simple, no-auth, local-first mobile app for tradies. The app should be free with ads and offer a one-time purchase to remove ads.

Backend/auth/cloud work from earlier phases is now considered legacy unless a task explicitly says to preserve it.

## Phase 0: Product Direction Reset

- [x] Decide on local-first, no-auth product direction.
- [x] Decide against Supabase/cloud photo storage for the MVP.
- [x] Decide on free-with-ads monetization.
- [x] Decide on one-time purchase for ad-free experience.
- [x] Update `README.md` for the local-first direction.
- [x] Update `AGENTS.md` for the local-first direction.
- [x] Rewrite `TASKS.md` around local storage, ads, and one-time purchase.

## Phase 1: Remove Backend Dependency From Normal App Use

- [x] Add a local data access layer in the frontend.
- [x] Choose and install a local database library, preferably SQLite.
- [x] Create a local job schema for job title, customer details, address, notes, status, dates, reminders, and photos.
- [x] Add local CRUD helpers for jobs.
- [x] Replace `Jobs` screen API loading with local database loading.
- [x] Replace `CreateJob` API submission with local database insert.
- [x] Replace `JobDetail` API update with local database update.
- [x] Replace delete API calls with local database delete.
- [x] Remove login/register from the normal app launch flow.
- [x] Remove bearer-token requirements from frontend job flows.
- [x] Keep backend code only as legacy or remove it after frontend is fully local.
- [x] Update tests to cover local job create, list, update, and delete.

## Phase 2: Local Photo Storage

- [x] Keep using the device camera through Expo Image Picker.
- [x] Copy captured photos into app-controlled local file storage.
- [x] Store local photo file paths on the job record.
- [x] Display locally stored photos in job detail.
- [x] Add photo delete support.
- [x] Remove assumptions about remote photo URLs for the MVP.
- [x] Add a simple photo storage cleanup path when a job is deleted.
- [x] Add tests for photo URI append/delete behavior.

## Phase 3: Local Reminders And Job Workflow

- [x] Keep reminders as local notifications.
- [x] Store reminder date/time in the local job record.
- [x] Show reminder state clearly on job detail.
- [x] Add overdue reminder indicators in the job list.
- [x] Add simple status filters for pending, in progress, and completed.
- [x] Add search by job title, customer, address, and notes.
- [x] Preserve current completed-job behavior: auto-set `endDate` if missing.
- [x] Keep time logged calculation local.

## Phase 4: Local Reports And Export

- [x] Replace backend PDF generation with local report generation.
- [x] Evaluate Expo Print, Expo Sharing, or a lightweight HTML-to-PDF approach.
- [x] Include job title, customer details, address, status, notes, photos, start/end dates, and total logged time in reports.
- [x] Share reports through the device share sheet.
- [x] Add clear loading and error states for report generation.
- [x] Add a manual data export option for backup.
- [ ] Add a manual data import option only if it stays simple and reliable.

## Phase 5: Ads And One-Time Ad-Free Purchase

- [x] Choose ads provider, likely Google AdMob.
- [x] Add ad placement that does not block job-site workflows.
- [x] Avoid ads on critical save/delete/report actions.
- [x] Choose purchase approach, likely RevenueCat or platform-native IAP.
- [x] Add one-time ad-free purchase.
- [x] Add restore purchase support.
- [x] Store ad-free entitlement locally after purchase validation.
- [x] Hide ads for ad-free users.
- [x] Add tests or mocks around ad-free entitlement logic.

## Phase 6: Privacy, Backup, And Data Safety

- [x] Add an in-app note that job data is stored on this device.
- [x] Warn that deleting the app may delete app data.
- [x] Add a simple backup/export reminder.
- [x] Add a privacy policy for app stores.
- [x] Make sure no unnecessary personal data is sent to a backend.
- [x] Remove or disable analytics unless explicitly needed.
- [x] If analytics are added later, keep them anonymous and minimal.

## Phase 7: Legacy Backend Cleanup

- [x] Decide whether to remove `backend/` entirely for the MVP.
- [x] If keeping backend, mark it as optional/legacy in docs.
- [x] Remove frontend dependency on `API_URL` for normal job workflows.
- [x] Remove auth screens and auth context if no longer needed.
- [x] Remove backend-only production tasks from the active roadmap.
- [x] Keep useful tests or fixtures only if they still help the local-first app.

## Phase 8: Mobile Polish

- [ ] Make first launch go straight to jobs.
- [ ] Add a helpful empty state.
- [ ] Keep buttons large and job-site friendly.
- [ ] Improve offline/no-permission messages.
- [ ] Add loading states for local database initialization.
- [ ] Check small-screen layout for all forms.
- [ ] Check large-text accessibility.
- [ ] Add app icon and splash screen.

## Phase 9: Release Readiness

- [ ] Add app store description focused on no-login local job tracking.
- [ ] Add screenshots.
- [ ] Add privacy labels.
- [ ] Add ad disclosure.
- [ ] Add purchase restore instructions.
- [ ] Test fresh install.
- [ ] Test app update with existing local data.
- [ ] Test delete/reinstall data behavior.
- [ ] Build Android release.
- [ ] Build iOS release.

## Later, Only If Needed

- [ ] Optional cloud backup.
- [ ] Optional sync across devices.
- [ ] Optional teams.
- [ ] Optional invoicing.
- [ ] Optional subscriptions if recurring cloud costs are introduced.
