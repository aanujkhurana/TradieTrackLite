# AGENTS.md

Guidance for coding agents working on TradieTrack Lite.

## App Summary

TradieTrack Lite is a React Native and Express app for tradespeople to track jobs, photos, reminders, job status, logged time, and PDF reports. The intended product is simple, fast, and mobile-first.

## Repository Layout

- `frontend/`: Expo React Native app.
- `frontend/App.js`: Stack navigation setup.
- `frontend/src/screens/Jobs.js`: Job list, summary counts, delete flow.
- `frontend/src/screens/CreateJob.js`: New job form and validation.
- `frontend/src/screens/JobDetail.js`: Edit job, status, photos, reminders, time logging, PDF action.
- `frontend/src/config.js`: API URL configuration.
- `frontend/src/utils/time.js`: Date parsing and logged-time formatting helpers.
- `backend/`: Express and MongoDB API.
- `backend/index.js`: API routes, validation, Mongo connection, PDF generation.
- `backend/models/Job.js`: Mongoose schema.
- `backend/tests/api.test.js`: Backend route and property tests.
- `App_Readme.md`: Original product/build specification.

## Run Commands

Backend:

```sh
cd backend
cp .env.example .env
npm install
npm run dev
```

If `nodemon` fails because of local watcher limits, use:

```sh
node index.js
```

Frontend:

```sh
cd frontend
npm install
npm start
```

For device testing, set `EXPO_PUBLIC_API_URL` to a reachable backend URL.

## Test Commands

Backend:

```sh
cd backend
npm test
```

Frontend:

```sh
cd frontend
npm test
```

## Implementation Notes

- Keep the app practical and job-site friendly: large touch targets, minimal steps, and clear error handling.
- Preserve the status enum values: `pending`, `in_progress`, `completed`.
- Keep backend validation aligned with the frontend forms.
- Do not mutate `createdAt` during job updates.
- When setting a job to `completed`, preserve the current behavior that auto-populates `endDate` if missing.
- Date fields should be valid date strings when sent to the backend.
- Avoid adding authentication, invoicing, payments, teams, or analytics unless explicitly requested; those are future features in the product spec.
- Do not introduce broad rewrites unless needed. This is a small MVP and benefits from straightforward code.

## Local Verification Notes

This repo was verified locally with:

- Backend running on `http://localhost:4000`.
- Expo Metro running on `exp://127.0.0.1:8081`.

The system Node `v26` caused dependency/runtime issues during verification. Prefer an LTS Node release or the bundled workspace Node runtime if available.
