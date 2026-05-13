import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useApiClient } from "@/api";
import { QUERY_KEYS } from "@/api/query-utils";

export type TodoFilters = {
  page?: number;
  limit?: number;
  sort?: "created_at" | "updated_at" | "title" | "priority" | "due_date" | "status";
  order?: "asc" | "desc";
  search?: string;
  status?: "draft" | "active" | "completed" | "archived";
  priority?: "low" | "medium" | "high";
  categoryId?: string;
  overdue?: boolean;
};

export type CreateTodoInput = {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  categoryId?: string;
  parentTodoId?: string;
};

export type UpdateTodoInput = Partial<{
  title: string;
  description: string;
  status: "draft" | "active" | "completed" | "archived";
  priority: "low" | "medium" | "high";
  dueDate: string;
  categoryId: string;
  parentTodoId: string;
}>;

export function useTodos(filters: TodoFilters = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: [...QUERY_KEYS.TODOS.all, filters],
    queryFn: async () => {
      const result = await api.Todo.getTodos({ query: filters });
      if (result.status !== 200) throw new Error("Failed to fetch todos");
      return result.body;
    },
  });
}

export function useTodoStats() {
  const api = useApiClient();
  return useQuery({
    queryKey: QUERY_KEYS.TODOS.stats,
    queryFn: async () => {
      const result = await api.Todo.getTodoStats({});
      if (result.status !== 200) throw new Error("Failed to fetch stats");
      return result.body;
    },
  });
}

export function useCreateTodo() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTodoInput) => {
      const result = await api.Todo.createTodo({ body: data });
      if (result.status !== 201) throw new Error("Failed to create todo");
      return result.body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TODOS.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TODOS.stats });
      toast.success("Todo created");
    },
    onError: () => toast.error("Failed to create todo"),
  });
}

export function useUpdateTodo() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTodoInput }) => {
      const result = await api.Todo.updateTodo({ params: { id }, body: data });
      if (result.status !== 200) throw new Error("Failed to update todo");
      return result.body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TODOS.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TODOS.stats });
      toast.success("Todo updated");
    },
    onError: () => toast.error("Failed to update todo"),
  });
}

export function useDeleteTodo() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await api.Todo.deleteTodo({ params: { id } });
      if (result.status !== 204) throw new Error("Failed to delete todo");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TODOS.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TODOS.stats });
      toast.success("Todo deleted");
    },
    onError: () => toast.error("Failed to delete todo"),
  });
}
