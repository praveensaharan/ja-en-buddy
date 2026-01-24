import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { Summary } from "@shared/schema";

export function useSummaries() {
  return useQuery({
    queryKey: [api.summaries.list.path],
    queryFn: async () => {
      const res = await fetch(api.summaries.list.path, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        throw new Error("Failed to fetch summaries");
      }
      return api.summaries.list.responses[200].parse(await res.json());
    },
  });
}

export function useGenerateSummary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.summaries.generate.path, {
        method: api.summaries.generate.method,
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        const error = await res.json();
        throw new Error(error.message || "Failed to generate summary");
      }
      
      return api.summaries.generate.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.summaries.list.path] });
    },
  });
}
