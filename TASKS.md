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

- [ ] Keep using the device camera through Expo Image Picker.
- [ ] Copy captured photos into app-controlled local file storage.
- [ ] Store local photo file paths on the job record.
- [ ] Display locally stored photos in job detail.
- [ ] Add photo delete support.
- [ ] Remove assumptions about remote photo URLs for the MVP.
- [ ] Add a simple photo storage cleanup path when a job is deleted.
- [ ] Add tests for photo URI append/delete behavior.

## Phase 3: Local Reminders And Job Workflow

- [ ] Keep reminders as local notifications.
- [ ] Store reminder date/time in the local job record.
- [ ] Show reminder state clearly on job detail.
- [ ] Add overdue reminder indicators in the job list.
- [ ] Add simple status filters for pending, in progress, and completed.
- [ ] Add search by job title, customer, address, and notes.
- [ ] Preserve current completed-job behavior: auto-set `endDate` if missing.
- [ ] Keep time logged calculation local.

## Phase 4: Local Reports And Export

- [ ] Replace backend PDF generation with local report generation.
- [ ] Evaluate Expo Print, Expo Sharing, or a lightweight HTML-to-PDF approach.
- [ ] Include job title, customer details, address, status, notes, photos, start/end dates, and total logged time in reports.
- [ ] Share reports through the device share sheet.
- [ ] Add clear loading and error states for report generation.
- [ ] Add a manual data export option for backup.
- [ ] Add a manual data import option only if it stays simple and reliable.

## Phase 5: Ads And One-Time Ad-Free Purchase

- [ ] Choose ads provider, likely Google AdMob.
- [ ] Add ad placement that does not block job-site workflows.
- [ ] Avoid ads on critical save/delete/report actions.
- [ ] Choose purchase approach, likely RevenueCat or platform-native IAP.
- [ ] Add one-time ad-free purchase.
- [ ] Add restore purchase support.
- [ ] Store ad-free entitlement locally after purchase validation.
- [ ] Hide ads for ad-free users.
- [ ] Add tests or mocks around ad-free entitlement logic.

## Phase 6: Privacy, Backup, And Data Safety

- [ ] Add an in-app note that job data is stored on this device.
- [ ] Warn that deleting the app may delete app data.
- [ ] Add a simple backup/export reminder.
- [ ] Add a privacy policy for app stores.
- [ ] Make sure no unnecessary personal data is sent to a backend.
- [ ] Remove or disable analytics unless explicitly needed.
- [ ] If analytics are added later, keep them anonymous and minimal.

## Phase 7: Legacy Backend Cleanup

- [ ] Decide whether to remove `backend/` entirely for the MVP.
- [ ] If keeping backend, mark it as optional/legacy in docs.
- [ ] Remove frontend dependency on `API_URL` for normal job workflows.
- [ ] Remove auth screens and auth context if no longer needed.
- [ ] Remove backend-only production tasks from the active roadmap.
- [ ] Keep useful tests or fixtures only if they still help the local-first app.

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
