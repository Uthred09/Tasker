import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useApiClient } from "@/api";
import { QUERY_KEYS } from "@/api/query-utils";

export type CategoryFilters = {
  page?: number;
  limit?: number;
  sort?: "created_at" | "updated_at" | "name";
  order?: "asc" | "desc";
  search?: string;
};

export type CreateCategoryInput = {
  name: string;
  color: string;
  description?: string;
};

export type UpdateCategoryInput = Partial<{
  name: string;
  color: string;
  description: string;
}>;

export function useCategories(filters: CategoryFilters = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: [...QUERY_KEYS.CATEGORIES.all, filters],
    queryFn: async () => {
      const result = await api.Category.getCategories({ query: filters });
      if (result.status !== 200) throw new Error("Failed to fetch categories");
      return result.body;
    },
  });
}

export function useCreateCategory() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCategoryInput) => {
      const result = await api.Category.createCategory({ body: data });
      if (result.status !== 201) throw new Error("Failed to create category");
      return result.body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORIES.all });
      toast.success("Category created");
    },
    onError: () => toast.error("Failed to create category"),
  });
}

export function useUpdateCategory() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCategoryInput }) => {
      const result = await api.Category.updateCategory({ params: { id }, body: data });
      if (result.status !== 200) throw new Error("Failed to update category");
      return result.body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORIES.all });
      toast.success("Category updated");
    },
    onError: () => toast.error("Failed to update category"),
  });
}

export function useDeleteCategory() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await api.Category.deleteCategory({ params: { id } });
      if (result.status !== 204) throw new Error("Failed to delete category");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORIES.all });
      toast.success("Category deleted");
    },
    onError: () => toast.error("Failed to delete category"),
  });
}
