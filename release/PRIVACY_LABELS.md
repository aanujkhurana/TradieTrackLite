# Privacy Labels And Data Safety Draft

Use this as a draft for Apple privacy nutrition labels and Google Play Data Safety. Final answers must be checked against the store forms, SDK behavior, production AdMob settings, RevenueCat configuration, and any future code changes before submission.

## Product Position

- No account is required.
- Normal job workflows do not send job records, customer details, reminders, photos, reports, or backups to a TradieTrack backend.
- Job data, photos, reminders, reports, and local entitlement state are stored on the device by default.
- Data leaves the device when the user exports, shares, backs up, or reports it with device share tools.
- The app currently has no product analytics.
- The free version may request banner ads through Google AdMob.
- RevenueCat and the app stores may process purchase data to validate and restore the one-time ad-free purchase.

## Apple App Privacy Draft

Data used to track users:

- Advertising data may be used by Google AdMob depending on final consent, personalization, and SDK configuration. The current app requests non-personalized ads where supported. Confirm this in the final production build.

Data linked to the user:

- Purchases: the app store and RevenueCat may process purchase and entitlement data for the one-time ad-free purchase.
- Identifiers and diagnostics: AdMob, RevenueCat, Apple, or Google may process identifiers or diagnostics required to deliver ads, validate purchases, prevent fraud, or maintain SDK reliability.

Data not collected by TradieTrack backend:

- Contact info entered into jobs.
- Customer details.
- Job addresses.
- User content such as notes, job photos, reports, and backups.
- Reminders and job status.

## Google Play Data Safety Draft

Data collection:

- App activity / app interactions: No product analytics are currently collected by TradieTrack Lite.
- Photos and videos: Job photos are stored locally by default and are not uploaded by normal app workflows.
- Personal info / contacts / location-like addresses: Customer details and job addresses are stored locally by default and are not uploaded by normal app workflows.
- Financial info / purchase history: Store and RevenueCat purchase systems may process purchase and entitlement information for the ad-free upgrade.
- Device or other IDs: AdMob and purchase SDKs may process device, advertising, or app instance identifiers needed for ads, fraud prevention, purchase validation, diagnostics, and service operation.

Data sharing:

- User-initiated exports, reports, backups, and share sheet actions may share selected job data with apps or services the user chooses.
- AdMob may receive ad request data in the free version.
- RevenueCat and app stores may receive purchase validation and restore data.

Security and deletion:

- Local app data is controlled by the device operating system.
- Deleting the app may delete job records and stored photos.
- Users should export backups before deleting the app or changing devices.

## Store Form Checks Before Submission

- Confirm whether production ads are personalized, non-personalized, or consent-gated.
- Confirm whether any SDK setting changes data categories.
- Confirm no analytics SDK has been added.
- Confirm the published privacy policy URL points to `PRIVACY_POLICY.md` equivalent hosted copy.

