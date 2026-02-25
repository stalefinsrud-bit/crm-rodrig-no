import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const secret = req.headers["x-invite-secret"];
  if (!secret || secret !== process.env.INVITE_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { email } = (req.body ?? {}) as { email?: string };
  if (!email) return res.status(400).json({ error: "Missing email" });

  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: "https://crm.rodrig.no" },
  });

  if (error) return res.status(400).json({ error: error.message });

  // Send mail via Supabase (hvis Email provider er på) ved å bruke signInWithOtp i admin-flow:
  // Easiest: return the link and you can send it manually. If you want auto-email, tell me and I’ll wire SMTP/provider correctly.
  return res.status(200).json({ action_link: data.properties.action_link });
}