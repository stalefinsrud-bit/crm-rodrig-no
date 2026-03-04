import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { supabase } from "@/integrations/supabase/client";

function renderApp() {
  const el = document.getElementById("root");
  if (!el) {
    document.body.innerHTML = "<pre>Missing #root element</pre>";
    return;
  }
  ReactDOM.createRoot(el).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

(async () => {
  try {
    // Handle Supabase tokens/errors in URL hash (confirm email / magic link)
    const url = new URL(window.location.href);
    const hash = new URLSearchParams(url.hash.replace(/^#/, ""));

    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");
    const error = hash.get("error") || hash.get("error_code");
    const errorDesc = hash.get("error_description");

    if (error) {
      console.error("Auth error:", error, errorDesc);
      // Clean hash so the app can render normally
      window.history.replaceState({}, "", `${url.pathname}${url.search}`);
    } else if (access_token && refresh_token) {
      const { error: sErr } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      if (sErr) console.error("setSession error:", sErr);

      // Redirect to root so we don't land on /auth/callback with no token_hash
      window.history.replaceState({}, "", "/");
    }
  } catch (e: any) {
    console.error("Bootstrap error:", e?.message || e);
    // Continue rendering anyway
  } finally {
    renderApp();
  }
})();