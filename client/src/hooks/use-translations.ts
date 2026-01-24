import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { Translation } from "@shared/schema";
import { z } from "zod";

export function useTranslations() {
  return useQuery({
    queryKey: [api.translations.list.path],
    queryFn: async () => {
      const res = await fetch(api.translations.list.path, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        throw new Error("Failed to fetch translations");
      }
      return api.translations.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateTranslation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) => {
      const validated = api.translations.create.input.parse({ text });
      const res = await fetch(api.translations.create.path, {
        method: api.translations.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        const error = await res.json();
        throw new Error(error.message || "Failed to translate");
      }
      
      return api.translations.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.translations.list.path] });
    },
  });
}
