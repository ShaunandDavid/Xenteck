import { NextResponse } from "next/server";

type Point = { year: number; advancement: number; milestone?: string };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const topic = (searchParams.get("topic") || searchParams.get("interest") || "").trim();
  if (!topic) {
    return NextResponse.json({ error: { code: "bad_request", message: "Missing required parameter: topic" } }, { status: 400 });
  }

  const data: Point[] = Array.from({ length: 7 }, (_, i) => {
    const year = new Date().getFullYear() - 6 + i;
    const base = 80 + i * 20;
    const wiggle = Math.sin(i / 2) * 8;
    const advancement = Math.round(base + wiggle);
    return { year, advancement };
  });

  data[2].milestone = "Breakthrough paper";
  data[5].milestone = "Major product launch";

  return NextResponse.json({ data, topic, source: "stub", ok: true });
}
