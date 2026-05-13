import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useApiClient } from "@/api";
import { QUERY_KEYS } from "@/api/query-utils";

export function useComments(todoId: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: QUERY_KEYS.COMMENTS(todoId),
    queryFn: async () => {
      const result = await api.Comment.getCommentsByTodoId({ params: { id: todoId } });
      if (result.status !== 200) throw new Error("Failed to fetch comments");
      return result.body;
    },
    enabled: !!todoId,
  });
}

export function useAddComment(todoId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const result = await api.Comment.addComment({
        params: { id: todoId },
        body: { content },
      });
      if (result.status !== 201) throw new Error("Failed to add comment");
      return result.body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COMMENTS(todoId) });
    },
    onError: () => toast.error("Failed to add comment"),
  });
}

export function useUpdateComment() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const result = await api.Comment.updateComment({
        params: { id },
        body: { content },
      });
      if (result.status !== 200) throw new Error("Failed to update comment");
      return result.body;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COMMENTS(data.todoId) });
    },
    onError: () => toast.error("Failed to update comment"),
  });
}

export function useDeleteComment(todoId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await api.Comment.deleteComment({ params: { id } });
      if (result.status !== 204) throw new Error("Failed to delete comment");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COMMENTS(todoId) });
    },
    onError: () => toast.error("Failed to delete comment"),
  });
}
