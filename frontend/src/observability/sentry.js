// Sentry crash reporting.
//
// Local-first promise: telemetry is off by default. The only thing that
// turns it on is a real Sentry DSN in the build environment. No DSN
// means the provider stays a no-op, no network call, no event, no
// personally identifiable job data leaves the device.

import { hasNativeModule, isExpoGo } from '../runtime';

let initialized = false;
let sentry = null;

async function maybeLoadSentry() {
  if (initialized) return;
  initialized = true;

  const dsn =
    process.env.EXPO_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || '';
  if (!dsn) return;

  // Sentry is not installed in this repo. The integration is wired so
  // it can be added later with a single devDep + env. While missing,
  // the function below logs the unhandled error to the console so the
  // ErrorBoundary has somewhere to surface failures during dev.
  if (!hasNativeModule(['RNSentry', 'Sentry'])) {
    return;
  }

  if (isExpoGo()) return;

  try {
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    const mod = require('@sentry/react-native');
    sentry = mod;
    mod.init({
      dsn,
      environment: process.env.EXPO_PUBLIC_APP_ENV || 'development',
      // We do not collect PII. Job records, photos, and customer details
      // stay on the device.
      sendDefaultPii: false,
      // No breadcrumb capture for user input by default; the app does
      // not currently set user context.
      enableAutoPerformanceTracing: false,
      // Sample rate is low; only crashes + a fraction of errors.
      sampleRate: 0.2,
      tracesSampleRate: 0,
    });
  } catch (err) {
    sentry = null;
  }
}

export async function reportError(error, context) {
  // Always log in dev so engineers can see what happened.
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.error('[error]', error, context || {});
  }
  await maybeLoadSentry();
  if (!sentry) return;
  try {
    sentry.withScope((scope) => {
      if (context) scope.setExtras(context);
      sentry.captureException(error);
    });
  } catch (e) {
    // Never let telemetry break the app.
  }
}

export async function reportMessage(message, level = 'info') {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[${level}]`, message);
  }
  await maybeLoadSentry();
  if (!sentry) return;
  try {
    sentry.captureMessage(message, level);
  } catch (e) {
    // ignore
  }
}
