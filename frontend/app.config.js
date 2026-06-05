const admobAndroidAppId = process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID;
const admobIosAppId = process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID;

const APP_NAME = 'TradieTrack Lite';
const SLUG = 'tradietrack-lite';

// Bundle identifiers and package name. These MUST be set to real values
// before submitting to App Store Connect / Play Console. They default to
// placeholders so dev builds still run; CI / EAS will override them.
const iosBundleIdentifier =
  process.env.EXPO_PUBLIC_IOS_BUNDLE_IDENTIFIER || 'app.tradietrack.lite';
const androidPackage =
  process.env.EXPO_PUBLIC_ANDROID_PACKAGE || 'app.tradietrack.lite';

const easBuildNumber = process.env.EAS_BUILD_NUMBER;
const easBuildVersionCode = process.env.EAS_BUILD_VERSION_CODE;

const plugins = [];

if (admobAndroidAppId && admobIosAppId) {
  plugins.push([
    'react-native-google-mobile-ads',
    {
      androidAppId: admobAndroidAppId,
      iosAppId: admobIosAppId,
    },
  ]);
}

plugins.push([
  'expo-notifications',
  {
    // Use the project-level notifications config. iOS / Android
    // permissions are declared below so users see the OS prompt on first
    // reminder or photo capture.
    icon: './assets/notification-icon.png',
    color: '#1A1814',
  },
]);

module.exports = {
  expo: {
    name: APP_NAME,
    slug: SLUG,
    version: '2.1.0',
    orientation: 'portrait',
    platforms: ['ios', 'android'],
    userInterfaceStyle: 'automatic',
    icon: './assets/icon.png',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#131210',
      dark: {
        image: './assets/splash.png',
        backgroundColor: '#131210',
      },
    },
    scheme: 'tradietrack',
    newArchEnabled: false,
    // Pin runtime to the Expo SDK version. Updates and EAS Build use
    // this to decide which binaries can receive an OTA update.
    runtimeVersion: {
      policy: 'sdkVersion',
    },
    // Disable Expo Go flows. The app is built with EAS Build / bare
    // workflow and ships a real native binary.
    ios: {
      bundleIdentifier: iosBundleIdentifier,
      buildNumber: easBuildNumber || '1',
      supportsTablet: false,
      icon: './assets/icon.png',
      // iOS usage descriptions. AdMob needs ATT; image picker needs
      // photo and camera descriptions. Notifications don't need an
      // Info.plist key (handled by expo-notifications).
      infoPlist: {
        CFBundleDisplayName: 'TradieTrack',
        CFBundleShortVersionString: '2.1.0',
        CFBundleVersion: easBuildNumber || '1',
        LSRequiresIPhoneOS: true,
        UILaunchStoryboardName: 'SplashScreen',
        UIRequiredDeviceCapabilities: ['armv7'],
        UISupportedInterfaceOrientations: ['UIInterfaceOrientationPortrait'],
        ITSAppUsesNonExemptEncryption: false,
        NSUserTrackingUsageDescription:
          'Allows TradieTrack to show more relevant ads in the free version. Used only after you grant this permission.',
        NSCameraUsageDescription:
          'TradieTrack uses the camera so you can capture photos of job sites, quotes, and completed work to attach to a job record.',
        NSPhotoLibraryUsageDescription:
          'TradieTrack reads photos you select so you can attach existing site photos, plans, or receipts to a job record.',
        NSPhotoLibraryAddUsageDescription:
          'TradieTrack saves exported PDF job reports to your photo library when you choose to.',
        NSMicrophoneUsageDescription:
          'Not used. Declared because the camera module may request audio capture alongside video.',
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: false,
          NSAllowsLocalNetworking: true,
        },
      },
    },
    android: {
      package: androidPackage,
      versionCode: parseInt(easBuildVersionCode || '1', 10),
      icon: './assets/icon.png',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#1A1814',
      },
      // Runtime permissions. POST_NOTIFICATIONS is needed for Android 13+
      // reminders. READ_MEDIA_IMAGES replaces READ_EXTERNAL_STORAGE on
      // Android 13+. FOREGROUND_SERVICE supports reliable reminder
      // scheduling when combined with expo-notifications.
      permissions: [
        'android.permission.CAMERA',
        'android.permission.READ_MEDIA_IMAGES',
        'android.permission.READ_MEDIA_VIDEO',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.POST_NOTIFICATIONS',
        'android.permission.RECEIVE_BOOT_COMPLETED',
        'android.permission.SCHEDULE_EXACT_ALARM',
        'android.permission.USE_EXACT_ALARM',
        'android.permission.FOREGROUND_SERVICE',
        'android.permission.WAKE_LOCK',
        'android.permission.VIBRATE',
      ],
    },
    plugins,
    assetBundlePatterns: ['**/*'],
  },
};
