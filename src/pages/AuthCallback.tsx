import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
      const qp = url.searchParams;

      const error = hash.get("error") || qp.get("error");
      const errorDesc = hash.get("error_description") || qp.get("error_description");

      if (error) {
        navigate(
          `/?authError=${encodeURIComponent(
            `${error}${errorDesc ? `: ${decodeURIComponent(errorDesc)}` : ""}`
          )}`,
          { replace: true }
        );
        return;
      }

      const code = qp.get("code");
      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exErr) {
          navigate(`/?authError=${encodeURIComponent(exErr.message)}`, { replace: true });
          return;
        }
        navigate("/", { replace: true });
        return;
      }

      const access_token = hash.get("access_token");
      const refresh_token = hash.get("refresh_token");

      if (access_token && refresh_token) {
        const { error: sErr } = await supabase.auth.setSession({ access_token, refresh_token });
        if (sErr) {
          navigate(`/?authError=${encodeURIComponent(sErr.message)}`, { replace: true });
          return;
        }
        navigate("/", { replace: true });
        return;
      }

      navigate(
        "/?authError=Missing%20token%20in%20magic%20link.%20Please%20request%20a%20new%20link.",
        { replace: true }
      );
    })();
  }, [navigate]);

  return null;
}