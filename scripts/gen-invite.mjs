import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

if (!url || !secret) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY");
  process.exit(1);
}

const email = process.argv[2];
const redirectTo = process.argv[3];

if (!email || !redirectTo) {
  console.error('Usage: node scripts\\gen-invite.mjs "user@email.com" "https://din-app.vercel.app"');
  process.exit(1);
}

const admin = createClient(url, secret);

const { data, error } = await admin.auth.admin.generateLink({
  type: "magiclink",
  email,
  options: { redirectTo },
});

if (error) {
  console.error(error);
  process.exit(1);
}

console.log("\nLOGIN LINK:\n" + data.properties.action_link + "\n");
