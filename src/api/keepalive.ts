export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const token = (req.query?.token as string) || "";
  const expected = process.env.KEEPALIVE_TOKEN || "";
  if (expected && token !== expected) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";

  const anonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!supabaseUrl) {
    return res.status(500).json({ ok: false, error: "Missing SUPABASE_URL" });
  }

  const results: Record<string, any> = {};

  try {
    const r = await fetch(`${supabaseUrl}/auth/v1/health`);
    results.auth_health = { status: r.status };
  } catch (e: any) {
    results.auth_health = { error: e?.message || "fetch failed" };
  }

  if (anonKey) {
    try {
      const r = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      });
      results.rest_ping = { status: r.status };
    } catch (e: any) {
      results.rest_ping = { error: e?.message || "fetch failed" };
    }
  } else {
    results.rest_ping = { skipped: "Missing anon key" };
  }

  return res.status(200).json({ ok: true, ts: new Date().toISOString(), results });
}