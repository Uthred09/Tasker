import { useApiClient } from "@/api";
import { QUERY_KEYS } from "@/api/query-utils";
import { API_URL } from "@/config/env";
import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

export function useUploadAttachment(todoId: string) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (file: File) => {
      const token = await getToken();
      const formData = new FormData();
      formData.append("file", file);

      const result = await axios.post(
        `${API_URL}/api/v1/todos/${todoId}/attachments`,
        formData,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            // No Content-Type — axios sets multipart/form-data with boundary
          },
          validateStatus: () => true,
        },
      );

      if (result.status !== 201) throw new Error("Failed to upload attachment");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TODOS.all });
      toast.success("File uploaded");
    },
    onError: () => toast.error("Failed to upload file"),
  });
}

export function useDeleteAttachment(todoId: string) {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (attachmentId: string) => {
      const result = await api.Todo.deleteTodoAttachment({
        params: { id: todoId, attachmentId },
      });
      if (result.status !== 204) throw new Error("Failed to delete attachment");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TODOS.all });
      toast.success("Attachment deleted");
    },
    onError: () => toast.error("Failed to delete attachment"),
  });
}

export function useGetAttachmentUrl() {
  const api = useApiClient();
  return useMutation({
    mutationFn: async ({
      todoId,
      attachmentId,
    }: {
      todoId: string;
      attachmentId: string;
    }) => {
      const result = await api.Todo.getAttachmentPresignedURL({
        params: { id: todoId, attachmentId },
      });
      if (result.status !== 200) throw new Error("Failed to get download URL");
      return result.body.url;
    },
  });
}
