import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
      const qp = url.searchParams;

      // Supabase kan sende error i hash
      const error = hash.get("error") || qp.get("error");
      const errorDesc = hash.get("error_description") || qp.get("error_description");
      if (error) {
        setErr(`${error}${errorDesc ? `: ${decodeURIComponent(errorDesc)}` : ""}`);
        return;
      }

      // PKCE flow: ?code=...
      const code = qp.get("code");
      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exErr) return setErr(exErr.message);
        navigate("/", { replace: true });
        return;
      }

      // Implicit flow: #access_token=...&refresh_token=...
      const access_token = hash.get("access_token");
      const refresh_token = hash.get("refresh_token");
      if (access_token && refresh_token) {
        const { error: sErr } = await supabase.auth.setSession({ access_token, refresh_token });
        if (sErr) return setErr(sErr.message);
        navigate("/", { replace: true });
        return;
      }

      setErr("Mangler code/tokens. Be om ny magic link og prøv igjen.");
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 space-y-3">
        {!err ? (
          <div className="text-sm text-muted-foreground">Logger inn...</div>
        ) : (
          <div className="text-sm text-destructive break-words">{err}</div>
        )}
      </div>
    </div>
  );
}