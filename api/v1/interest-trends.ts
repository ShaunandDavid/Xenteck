type ForecastPoint = {
  year: number;
  advancement: number;
  milestone?: string;
};

export const config = {
  runtime: 'edge'
};

const ALLOWED_METHODS = new Set(['GET', 'POST']);

function coerceString(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (Array.isArray(value)) {
    const first = value.find((item) => typeof item === 'string') as string | undefined;
    return first ? first.trim() : '';
  }
  return '';
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers ?? {});
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(body), { ...init, headers });
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
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
        if (typeof value !== 'string') {
          return;
        }
        if (key in result) {
          const current = result[key];
          if (Array.isArray(current)) {
            current.push(value);
          } else {
            result[key] = [current as string, value];
          }
        } else {
          result[key] = value;
        }
      });

      return Object.keys(result).length ? result : null;
    }

    const raw = (await clone.text()).trim();
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

async function extractTopic(request: Request): Promise<string> {
  const url = new URL(request.url);
  const topic = coerceString(url.searchParams.get('topic'));
  const interest = coerceString(url.searchParams.get('interest'));
  if (topic) return topic;
  if (interest) return interest;

  const body = await readBody(request);
  if (body) {
    const bodyTopic = coerceString(body.topic);
    const bodyInterest = coerceString(body.interest);
    if (bodyTopic) return bodyTopic;
    if (bodyInterest) return bodyInterest;
  }

  return '';
}

function buildForecast(topic: string): ForecastPoint[] {
  const seed = topic.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const now = new Date().getUTCFullYear();
  const count = 6;
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  const hasGeminiKey = Boolean(env?.GEMINI_API_KEY);

  return Array.from({ length: count }, (_, index) => {
    const year = now - 2 + index;
    const baseline = 55 + index * 18;
    const variance = Math.sin((seed + index * 3) * 0.37) * (12 + (seed % 9));
    const advancement = Math.max(5, Math.round(baseline + variance));

    const point: ForecastPoint = { year, advancement };

    if (index === 1) {
      point.milestone = `Research renaissance for ${topic}`;
    } else if (index === count - 2) {
      point.milestone = `Adoption curve inflection for ${topic}`;
    } else if (hasGeminiKey && index === count - 1) {
      point.milestone = 'Gemini-enhanced projection ready';
    }

    return point;
  });
}

export default async function handler(request: Request): Promise<Response> {
  try {
    if (!ALLOWED_METHODS.has(request.method)) {
      return jsonResponse(
        { ok: false, error: { code: 'method_not_allowed' } },
        {
          status: 405,
          headers: { Allow: 'GET, POST' }
        }
      );
    }

    const topic = await extractTopic(request);

    if (!topic) {
      return jsonResponse(
        {
          ok: false,
          error: { code: 'bad_request', message: 'Missing required parameter: topic or interest' }
        },
        { status: 400 }
      );
    }

    const data = buildForecast(topic);

    return jsonResponse(
      { data, topic, ok: true },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=300'
        }
      }
    );
  } catch (error) {
    return jsonResponse({ ok: false, error: { code: 'server_error' } }, { status: 500 });
  }
}
