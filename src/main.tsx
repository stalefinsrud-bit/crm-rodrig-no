// Move Supabase magic-link hash into our HashRouter callback route
const h = window.location.hash || "";
if (h.includes("access_token=") || h.includes("error_code=") || h.startsWith("#error=")) {
  window.location.replace(`${window.location.origin}/#/auth/callback${h}`);
}
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
