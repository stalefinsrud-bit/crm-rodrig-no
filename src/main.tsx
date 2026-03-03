import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { supabase } from "@/integrations/supabase/client";

async function bootstrap() {
  // Supabase can return tokens/errors in the URL hash after email confirm/magic link
  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));

  const access_token = hash.get("access_token");
  const refresh_token = hash.get("refresh_token");

  // If we got tokens, set session before rendering the app
  if (access_token && refresh_token) {
    await supabase.auth.setSession({ access_token, refresh_token });
    // Clean URL (remove tokens from hash)
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();