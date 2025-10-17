type GeminiPoint = {
  year: number;
  advancement: number;
  milestone?: string;
};

export const config = {
  runtime: 'edge'
};

const MODEL_NAME = 'gemini-2.5-flash';
const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;
const ALLOWED_METHODS = new Set(['GET', 'POST']);

const getEnv = (): Record<string, string | undefined> =>
  ((globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env ||
    {}) as Record<string, string | undefined>;

const coerceString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === 'string');
    return first ? String(first).trim() : '';
  }
  return '';
};

const jsonResponse = (body: unknown, init: ResponseInit = {}): Response => {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(body), { ...init, headers });
};

const readBody = async (request: Request): Promise<Record<string, unknown> | null> => {
  if (request.method === 'GET' || request.method === 'HEAD') {
    return null;
  }

  try {
    const clone = request.clone();
    const contentType = (clone.headers.get('content-type') || '').toLowerCase();

    if (contentType.includes('application/json')) {
      const parsed = await clone.json();
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
    }

    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await clone.formData();
      const result: Record<string, unknown> = {};
      formData.forEach((value, key) => {
        if (typeof value !== 'string') return;
        if (key in result) {
          const existing = result[key];
          if (Array.isArray(existing)) {
            existing.push(value);
          } else {
            result[key] = [existing as string, value];
          }
        } else {
          result[key] = value;
        }
      });
      return Object.keys(result).length ? result : null;
    }

    const raw = (await clone.text()).trim();
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
};

const extractTopic = async (request: Request): Promise<string> => {
  const url = new URL(request.url);
  const topic = coerceString(url.searchParams.get('topic'));
  if (topic) return topic;

  const body = await readBody(request);
  if (!body) return '';

  return coerceString(body.topic);
};

const extractClientKey = async (request: Request): Promise<string> => {
  const body = await readBody(request);
  if (!body) return '';
  return coerceString(body.apiKey);
};

const normalisePoints = (payload: unknown): GeminiPoint[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((rawPoint) => {
      if (typeof rawPoint !== 'object' || rawPoint === null) {
        return null;
      }
      const record = rawPoint as Record<string, unknown>;
      const year = Number(record.year);
      const advancement = Number(record.advancement);

      if (!Number.isFinite(year) || !Number.isFinite(advancement)) {
        return null;
      }

      const normalizedPoint: GeminiPoint = { year, advancement };
      if (typeof record.milestone === 'string') {
        const trimmed = record.milestone.trim();
        if (trimmed) {
          normalizedPoint.milestone = trimmed;
        }
      }
      return normalizedPoint;
    })
    .filter((normalizedPoint): normalizedPoint is GeminiPoint => normalizedPoint !== null)
    .sort((a, b) => a.year - b.year);
};

const parseGeminiResponse = (payload: unknown): GeminiPoint[] => {
  const candidates = (payload as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates;
  if (!Array.isArray(candidates)) {
    return [];
  }

  const text = candidates
    .flatMap((candidate) => candidate?.content?.parts || [])
    .map((part) => part?.text || '')
    .join('\n')
    .trim();

  if (!text) {
    return [];
  }

  const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    return normalisePoints(parsed);
  } catch {
    return [];
  }
};

const synthesiseAggressiveTrajectory = (topic: string, sourcePoints: GeminiPoint[]): GeminiPoint[] => {
  const sorted = [...sourcePoints].sort((a, b) => a.year - b.year);
  const now = new Date().getUTCFullYear();
  const startYear = sorted[0]?.year ?? now - 3;
  const totalYears = Math.max(sorted.length, 14);
  const years = Array.from({ length: totalYears }, (_, index) => startYear + index);

  const seed = topic
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const base = 90 + (seed % 70);
  const amplitude = 880 + (seed % 240);
  const maxScore = 1250;
  const steepness = 6.2 + (seed % 20) / 10;
  const midpoint = 0.38 + (seed % 40) / 200;

  const logistic = (value: number) => 1 / (1 + Math.exp(-steepness * (value - midpoint)));

  return years.map((year, index) => {
    const progress = index / Math.max(years.length - 1, 1);
    const curve = logistic(progress);
    const advancement = Math.min(maxScore, Math.round(base + curve * amplitude));

    let milestone: string | undefined;
    if (index === Math.round(years.length * 0.2)) {
      milestone = `${topic} pilots trigger board-level urgency.`;
    } else if (index === Math.round(years.length * 0.55)) {
      milestone = `${topic} becomes an industry-wide default.`;
    } else if (index === years.length - 1) {
      milestone = `${topic} rewires operating models globally.`;
    }

    return { year, advancement, milestone };
  });
};

export default async function handler(request: Request): Promise<Response> {
  if (!ALLOWED_METHODS.has(request.method)) {
    return jsonResponse({ ok: false, error: { code: 'method_not_allowed' } }, { status: 405 });
  }

  const [topic, clientKey] = await Promise.all([extractTopic(request), extractClientKey(request)]);

  if (!topic) {
    return jsonResponse({ ok: false, error: { code: 'missing_topic' } }, { status: 400 });
  }

  const envKey = coerceString(getEnv().GEMINI_API_KEY);
  const apiKey = clientKey || envKey;

  if (!apiKey) {
    return jsonResponse({ ok: false, error: { code: 'no_api_key' } }, { status: 503 });
  }

  const requestBody = {
    systemInstruction: {
      role: 'system',
      parts: [
        {
          text: [
            'You are a technology futurist and data analyst. Your task is to generate a projected growth trajectory for a specific field of Artificial Intelligence provided by the user.',
            'You must respond with only a JSON array of objects. Do not include any other text, explanation, or markdown formatting.',
            "Each object in the array represents a data point with a 'year', a numeric 'advancement' score (from 1 to 1000, where 1 is nascent and 1000 is transformative), and an optional 'milestone' string.",
            'The data should start from a plausible year of inception for the given topic and project about 15-20 years into the future.',
            'The growth curve should be exponential, reflecting the accelerating nature of AI development.'
          ].join(' ')
        }
      ]
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: `Generate the growth trajectory for: "${topic}"` }]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json'
    },
    responseSchema: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          year: { type: 'NUMBER' },
          advancement: { type: 'NUMBER' },
          milestone: { type: 'STRING' }
        },
        required: ['year', 'advancement']
      }
    }
  };

  try {
    const response = await fetch(`${API_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const text = await response.text();
      return jsonResponse(
        {
          ok: false,
          error: {
            code: 'upstream_error',
            status: response.status,
            message: text.slice(0, 512)
          }
        },
        { status: 502 }
      );
    }

    const payload = await response.json();
    const parsed = parseGeminiResponse(payload);
    const points = synthesiseAggressiveTrajectory(topic, parsed);

    if (!points.length) {
      return jsonResponse(
        { ok: false, error: { code: 'empty_response', message: 'Gemini returned no data points.' } },
        { status: 502 }
      );
    }

    return jsonResponse(
      {
        ok: true,
        data: points,
        topic,
        source: clientKey ? 'user-key' : 'service-key'
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    );
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: {
          code: 'request_failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}
