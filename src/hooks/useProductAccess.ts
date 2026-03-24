import { useState, useCallback, useEffect } from "react";
import { externalSupabase } from "@/lib/externalSupabase";
import { normalizeEmail, PRODUCT_ACCESS_REFRESH_EVENT } from "@/lib/accessControl";

interface ProductAccessState {
  isUnlocked: boolean;
  isLoading: boolean;
  error: string | null;
}

interface UseProductAccessOptions {
  errorMessage?: string;
}

export function useProductAccess(productSlug: string, options?: UseProductAccessOptions) {
  const [state, setState] = useState<ProductAccessState>({
    isUnlocked: false,
    isLoading: true,
    error: null,
  });

  const checkAccess = useCallback(async () => {
    const storedEmail = localStorage.getItem("userEmail");
    const email = storedEmail ? normalizeEmail(storedEmail) : "";

    if (!email) {
      setState({ isUnlocked: false, isLoading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const [{ data: profile, error: profileError }, { data: product, error: productError }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id")
          .ilike("email", email)
          .limit(1)
          .maybeSingle(),
        supabase
          .from("products")
          .select("id")
          .eq("slug", productSlug)
          .eq("is_active", true)
          .maybeSingle(),
      ]);

      if (profileError) throw profileError;
      if (productError) throw productError;

      if (!profile || !product) {
        setState({ isUnlocked: false, isLoading: false, error: null });
        return;
      }

      const now = new Date().toISOString();
      const { data: entitlement, error: entitlementError } = await supabase
        .from("entitlements")
        .select("id")
        .eq("user_id", profile.id)
        .eq("product_id", product.id)
        .eq("status", "active")
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .maybeSingle();

      if (entitlementError) throw entitlementError;

      setState({
        isUnlocked: !!entitlement,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error(`Access check failed for ${productSlug}:`, err);
      setState({
        isUnlocked: false,
        isLoading: false,
        error: options?.errorMessage ?? null,
      });
    }
  }, [options?.errorMessage, productSlug]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  useEffect(() => {
    const handleRefresh = () => {
      void checkAccess();
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "userEmail") {
        void checkAccess();
      }
    };

    window.addEventListener(PRODUCT_ACCESS_REFRESH_EVENT, handleRefresh);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(PRODUCT_ACCESS_REFRESH_EVENT, handleRefresh);
      window.removeEventListener("storage", handleStorage);
    };
  }, [checkAccess]);

  return { ...state, recheckAccess: checkAccess };
}