import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "viewer";

export function useRole() {
  const [role, setRole] = useState<Role>("viewer");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const userId = s.session?.user.id;

      if (!userId) {
        if (alive) {
          setRole("viewer");
          setLoading(false);
        }
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (alive) {
        setRole((data?.role as Role) ?? "viewer");
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return { role, loading };
}
