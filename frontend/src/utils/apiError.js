export function getApiErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const apiError = err?.response?.data?.error;

  if (typeof apiError === 'string') return apiError;
  if (apiError?.message) return apiError.message;

  return fallback;
}
