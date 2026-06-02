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

## Implementation Notes

- Preserve status enum values: `pending`, `in_progress`, `completed`.
- Preserve completed-job behavior: if a job is marked completed and `endDate` is missing, auto-set `endDate`.
- Keep customer details separate from job title.
- Keep reminders local.
- Keep photos local.
- Before removing legacy backend/auth code, first ensure the frontend has working local replacements.
- Commit and push each coherent checkpoint if the user has asked to maintain that workflow.
