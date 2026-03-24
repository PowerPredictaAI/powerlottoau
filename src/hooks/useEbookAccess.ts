import { useProductAccess } from "./useProductAccess";

export function useEbookAccess() {
  const { isUnlocked, isLoading, recheckAccess } = useProductAccess("smart-player-manual");

  return {
    isUnlocked,
    isLoading,
    recheckAccess,
  };
}
