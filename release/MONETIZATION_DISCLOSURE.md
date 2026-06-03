# Ads And Purchase Disclosure

Use these notes for store metadata, review notes, and support documentation.

## Free Version

TradieTrack Lite is free to use with banner ads. Ads are placed away from critical save, delete, report, and export actions so job-site workflows stay usable.

Ad requests use Google AdMob. The app is configured to request non-personalized ads where supported by the SDK. Final production behavior depends on production AdMob app IDs, ad unit IDs, consent handling, regional requirements, and store policy checks.

## One-Time Ad-Free Purchase

The app offers a one-time ad-free purchase through the app stores, with RevenueCat used for entitlement validation. This purchase removes banner ads for the validated store account.

The planned entitlement is `ad_free`. The planned product ID is `tradietrack_lite_ad_free`, unless the store setup requires a different public ID.

## Restore Purchase Instructions

To restore a previous ad-free purchase:

1. Open TradieTrack Lite.
2. Go to the jobs list.
3. Tap the ad-free/remove ads option.
4. Tap `Restore Purchase`.
5. Use the same Apple ID or Google account that bought the ad-free upgrade.

If no matching purchase is found, the app keeps the free ad-supported version active. Restoring purchases does not require a TradieTrack account.

