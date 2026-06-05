# AGENTS.md

Guidance for coding agents working on TradieTrack Lite.

## Current Product Direction

TradieTrack Lite should be a simple, local-first mobile job tracker for tradies.

The intended MVP is:

- No authentication.
- No required backend.
- No cloud storage.
- Jobs stored on the mobile device.
- Photos stored in app/device storage.
- Local reminders.
- Local export/share for reports.
- Free with ads.
- One-time purchase to remove ads.

Do not add cloud sync, user accounts, subscriptions, teams, or backend storage unless the user explicitly changes the product direction again.

## Important Context

The repository currently contains backend/auth work from an earlier production-readiness direction. That work is now legacy for the MVP. Treat it as something to remove, bypass, or quarantine when implementing the local-first app.

The active roadmap is [TASKS.md](/Users/Aanuj/softwares/TradieTrackLite/TASKS.md). Follow that file over older notes, previous commits, or `App_Readme.md`.

## Repository Layout

- `frontend/`: Expo React Native app and current primary product surface.
- `frontend/App.js`: App shell and navigation.
- `frontend/src/screens/Jobs.js`: Job list.
- `frontend/src/screens/CreateJob.js`: New job form.
- `frontend/src/screens/JobDetail.js`: Edit job, status, photos, reminders, contact actions, time logging.
- `frontend/src/utils/time.js`: Date parsing and logged-time formatting helpers.
- `backend/`: Legacy Express/MongoDB API from earlier backend-first direction.
- `backend/tests/api.test.js`: Legacy backend tests.
- `TASKS.md`: Current local-first roadmap.
- `README.md`: Current product and setup documentation.

## Development Priorities

When implementing new work:

- Prefer frontend/mobile local storage over backend APIs.
- Prefer SQLite or another durable local database for job records.
- Prefer app-controlled local file storage for photos.
- Preserve job-site usability: large touch targets, minimal steps, clear labels.
- Keep the app useful without internet access.
- Make data ownership obvious: records stay on the user's device unless exported.
- Keep monetization simple: ads for free users, one-time ad-free purchase.

## What To Avoid

- Do not add login screens for the MVP.
- Do not require `API_URL` for normal job workflows.
- Do not store job photos in Supabase, S3, or another cloud provider for the MVP.
- Do not introduce subscriptions unless recurring cloud features are explicitly added.
- Do not build team/multi-user features.
- Do not make broad backend changes unless they support removing backend dependency or maintaining legacy tests.

## Run Commands

Frontend:

```sh
cd frontend
npm install
npm start
```

Backend, only for legacy backend work:

```sh
cd backend
npm install
npm test
```

## Test Commands

Frontend:

```sh
cd frontend
npm test
```

Backend, only when touching backend code:

```sh
cd backend
npm test
```

## Asset build

```sh
cd frontend
npm run build:assets
```

Regenerates `assets/icon.png`, `assets/adaptive-icon.png`,
`assets/splash.png`, the full iOS + Android icon size set, and the
Play Store feature graphic placeholder. Run after any change to
`assets/icon-source.svg`, `assets/adaptive-icon-source.svg`, or
`assets/splash-source.svg`.

## E2E tests (Maestro)

```sh
brew install mobile-dev-inc/tap/maestro
cd frontend
maestro test e2e/create-job.yaml
maestro test e2e/settings-theme.yaml
```

Maestro tests run against a release or preview build installed on a
device or simulator.

## Implementation Notes

- Preserve status enum values: `pending`, `in_progress`, `completed`.
- Preserve completed-job behavior: if a job is marked completed and `endDate` is missing, auto-set `endDate`.
- Keep customer details separate from job title.
- Keep reminders local.
- Keep photos local.
- Before removing legacy backend/auth code, first ensure the frontend has working local replacements.
- Commit and push each coherent checkpoint if the user has asked to maintain that workflow.

## Production-readiness scaffolding (v2.1+)

The repo contains scaffolding for first store submission. Each item
below is a code / config building block; the human owner is
responsible for the values the stores review.

- `frontend/eas.json` — build + submit profiles (dev / preview /
  production). Configure EAS secrets before running `eas build`.
- `frontend/app.config.js` — bundle IDs, scheme, runtime version,
  iOS Info.plist (NSUserTrackingUsageDescription for AdMob,
  camera + photo library descriptions, ITSAppUsesNonExemptEncryption),
  Android permissions (CAMERA, READ_MEDIA_IMAGES, POST_NOTIFICATIONS,
  SCHEDULE_EXACT_ALARM, FOREGROUND_SERVICE).
- `frontend/STORE_METADATA.json` — description, keywords, category,
  data-safety draft. Read this file, then paste the values into App
  Store Connect / Play Console.
- `frontend/POLICY_PRIVACY.md`, `frontend/POLICY_TERMS.md`,
  `frontend/POLICY_REFUND.md` — legal copy placeholders. Must be
  reviewed and hosted at real public URLs before submission.
- `frontend/src/onboarding/Onboarding.js` — first-run tour that
  explains the local-first promise. Gated on
  `loadOnboardingState().hasSeenOnboarding`; reset from Settings.
- `frontend/src/components/ErrorBoundary.js` — global error
  boundary that shows an on-brand fallback screen. Wrap the app
  root with this before mounting the navigator.
- `frontend/src/observability/sentry.js` — opt-in crash reporting
  wired but disabled by default. Set `EXPO_PUBLIC_SENTRY_DSN` in
  EAS production profile to enable. Local-first promise preserved:
  no PII, no job records, no customer details in events.
- `frontend/src/privacy/battery.js` — Android reminder reliability
  helper. Settings surfaces a "Open Android settings" row so the
  user can mark the app as Unrestricted.
- `frontend/e2e/*.yaml` — Maestro E2E tests for the critical path
  and settings.

## Production-readiness gaps before public release

These are release gates, not dev-time concerns. They do not block
further feature work.

1. Real bundle ID + package in `app.config.js` (or
   `EXPO_PUBLIC_IOS_BUNDLE_IDENTIFIER` / `EXPO_PUBLIC_ANDROID_PACKAGE`
   EAS secrets).
2. Real AdMob + RevenueCat keys (see env list in
   `frontend/README.md` / repo root `README.md`).
3. Real Ad-free IAP product created in App Store Connect and Play
   Console.
4. Privacy / Terms / Refund policy hosted at real URLs; in-app
   `Linking.openURL` calls updated to point at them.
5. Play Store feature graphic (1024x500) — designer-owned asset.
6. Store screenshots for the required device classes.
7. Store metadata pasted into App Store Connect and Play Console.
8. TestFlight internal + Play internal track soak ≥ 1 week.
9. Real device QA on iOS 16/17/18 and Android 12/13/14/15.
10. Legal review of all three policy documents.
