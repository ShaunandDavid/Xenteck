import type { VercelRequest, VercelResponse } from '@vercel/node';

type ForecastPoint = {
  year: number;
  advancement: number;
  milestone?: string;
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

function readBody(req: VercelRequest): Record<string, unknown> | null {
  const { body } = req;
  if (!body) return null;
  if (typeof body === 'object') {
    return body as Record<string, unknown>;
  }
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  return null;
}

function extractTopic(req: VercelRequest): string {
  const topic = coerceString(req.query.topic);
  const interest = coerceString(req.query.interest);
  if (topic) return topic;
  if (interest) return interest;

  const body = readBody(req);
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
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!req.method || !ALLOWED_METHODS.has(req.method)) {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ ok: false, error: { code: 'method_not_allowed' } });
    }

    const topic = extractTopic(req);

    if (!topic) {
      return res
        .status(400)
        .json({ ok: false, error: { code: 'bad_request', message: 'Missing required parameter: topic or interest' } });
    }

    const data = buildForecast(topic);

    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).json({ data, topic, ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false, error: { code: 'server_error' } });
  }
}
