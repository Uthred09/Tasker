import { useRef } from "react";
import { X, Upload, Trash2, Download, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { useDeleteAttachment, useUploadAttachment, useGetAttachmentUrl } from "@/api/hooks";
import { cn } from "@/lib/utils";
import type { z } from "zod";
import type { ZPopulatedTodo } from "@tasker/zod";

type Todo = z.infer<typeof ZPopulatedTodo>;

interface TodoAttachmentsProps {
  todo: Todo;
  onClose: () => void;
}

export function TodoAttachments({ todo, onClose }: TodoAttachmentsProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadAttachment = useUploadAttachment(todo.id);
  const deleteAttachment = useDeleteAttachment(todo.id);
  const getUrl = useGetAttachmentUrl();

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAttachment.mutate(file);
    e.target.value = "";
  };

  const handleDownload = async (attachmentId: string) => {
    const url = await getUrl.mutateAsync({ todoId: todo.id, attachmentId });
    window.open(url, "_blank");
  };

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[80vh] w-full max-w-md flex-col rounded-xl border border-border bg-background shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border p-4">
          <div>
            <h3 className="text-sm font-semibold">Attachments</h3>
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{todo.title}</p>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-accent transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4">
          {todo.attachments.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Paperclip className="mb-2 h-6 w-6 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No attachments yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todo.attachments.map((att) => (
                <div
                  key={att.id}
                  className="group flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{att.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(att.fileSize)} · {format(new Date(att.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => handleDownload(att.id)}
                      className="rounded p-1 hover:bg-accent transition-colors"
                      aria-label="Download"
                    >
                      <Download className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => deleteAttachment.mutate(att.id)}
                      className="rounded p-1 hover:bg-destructive/10 transition-colors"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload */}
        <div className="border-t border-border p-4">
          <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploadAttachment.isPending}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-md border border-dashed",
              "border-border py-2.5 text-sm text-muted-foreground transition-colors",
              "hover:border-primary/50 hover:text-primary disabled:opacity-50"
            )}
          >
            <Upload className="h-4 w-4" />
            {uploadAttachment.isPending ? "Uploading…" : "Upload file"}
          </button>
        </div>
      </div>
    </div>
  );
}
