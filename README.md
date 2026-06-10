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

The codebase contains a React Native/Expo frontend and an Express/MongoDB backend from an earlier cloud/API direction. The active app is now local-first: normal job workflows use on-device storage and do not require API credentials, authentication, MongoDB, or a running backend.

Treat backend/auth/cloud storage code as legacy unless a task explicitly says otherwise. Frontend auth screens, auth context, and `API_URL` configuration have been removed from the normal app surface.

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
- Expo SDK 56
- React Navigation
- Local database, preferably SQLite
- App/device file storage for photos
- Expo Image Picker
- Expo Notifications
- Expo sharing/printing tools where useful
- Ads SDK, likely Google AdMob
- In-app purchase SDK, likely RevenueCat or platform-native IAP

### Optional Legacy Backend

- Node.js
- Express
- MongoDB and Mongoose
- Puppeteer for server-side PDF generation

The backend is optional legacy code. It may remain useful for old tests, experiments, or future optional backup features, but it is not required for the local-first MVP.

## Project Structure

```text
.
├── backend/                  # Optional legacy API from earlier backend-first direction
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
├── PRIVACY_POLICY.md
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

### Optional Legacy Backend

The backend is optional legacy code. Run it only when working on existing backend tests, comparing legacy behavior, or intentionally experimenting with future optional backend features.

```sh
cd backend
cp .env.example .env
npm install
npm run dev
```

## Local-First Storage Plan

The app uses this local-first model:

- Jobs stored in a local SQLite database.
- Photos copied into app-owned local file storage.
- Job records store local photo paths, not remote URLs.
- Reminders scheduled locally on the device.
- Reports generated locally or assembled into shareable device files.
- Manual backup export through the device share sheet.

## Privacy And Data Safety

The app includes an in-app device storage note and a backup reminder on the Jobs screen. Normal job workflows do not send job records, customer details, reminders, photos, or reports to a backend.

Use [PRIVACY_POLICY.md](PRIVACY_POLICY.md) for app store privacy policy text. It documents local storage, delete-app data risk, manual exports, non-personalized ad requests, one-time purchase validation, and the current no-analytics stance.

## Release Readiness

Store submission drafts and release QA notes live in `release/`:

- [App store listing draft](release/APP_STORE_LISTING.md)
- [Screenshot guidance](release/SCREENSHOTS.md)
- [Privacy labels and data safety draft](release/PRIVACY_LABELS.md)
- [Ads and purchase disclosure](release/MONETIZATION_DISCLOSURE.md)
- [Release test plan](release/RELEASE_TEST_PLAN.md)

These files are release-prep materials, not proof of store submission. Final screenshots, store privacy answers, production ad settings, purchase products, signing, and Android/iOS release artifacts must be verified in the relevant store and build tooling before launch.

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

Continue mobile polish and release readiness for the local-first app: first-launch ergonomics, empty states, permissions, accessibility, app icon/splash, app-store copy, privacy labels, screenshots, and fresh-install/update testing.
