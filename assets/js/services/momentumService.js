const ENDPOINT = '/api/v1/interest-trends';

export const fetchInterestTrends = async (topic) => {
  const trimmed = (topic || '').trim();
  if (!trimmed) {
    return { ok: false, reason: 'missing-topic' };
  }

  const url = `${ENDPOINT}?topic=${encodeURIComponent(trimmed)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      const message = await response.text();
      return {
        ok: false,
        reason: `http-${response.status}`,
        message: message || 'Trend service returned an error.'
      };
    }

    const payload = await response.json();
    if (!payload?.ok) {
      return {
        ok: false,
        reason: payload?.error?.code || 'trend-error',
        message: payload?.error?.message
      };
    }

    return {
      ok: true,
      data: Array.isArray(payload.data) ? payload.data : [],
      topic: payload.topic
    };
  } catch (error) {
    return {
      ok: false,
      reason: 'network-error',
      message: error instanceof Error ? error.message : String(error)
    };
  }
};
