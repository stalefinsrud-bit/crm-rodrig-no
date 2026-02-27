import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useRole() {
  const [role, setRole] = useState<"admin" | "viewer" | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const userId = s.session?.user.id;
      if (!userId) return mounted && setRole(null);

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (mounted) setRole((data?.role as any) ?? "viewer");
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return role;
}
