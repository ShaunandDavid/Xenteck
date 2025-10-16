const normaliseExternalPoints = (payload) => {
  if (!payload) return [];
  const raw = Array.isArray(payload) ? payload : payload.data;
  if (!Array.isArray(raw)) return [];

  return raw
    .map((point) => ({
      year: Number(point.year),
      advancement: Number(point.advancement),
      milestone: point.milestone || undefined
    }))
    .filter((point) => Number.isFinite(point.year) && Number.isFinite(point.advancement))
    .sort((a, b) => a.year - b.year);
};

const resolveGrowthUrl = () => {
  if (typeof window === 'undefined') return '';
  const envUrl = window.ENV?.GROWTH_API_URL;
  const legacy = window.GROWTH_API_URL;
  return (envUrl ?? legacy ?? '').toString().trim();
};

export const getGrowthApiUrl = () => resolveGrowthUrl();

export const fetchGrowthApi = async (topic) => {
  const configuredUrl = resolveGrowthUrl();
  if (!configuredUrl) {
    return { ok: false, reason: 'missing-url' };
  }

  const base = configuredUrl.includes('://')
    ? configuredUrl
    : `${configuredUrl.startsWith('/') ? '' : '/'}${configuredUrl}`;

  const separator = base.includes('?') ? '&' : '?';
  const url = `${base}${separator}topic=${encodeURIComponent(topic)}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      console.warn(`[Visualizer] Growth API error: HTTP ${response.status}`);
      return { ok: false, reason: `http-${response.status}` };
    }

    const payload = await response.json();
    const data = normaliseExternalPoints(payload);

    if (!data.length) {
      console.warn('[Visualizer] Growth API returned empty data.');
      return { ok: false, reason: 'empty' };
    }

    console.log(`[Visualizer] Growth API OK: ${data.length} points`);
    return { ok: true, data, source: 'growth-api', url: base };
  } catch (error) {
    console.error('[Visualizer] Growth API fetch failed', error);
    return {
      ok: false,
      reason: 'fetch-error',
      message: error instanceof Error ? error.message : String(error)
    };
  }
};
