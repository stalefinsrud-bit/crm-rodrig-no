import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("Logger inn...");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
      const queryParams = url.searchParams;

      // Feil kan komme i hash eller query
      const error =
        hashParams.get("error") || queryParams.get("error") || null;
      const errorDesc =
        hashParams.get("error_description") ||
        queryParams.get("error_description") ||
        hashParams.get("error_code") ||
        queryParams.get("error_code") ||
        null;

      if (error) {
        setErr(`${error}${errorDesc ? `: ${decodeURIComponent(errorDesc)}` : ""}`);
        setMsg("Innlogging feilet.");
        return;
      }

      // 1) PKCE flow: /auth/callback?code=...
      const code = queryParams.get("code");
      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exErr) {
          setErr(exErr.message);
          setMsg("Innlogging feilet.");
          return;
        }
        // Fjern kode/hash fra URL og gå videre
        window.history.replaceState({}, "", "/");
        navigate("/", { replace: true });
        return;
      }

      // 2) Implicit flow: /auth/callback#access_token=...&refresh_token=...
      const access_token = hashParams.get("access_token");
      const refresh_token = hashParams.get("refresh_token");

      if (access_token && refresh_token) {
        const { error: sErr } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (sErr) {
          setErr(sErr.message);
          setMsg("Innlogging feilet.");
          return;
        }

        // Fjern tokens fra URL og gå videre
        window.history.replaceState({}, "", "/");
        navigate("/", { replace: true });
        return;
      }

      setErr("Mangler code/tokens i callback-URL. Be om ny magic link og prøv igjen.");
      setMsg("Innlogging feilet.");
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 space-y-3">
        <div className="text-sm text-muted-foreground">{msg}</div>
        {err && <div className="text-sm text-destructive break-words">{err}</div>}
      </div>
    </div>
  );
}