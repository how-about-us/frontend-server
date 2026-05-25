import { QueryClient } from "@tanstack/react-query";

let registeredQueryClient: QueryClient | null = null;

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 60_000,
      },
    },
  });
}

/** BFF·STOMP 등 React 밖에서 Query 캐시 접근용 — `AppRootProviders`에서 1회 등록 */
export function registerQueryClient(client: QueryClient): void {
  registeredQueryClient = client;
}

export function getQueryClient(): QueryClient | null {
  return registeredQueryClient;
}
