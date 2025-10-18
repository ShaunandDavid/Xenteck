const ENDPOINT = '/api/v1/build-queue';

export const fetchBuildQueue = async () => {
  try {
    const response = await fetch(ENDPOINT, {
      method: 'GET',
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        ok: false,
        reason: `http-${response.status}`,
        message: text || 'Unable to load build queue.'
      };
    }

    const payload = await response.json();
    if (!payload?.ok) {
      return {
        ok: false,
        reason: payload?.error?.code || 'queue-error',
        message: payload?.error?.message
      };
    }

    return { ok: true, data: payload.data, refreshedAt: new Date(payload.refreshedAt) };
  } catch (error) {
    return {
      ok: false,
      reason: 'network-error',
      message: error instanceof Error ? error.message : String(error)
    };
  }
};
