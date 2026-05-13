import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { useUpdateTodo, useCategories } from "@/api/hooks";
import { cn } from "@/lib/utils";
import type { ZPopulatedTodo } from "@tasker/zod";

type Todo = z.infer<typeof ZPopulatedTodo>;

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["draft", "active", "completed", "archived"]),
  priority: z.enum(["low", "medium", "high"]),
  dueDate: z.string().optional(),
  categoryId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface TodoEditFormProps {
  todo: Todo;
  onClose: () => void;
}

export function TodoEditForm({ todo, onClose }: TodoEditFormProps) {
  const updateTodo = useUpdateTodo();
  const { data: categories } = useCategories({ limit: 100 });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: todo.title,
      description: todo.description ?? "",
      status: todo.status,
      priority: todo.priority,
      dueDate: todo.dueDate
        ? new Date(todo.dueDate).toISOString().split("T")[0]
        : "",
      categoryId: todo.categoryId ?? "",
    },
  });

  const onSubmit = (values: FormValues) => {
    updateTodo.mutate(
      {
        id: todo.id,
        data: {
          title: values.title,
          description: values.description || undefined,
          status: values.status,
          priority: values.priority,
          dueDate: values.dueDate
            ? new Date(values.dueDate).toISOString()
            : undefined,
          categoryId: values.categoryId || undefined,
        },
      },
      { onSuccess: onClose }
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-xl border border-primary/30 bg-card p-4 shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Edit Todo</h3>
        <button type="button" onClick={onClose} className="rounded p-1 hover:bg-accent transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <input
            {...register("title")}
            placeholder="Todo title"
            autoFocus
            className={cn(
              "w-full rounded-md border bg-background px-3 py-2 text-sm",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
              errors.title ? "border-destructive" : "border-input"
            )}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
          )}
        </div>

        <textarea
          {...register("description")}
          placeholder="Description"
          rows={2}
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          )}
        />

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <select
            {...register("status")}
            className="rounded-md border border-input bg-background px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>

          <select
            {...register("priority")}
            className="rounded-md border border-input bg-background px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <input
            {...register("dueDate")}
            type="date"
            className="rounded-md border border-input bg-background px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <select
            {...register("categoryId")}
            className="rounded-md border border-input bg-background px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">No category</option>
            {categories?.data.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-3 py-1.5 text-sm hover:bg-accent transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={updateTodo.isPending}
          className={cn(
            "rounded-md bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground",
            "hover:bg-primary/90 transition-colors disabled:opacity-50"
          )}
        >
          {updateTodo.isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
