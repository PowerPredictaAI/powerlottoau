import { useProductAccess } from "./useProductAccess";

const ORACLE_ACCESS_ERROR_MESSAGE =
  "I can't find active access for this email. Please make sure you log in with the same email address you used for the purchase.";

export function useOracleAccess() {
  return useProductAccess("oracle-ai", {
    errorMessage: ORACLE_ACCESS_ERROR_MESSAGE,
  });
}
