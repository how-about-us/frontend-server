import { useQuery } from "@tanstack/react-query";

import { fetchCurrentAgreements } from "@/lib/api/agreements";

export const CURRENT_AGREEMENTS_QUERY_KEY = ["agreements", "current"] as const;

export function useCurrentAgreements() {
  return useQuery({
    queryKey: CURRENT_AGREEMENTS_QUERY_KEY,
    queryFn: fetchCurrentAgreements,
    staleTime: 5 * 60 * 1000,
  });
}
