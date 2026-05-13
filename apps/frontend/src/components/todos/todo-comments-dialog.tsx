import { useState } from "react";
import { X, Send, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useComments, useAddComment, useDeleteComment } from "@/api/hooks";
import { useUser } from "@clerk/clerk-react";
import { cn } from "@/lib/utils";
import type { z } from "zod";
import type { ZPopulatedTodo } from "@tasker/zod";

type Todo = z.infer<typeof ZPopulatedTodo>;

interface TodoCommentsDialogProps {
  todo: Todo;
  onClose: () => void;
}

export function TodoCommentsDialog({ todo, onClose }: TodoCommentsDialogProps) {
  const [content, setContent] = useState("");
  const { user } = useUser();
  const { data: comments, isLoading } = useComments(todo.id);
  const addComment = useAddComment(todo.id);
  const deleteComment = useDeleteComment(todo.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    addComment.mutate(content.trim(), { onSuccess: () => setContent("") });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-xl border border-border bg-background shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border p-4">
          <div>
            <h3 className="text-sm font-semibold">Comments</h3>
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{todo.title}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-accent transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : !comments?.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No comments yet. Be the first to comment.
            </p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="group flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {user?.firstName?.[0] ?? "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">
                        {user?.firstName ?? "You"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.createdAt), "MMM d, h:mm a")}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm">{comment.content}</p>
                  </div>
                  {comment.userId === user?.id && (
                    <button
                      onClick={() => deleteComment.mutate(comment.id)}
                      className="shrink-0 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10"
                      aria-label="Delete comment"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t border-border p-4">
          <div className="flex gap-2">
            <input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a comment…"
              className={cn(
                "flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm",
                "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              )}
            />
            <button
              type="submit"
              disabled={!content.trim() || addComment.isPending}
              className={cn(
                "flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium",
                "text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              )}
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
