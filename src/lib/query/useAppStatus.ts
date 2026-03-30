import { useQuery } from "@tanstack/react-query";

export function useAppStatus() {
  return useQuery({
    queryKey: ["appStatus"],
    queryFn: async () => {
      // 외부 API 호출 없이도 쿼리 파이프라인이 동작하는지 확인용 데이터.
      return { status: "ok" as const, updatedAt: Date.now() };
    },
  });
}

