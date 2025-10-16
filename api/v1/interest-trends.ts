import type { VercelRequest, VercelResponse } from '@vercel/node';

type Point = { year: number; advancement: number; milestone?: string };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET' && req.method !== 'POST') {
      return res.status(405).json({ error: { code: 'method_not_allowed' } });
    }

    const topic =
      (req.query.topic as string) ||
      (req.query.interest as string) ||
      (req.body && (req.body.topic || req.body.interest)) ||
      '';

    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: { code: 'bad_request', message: 'Missing required parameter: topic' } });
    }

    const year0 = new Date().getUTCFullYear() - 6;
    const data: Point[] = Array.from({ length: 7 }, (_, i) => {
      const year = year0 + i;
      const base = 80 + i * 20;
      const wiggle = Math.sin(i / 2) * 8;
      const advancement = Math.round(base + wiggle);
      return { year, advancement };
    });

    data[2].milestone = 'Breakthrough paper';
    data[5].milestone = 'Major product launch';

    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).json({ data, topic, source: 'vercel-fn', ok: true });
  } catch (err) {
    return res.status(500).json({ error: { code: 'server_error' } });
  }
}
