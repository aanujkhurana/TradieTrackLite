const admobAndroidAppId = process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID;
const admobIosAppId = process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID;

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

module.exports = {
  expo: {
    name: 'TradieTrack Lite',
    slug: 'tradietrack-lite',
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
      // For lighter devices we keep a soft warm splash so the launch flash feels calm.
      // Native splash re-applies on appearance change.
    },
    ios: {
      icon: './assets/icon.png',
    },
    android: {
      icon: './assets/icon.png',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#1A1814',
      },
    },
    plugins,
  },
};
