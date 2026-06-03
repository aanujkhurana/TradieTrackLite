# Release Test Plan

This test plan documents the release-readiness checks for the local-first MVP. Mark checks complete only after they have been run on a real device, emulator, simulator, or store-equivalent release build.

## Automated Checks

- [x] Run frontend unit tests with `cd frontend && npm test -- --runInBand --watchman=false`.
- [x] Run Expo config validation with `cd frontend && npx expo config --type public`.
- [ ] Run Expo diagnostics with `cd frontend && npx expo-doctor` if network/tooling is available.

Last checked on June 3, 2026:

- Frontend tests passed: 2 suites, 44 tests.
- Expo public config loaded successfully for SDK 48.
- `expo-doctor` ran and reported 15/16 checks passing.
- Open blocker: Expo SDK 48 targets Android API level 33 or lower by default; Google Play submissions after August 31, 2024 require target API level 34 or higher. Upgrade to Expo SDK 50 or later before Android store submission.

## Fresh Install

- [ ] Install the app on a clean device or simulator with no prior TradieTrack Lite data.
- [ ] Confirm the first screen is the jobs list.
- [ ] Confirm no login, account setup, backend URL, or internet connection is required to create a job.
- [ ] Create a job with title, customer details, address, notes, pending status, and reminder.
- [ ] Attach a photo and confirm it remains visible after app restart.
- [ ] Confirm local reminder permission messaging is understandable.
- [ ] Generate and share a job report.
- [ ] Export a manual backup.
- [ ] Confirm banner ads appear only in non-critical app areas for the free version.
- [ ] Confirm the ad-free screen explains the one-time purchase and includes Restore Purchase.

## Update With Existing Local Data

- [ ] Install the previous release build.
- [ ] Create multiple jobs with different statuses, reminders, photos, notes, and logged time.
- [ ] Install the new release over the old release without deleting the app.
- [ ] Confirm local SQLite job records remain available.
- [ ] Confirm local photo paths still render.
- [ ] Confirm reminders, statuses, completed `endDate` behavior, and logged time still work.
- [ ] Confirm reports and backup exports still include the existing data.
- [ ] Confirm the ad-free entitlement remains active if it was previously validated on the device.

## Delete And Reinstall

- [ ] Export a backup before deletion.
- [ ] Delete the app from the device.
- [ ] Reinstall the app.
- [ ] Confirm whether the operating system removed local job data and stored photos.
- [ ] Confirm the app communicates that deleting the app may delete app data.
- [ ] Confirm Restore Purchase can restore ad-free status for the same store account.
- [ ] Confirm no account, backend, cloud sync, or subscription is introduced during recovery.

## Android Release Build Readiness

Current status: not run in this environment. The repo does not currently include a native `android/` project, native `ios/` project, or `eas.json`, and no production signing credentials or store product credentials are present.

- [ ] Configure production AdMob Android app ID and banner ad unit ID.
- [ ] Configure RevenueCat Android API key and the one-time store product.
- [ ] Confirm Android package/application ID, version code, signing, icon, splash screen, permissions, and target SDK settings.
- [ ] Run an Android release build through the supported local or EAS build pipeline.
- [ ] Install and smoke test the generated Android artifact.

## iOS Release Build Readiness

Current status: not run in this environment. The repo does not currently include a native `android/` project, native `ios/` project, or `eas.json`, and no production signing credentials or store product credentials are present.

- [ ] Configure production AdMob iOS app ID and banner ad unit ID.
- [ ] Configure RevenueCat iOS API key and the one-time store product.
- [ ] Confirm iOS bundle identifier, build number, signing, icon, splash screen, permissions, and privacy manifest requirements.
- [ ] Run an iOS release build through the supported local or EAS build pipeline.
- [ ] Install and smoke test the generated iOS artifact.
