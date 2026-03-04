import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const [msg, setMsg] = useState("Fullfører innlogging…");

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
        const qp = url.searchParams;

        const error = hash.get("error") || qp.get("error");
        const errorDesc = hash.get("error_description") || qp.get("error_description");
        if (error) {
          const full = `${error}${errorDesc ? `: ${decodeURIComponent(errorDesc)}` : ""}`;
          setMsg("Innlogging feilet: " + full);
          // Vis feilen på forsiden også (valgfritt)
          window.location.replace(`/?authError=${encodeURIComponent(full)}`);
          return;
        }

        // PKCE (vanligst): ?code=...
        const code = qp.get("code");
        if (code) {
          setMsg("Bytter kode mot session…");
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exErr) {
            setMsg("Innlogging feilet: " + exErr.message);
            window.location.replace(`/?authError=${encodeURIComponent(exErr.message)}`);
            return;
          }
          setMsg("Innlogget. Sender deg videre…");
          window.location.replace("/");
          return;
        }

        // Implicit: #access_token=...&refresh_token=...
        const access_token = hash.get("access_token");
        const refresh_token = hash.get("refresh_token");
        if (access_token && refresh_token) {
          setMsg("Setter session…");
          const { error: sErr } = await supabase.auth.setSession({ access_token, refresh_token });
          if (sErr) {
            setMsg("Innlogging feilet: " + sErr.message);
            window.location.replace(`/?authError=${encodeURIComponent(sErr.message)}`);
            return;
          }
          setMsg("Innlogget. Sender deg videre…");
          window.location.replace("/");
          return;
        }

        setMsg("Mangler token i linken. Generér en ny magic link.");
      } catch (e: any) {
        console.error("Auth callback crashed:", e);
        setMsg(`Auth callback krasjet: ${e?.message ?? e}`);
      }
    })();
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h2>{msg}</h2>
    </div>
  );
}
