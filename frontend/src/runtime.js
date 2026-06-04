import { NativeModules } from 'react-native';

export function hasNativeModule(moduleNames = []) {
  if (process.env.NODE_ENV === 'test') {
    return true;
  }

  return moduleNames.some((moduleName) => Boolean(NativeModules?.[moduleName]));
}

export function isExpoGo() {
  const constants =
    NativeModules?.ExponentConstants ||
    NativeModules?.ExpoConstants ||
    NativeModules?.ExpoModulesCore?.NativeModulesProxy?.ExponentConstants;

  return constants?.appOwnership === 'expo';
}
