import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface EbookAccessState {
  isUnlocked: boolean;
  isLoading: boolean;
}

export function useEbookAccess() {
  const [state, setState] = useState<EbookAccessState>({
    isUnlocked: false,
    isLoading: true,
  });

  const checkAccess = useCallback(async () => {
    const email = localStorage.getItem("userEmail");
    if (!email) {
      setState({ isUnlocked: false, isLoading: false });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (!profile) {
        setState({ isUnlocked: false, isLoading: false });
        return;
      }

      const { data: product } = await supabase
        .from("products")
        .select("id")
        .eq("slug", "smart-player-manual")
        .eq("is_active", true)
        .maybeSingle();

      if (!product) {
        setState({ isUnlocked: false, isLoading: false });
        return;
      }

      const now = new Date().toISOString();
      const { data: entitlement } = await supabase
        .from("entitlements")
        .select("id")
        .eq("user_id", profile.id)
        .eq("product_id", product.id)
        .eq("status", "active")
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .maybeSingle();

      setState({
        isUnlocked: !!entitlement,
        isLoading: false,
      });
    } catch {
      setState({ isUnlocked: false, isLoading: false });
    }
  }, []);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return { ...state, recheckAccess: checkAccess };
}
