import { useState } from "react";
import { Trash2, Pencil, MessageSquare, Paperclip } from "lucide-react";
import { format, isPast, parseISO } from "date-fns";
import { useUpdateTodo, useDeleteTodo } from "@/api/hooks";
import { TodoEditForm } from "./todo-edit-form";
import { TodoCommentsDialog } from "./todo-comments-dialog";
import { TodoAttachments } from "./todo-attachments";
import { cn } from "@/lib/utils";
import type { z } from "zod";
import type { ZPopulatedTodo } from "@tasker/zod";

type Todo = z.infer<typeof ZPopulatedTodo>;

const PRIORITY_STYLES = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

const STATUS_STYLES = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  archived: "bg-muted text-muted-foreground/60",
};

interface TodoCardProps {
  todo: Todo;
}

export function TodoCard({ todo }: TodoCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);

  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  const isCompleted = todo.status === "completed";
  const isOverdue =
    todo.dueDate && !isCompleted && isPast(parseISO(todo.dueDate));

  const handleToggleComplete = () => {
    updateTodo.mutate({
      id: todo.id,
      data: { status: isCompleted ? "active" : "completed" },
    });
  };

  const handleDelete = () => {
    if (!confirm("Delete this todo?")) return;
    deleteTodo.mutate(todo.id);
  };

  if (showEdit) {
    return <TodoEditForm todo={todo} onClose={() => setShowEdit(false)} />;
  }

  return (
    <>
      <div
        className={cn(
          "group rounded-lg border border-border bg-card p-4 transition-colors",
          "hover:border-border/80 hover:shadow-sm"
        )}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={handleToggleComplete}
            disabled={updateTodo.isPending}
            className={cn(
              "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded",
              "border-2 transition-colors",
              isCompleted
                ? "border-emerald-500 bg-emerald-500"
                : "border-muted-foreground/40 hover:border-primary"
            )}
            aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
          >
            {isCompleted && (
              <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  "text-sm font-medium",
                  isCompleted && "line-through text-muted-foreground"
                )}
              >
                {todo.title}
              </span>
              <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", PRIORITY_STYLES[todo.priority])}>
                {todo.priority}
              </span>
              <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", STATUS_STYLES[todo.status])}>
                {todo.status}
              </span>
              {todo.category && (
                <span
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium"
                  style={{ color: todo.category.color }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: todo.category.color }}
                  />
                  {todo.category.name}
                </span>
              )}
            </div>
            {todo.description && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {todo.description}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {todo.dueDate && (
                <span
                  className={cn(
                    "text-xs",
                    isOverdue ? "font-medium text-red-500" : "text-muted-foreground"
                  )}
                >
                  {isOverdue ? "Overdue · " : "Due "}
                  {format(parseISO(todo.dueDate), "MMM d, yyyy")}
                </span>
              )}
              {todo.children.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {todo.children.filter((c) => c.status === "completed").length}/{todo.children.length} subtasks
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => setShowComments(true)}
              className="flex items-center gap-1 rounded p-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors"
              aria-label="Comments"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {todo.comments.length > 0 && <span>{todo.comments.length}</span>}
            </button>
            <button
              onClick={() => setShowAttachments(true)}
              className="flex items-center gap-1 rounded p-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors"
              aria-label="Attachments"
            >
              <Paperclip className="h-3.5 w-3.5" />
              {todo.attachments.length > 0 && <span>{todo.attachments.length}</span>}
            </button>
            <button
              onClick={() => setShowEdit(true)}
              className="rounded p-1.5 text-muted-foreground hover:bg-accent transition-colors"
              aria-label="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleDelete}
              className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              aria-label="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {showComments && (
        <TodoCommentsDialog todo={todo} onClose={() => setShowComments(false)} />
      )}
      {showAttachments && (
        <TodoAttachments todo={todo} onClose={() => setShowAttachments(false)} />
      )}
    </>
  );
}
