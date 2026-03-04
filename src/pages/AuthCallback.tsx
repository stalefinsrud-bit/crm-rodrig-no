import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const [msg, setMsg] = useState("Logger inn...");

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const tokenHash = url.searchParams.get("token_hash");

        if (!tokenHash) {
          setMsg("Mangler token_hash i URL-en.");
          return;
        }

        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "email",
        });

        if (error) {
          setMsg(`Innlogging feilet: ${error.message}`);
          return;
        }

        window.location.replace("/");
      } catch (e: any) {
        setMsg(`Krasj: ${e?.message ?? e}`);
      }
    })();
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h2>{msg}</h2>
    </div>
  );
}
