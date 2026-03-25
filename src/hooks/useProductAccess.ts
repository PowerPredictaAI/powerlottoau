import { useState, useCallback, useEffect } from "react";
import { normalizeEmail, PRODUCT_ACCESS_REFRESH_EVENT } from "@/lib/accessControl";

const CHECK_ACCESS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-access`;

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
      const resp = await fetch(CHECK_ACCESS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ email, product_slug: productSlug }),
      });

      if (!resp.ok) throw new Error("Access check request failed");

      const result = await resp.json();

      setState({
        isUnlocked: result.has_access === true,
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