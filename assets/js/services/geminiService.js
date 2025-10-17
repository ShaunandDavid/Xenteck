const GEMINI_ENDPOINT = '/api/v1/gemini-projection';

const normalisePoints = (payload = []) => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((point) => ({
      year: Number(point.year),
      advancement: Number(point.advancement),
      milestone: point.milestone || undefined
    }))
    .filter((point) => Number.isFinite(point.year) && Number.isFinite(point.advancement))
    .sort((a, b) => a.year - b.year);
};

export const getProjectedGrowthData = async (topic, providedKey) => {
  const trimmedTopic = (topic || '').trim();
  if (!trimmedTopic) {
    return { ok: false, reason: 'missing-topic' };
  }

  const body = { topic: trimmedTopic };
  const trimmedKey = (providedKey || '').trim();
  if (trimmedKey) {
    body.apiKey = trimmedKey;
  }

  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      let message = 'Gemini proxy returned an error response.';
      try {
        const errorPayload = await response.clone().json();
        message = errorPayload?.error?.message || message;
      } catch {
        const errorText = await response.text();
        message = errorText || message;
      }

      return {
        ok: false,
        reason: `http-${response.status}`,
        message
      };
    }

    const payload = await response.json();
    if (!payload?.ok) {
      return {
        ok: false,
        reason: payload?.error?.code || 'proxy-error',
        message: payload?.error?.message
      };
    }

    const data = normalisePoints(payload.data);
    if (!data.length) {
      return { ok: false, reason: 'empty' };
    }

    return {
      ok: true,
      data,
      source: payload.source || 'gemini'
    };
  } catch (error) {
    console.error('[Visualizer] Gemini proxy request failed', error);
    return {
      ok: false,
      reason: 'network-error',
      message: error instanceof Error ? error.message : String(error)
    };
  }
};
