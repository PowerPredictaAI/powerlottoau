import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface OracleAccessState {
  isUnlocked: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useOracleAccess() {
  const [state, setState] = useState<OracleAccessState>({
    isUnlocked: false,
    isLoading: true,
    error: null,
  });

  const checkAccess = useCallback(async () => {
    const email = localStorage.getItem("userEmail");
    if (!email) {
      setState({ isUnlocked: false, isLoading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) {
        setState({ isUnlocked: false, isLoading: false, error: null });
        return;
      }

      const { data: product, error: productError } = await supabaseClient
        .from("products")
        .select("id")
        .eq("slug", "oracle-ai")
        .eq("is_active", true)
        .maybeSingle();

      if (productError) throw productError;
      if (!product) {
        setState({ isUnlocked: false, isLoading: false, error: null });
        return;
      }

      const now = new Date().toISOString();
      const { data: entitlement, error: entError } = await supabaseClient
        .from("entitlements")
        .select("id")
        .eq("user_id", profile.id)
        .eq("product_id", product.id)
        .eq("status", "active")
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .maybeSingle();

      if (entError) throw entError;

      setState({
        isUnlocked: !!entitlement,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error("Oracle access check failed:", err);
      setState({
        isUnlocked: false,
        isLoading: false,
        error: "I can't find active access for this email. Please make sure you log in with the same email address you used for the purchase.",
      });
    }
  }, []);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return { ...state, recheckAccess: checkAccess };
}
