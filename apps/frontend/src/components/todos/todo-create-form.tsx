import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { useCreateTodo, useCategories } from "@/api/hooks";
import { cn } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.string().optional(),
  categoryId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface TodoCreateFormProps {
  onClose: () => void;
  parentTodoId?: string;
}

export function TodoCreateForm({ onClose, parentTodoId }: TodoCreateFormProps) {
  const createTodo = useCreateTodo();
  const { data: categories } = useCategories({ limit: 100 });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = (values: FormValues) => {
    createTodo.mutate(
      {
        title: values.title,
        ...(values.description ? { description: values.description } : {}),
        ...(values.priority ? { priority: values.priority } : {}),
        ...(values.dueDate ? { dueDate: new Date(values.dueDate).toISOString() } : {}),
        ...(values.categoryId ? { categoryId: values.categoryId } : {}),
        ...(parentTodoId ? { parentTodoId } : {}),
      },
      { onSuccess: onClose }
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-xl border border-border bg-card p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{parentTodoId ? "Add Sub-task" : "New Todo"}</h3>
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
          placeholder="Description (optional)"
          rows={2}
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          )}
        />

        <div className="grid grid-cols-3 gap-2">
          <select
            {...register("priority")}
            className={cn(
              "rounded-md border border-input bg-background px-2 py-2 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-ring"
            )}
          >
            <option value="">Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <input
            {...register("dueDate")}
            type="date"
            className={cn(
              "rounded-md border border-input bg-background px-2 py-2 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-ring"
            )}
          />

          <select
            {...register("categoryId")}
            className={cn(
              "rounded-md border border-input bg-background px-2 py-2 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-ring"
            )}
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
          disabled={createTodo.isPending}
          className={cn(
            "rounded-md bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground",
            "hover:bg-primary/90 transition-colors disabled:opacity-50"
          )}
        >
          {createTodo.isPending ? "Creating…" : "Create"}
        </button>
      </div>
    </form>
  );
}
