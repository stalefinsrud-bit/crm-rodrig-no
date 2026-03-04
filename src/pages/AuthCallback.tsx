import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const [msg, setMsg] = useState("Fullfører innlogging…");

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);
        const qp = url.searchParams;

        const tokenHash = qp.get("token_hash");
        if (tokenHash) {
          setMsg("Verifiserer token…");
          const { error } = await supabase.auth.verifyOtp({
            type: "magiclink",
            token_hash: tokenHash,
          });
          if (error) {
            setMsg("Innlogging feilet: " + error.message);
            return;
          }
          setMsg("Innlogget. Sender deg videre…");
          window.location.replace("/");
          return;
        }

        setMsg("Mangler token_hash i URL-en.");
      } catch (e: any) {
        setMsg("Callback krasjet: " + (e?.message ?? String(e)));
      }
    })();
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h2>{msg}</h2>
    </div>
  );
}
