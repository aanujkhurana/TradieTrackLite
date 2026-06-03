# TradieTrack Lite

TradieTrack Lite is intended to be a simple, local-first mobile job tracker for tradies. The product goal is: install it, open it, and start tracking jobs immediately without creating an account.

The app should be free to use with ads, with a one-time purchase to remove ads. Job data, photos, reminders, and reports should live on the user's device by default.

## Product Direction

TradieTrack Lite should prioritize:

- No login or account setup.
- Local on-device job storage.
- Photos stored in app/device storage.
- Local reminders for follow-ups.
- Local export/share for job records and reports.
- Free ad-supported use.
- One-time purchase for an ad-free experience.
- Clear user expectations: data stays on the phone unless exported or backed up.

This direction intentionally avoids cloud sync, user accounts, subscriptions, teams, and backend storage for the MVP.

## Current Repository State

The codebase currently contains a React Native/Expo frontend and an Express/MongoDB backend from an earlier cloud/API direction. Recent work added authentication and user-scoped backend jobs, but the product direction has now changed.

Treat backend/auth/cloud storage code as legacy unless a task explicitly says otherwise. The next implementation work should move normal app usage back to local mobile storage and remove the need for a backend during everyday use.

## What The App Should Do

- Create jobs with job title, customer details, address, notes, status, and reminders.
- View jobs in a simple mobile list with status and logged time.
- Edit job details on-site.
- Attach job photos from the device camera.
- Store photos locally in app-controlled device storage.
- Trigger local notifications for reminders.
- Export or share a job report from the device.
- Show ads in the free version.
- Hide ads after a one-time purchase.

## Tech Stack

### Mobile App

- React Native
- Expo
- React Navigation
- Local database, preferably SQLite
- App/device file storage for photos
- Expo Image Picker
- Expo Notifications
- Expo sharing/printing tools where useful
- Ads SDK, likely Google AdMob
- In-app purchase SDK, likely RevenueCat or platform-native IAP

### Legacy Backend

- Node.js
- Express
- MongoDB and Mongoose
- Puppeteer for server-side PDF generation

The backend may remain useful for tests, experiments, or future optional backup features, but it should not be required for the local-first MVP.

## Project Structure

```text
.
├── backend/                  # Legacy API from earlier backend-first direction
│   ├── index.js
│   ├── models/
│   └── tests/
├── frontend/                 # Expo React Native app
│   ├── App.js
│   └── src/
│       ├── screens/
│       ├── utils/
│       └── __tests__/
├── AGENTS.md
├── TASKS.md
└── README.md
```

## Requirements

- Node.js `v24.16.0` LTS
- npm `11.13.0`
- Expo Go, an iOS simulator, or an Android emulator

Use the version pinned in `.nvmrc`:

```sh
nvm install
nvm use
node -v
npm -v
```

## Setup

### Frontend

```sh
cd frontend
npm install
npm start
```

### Backend

The backend is currently legacy. Run it only when working on existing backend tests or while removing/migrating backend-dependent features.

```sh
cd backend
cp .env.example .env
npm install
npm run dev
```

## Local-First Storage Plan

The app should move toward this model:

- Jobs stored in a local SQLite database.
- Photos copied into app-owned local file storage.
- Job records store local photo paths, not remote URLs.
- Reminders scheduled locally on the device.
- Reports generated locally or assembled into shareable device files.
- Optional manual export/backup can come later.

## Monetization Plan

Free version:

- Full useful job tracking.
- Ads displayed in non-critical parts of the app.
- Google AdMob banner ads are wired for the jobs list.

One-time purchase:

- Removes ads permanently.
- Purchase should be restorable through the app store account.
- RevenueCat is wired for a one-time `ad_free` entitlement.

Avoid subscriptions unless the product later adds cloud sync, team features, or ongoing server costs.

### Monetization Configuration

Real ads and purchases require a native development or store build with app-store configuration. The repo does not include production credentials.

Set these environment variables before building monetized releases:

```sh
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID=...
EXPO_PUBLIC_ADMOB_IOS_APP_ID=...
EXPO_PUBLIC_ADMOB_ANDROID_BANNER_AD_UNIT_ID=...
EXPO_PUBLIC_ADMOB_IOS_BANNER_AD_UNIT_ID=...
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=...
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=...
EXPO_PUBLIC_AD_FREE_PRODUCT_ID=tradietrack_lite_ad_free
EXPO_PUBLIC_AD_FREE_ENTITLEMENT_ID=ad_free
```

Development builds use Google test banner IDs when production banner unit IDs are absent. Purchases remain unavailable until RevenueCat keys and store products are configured.

## Testing

Run frontend tests:

```sh
cd frontend
npm test
```

Run backend tests only when touching legacy backend code:

```sh
cd backend
npm test
```

## User-Facing Data Expectations

The app should clearly communicate:

- Data is stored on this device.
- Deleting the app may delete the app data.
- Photos and jobs will not automatically sync to another device.
- Users should export or back up important records.

## Next Build Priority

Start by replacing backend-backed job flows with local mobile storage. After that, move photos into app-local storage, remove login from the normal app flow, and then add ads plus a one-time ad-free purchase.
