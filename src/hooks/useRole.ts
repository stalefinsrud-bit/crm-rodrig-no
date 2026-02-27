import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "viewer";

export function useRole() {
  const [role, setRole] = useState<Role>("viewer");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data: s } = await supabase.auth.getSession();
        const userId = s.session?.user?.id;

        if (!userId) {
          if (!cancelled) setRole("viewer");
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();

        if (error) {
          console.warn("useRole: profiles select failed", error);
          if (!cancelled) setRole("viewer");
          return;
        }

        const r = (data as any)?.role;
        if (!cancelled) setRole(r === "admin" ? "admin" : "viewer");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { role, loading };
}