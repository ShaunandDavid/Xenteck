type QueueSnapshot = {
  auditsRunning: number;
  deploymentsToday: number;
  avgTimeToValue: number;
  activeAgents: number;
  backlog: number;
};

export const config = {
  runtime: 'edge'
};

const SNAPSHOT: QueueSnapshot = {
  auditsRunning: 3,
  deploymentsToday: 1,
  avgTimeToValue: 3.2,
  activeAgents: 9,
  backlog: 4
};

const jsonResponse = (body: unknown, init: ResponseInit = {}): Response => {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'public, max-age=30');
  return new Response(JSON.stringify(body), { ...init, headers });
};

export default async function handler(): Promise<Response> {
  return jsonResponse({
    ok: true,
    data: SNAPSHOT,
    refreshedAt: new Date().toISOString()
  });
}
