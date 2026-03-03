import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function AuthPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Read error message passed back from AuthCallback
  const params = new URLSearchParams(window.location.search);
  const authError = params.get("authError");

  const sendMagicLink = async () => {
    setStatus(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) return setStatus(error.message);
    setStatus("Sjekk e-posten din – klikk lenken for å logge inn.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">RodRig CRM</h1>
          <p className="text-xs text-muted-foreground">MAGICLINK BUILD v1</p>
          <p className="text-sm text-muted-foreground">
            Logg inn med e-post (ingen passord).
          </p>
        </div>

        {authError && (
          <div className="text-sm text-destructive break-words">
            {decodeURIComponent(authError)}
          </div>
        )}

        <label className="text-sm font-medium">Email</label>
        <input
          className="w-full rounded-md border border-input bg-background px-3 py-2"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          className="w-full rounded-md bg-primary text-primary-foreground py-2 disabled:opacity-60"
          onClick={sendMagicLink}
          disabled={loading || !email}
        >
          {loading ? "Sender..." : "Send magic link"}
        </button>

        {status && (
          <div className="text-sm text-muted-foreground break-words">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}