export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null) {
    const maybe = error as {
      response?: {
        data?: {
          detail?: unknown;
          error?: { message?: unknown };
        };
      };
      message?: unknown;
    };

    const detail = maybe.response?.data?.detail;
    if (typeof detail === 'string' && detail.trim()) return detail;

    const nested = maybe.response?.data?.error?.message;
    if (typeof nested === 'string' && nested.trim()) return nested;

    if (typeof maybe.message === 'string' && maybe.message.trim()) {
      return maybe.message;
    }
  }

  return fallback;
}
