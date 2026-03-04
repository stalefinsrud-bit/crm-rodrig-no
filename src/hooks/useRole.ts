import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "viewer";

export function useRole() {
  const [role, setRole] = useState<Role>("viewer");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const safeSetRole = (r: Role) => {
      if (!cancelled) setRole(r);
    };

    const safeSetLoading = (v: boolean) => {
      if (!cancelled) setLoading(v);
    };

    const load = async () => {
      try {
        // 1) Hent session (hvis ikke innlogget -> viewer)
        const { data: s, error: sessErr } = await supabase.auth.getSession();
        if (sessErr) {
          console.warn("useRole: getSession failed", sessErr);
          safeSetRole("viewer");
          return;
        }

        const userId = s.session?.user?.id;
        if (!userId) {
          safeSetRole("viewer");
          return;
        }

        // 2) Slå opp rolle i profiles
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();

        if (error) {
          console.warn("useRole: profiles select failed", error);
          safeSetRole("viewer");
          return;
        }

        const r = (data as any)?.role;
        safeSetRole(r === "admin" ? "admin" : "viewer");
      } catch (e) {
        console.warn("useRole: unexpected error", e);
        safeSetRole("viewer");
      } finally {
        safeSetLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { role, loading };
}
