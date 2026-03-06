import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Role = "owner" | "editor";

export function useRole() {
  const [role, setRole] = useState<Role>("editor");
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
        const { data: s, error: sessErr } = await supabase.auth.getSession();
        if (sessErr) {
          console.warn("useRole: getSession failed", sessErr);
          safeSetRole("editor");
          return;
        }

        const userId = s.session?.user?.id;
        if (!userId) {
          safeSetRole("editor");
          return;
        }

        // Query user_roles table — profiles has no role column
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "owner")
          .maybeSingle();

        if (error) {
          console.warn("useRole: user_roles select failed", error);
          safeSetRole("editor");
          return;
        }

        safeSetRole(data ? "owner" : "editor");
      } catch (e) {
        console.warn("useRole: unexpected error", e);
        safeSetRole("editor");
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
