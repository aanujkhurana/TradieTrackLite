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
    version: '2.0.0',
    orientation: 'portrait',
    platforms: ['ios', 'android'],
    icon: './assets/icon.png',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#F3F0EA',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#151411',
      },
    },
    plugins,
  },
};
