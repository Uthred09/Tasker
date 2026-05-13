import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { useCreateCategory } from "@/api/hooks";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#6366F1", "#8B5CF6", "#EC4899", "#EF4444",
  "#F97316", "#EAB308", "#22C55E", "#06B6D4",
];

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().min(1, "Color is required"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface CategoryCreateFormProps {
  onClose: () => void;
}

export function CategoryCreateForm({ onClose }: CategoryCreateFormProps) {
  const createCategory = useCreateCategory();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { color: PRESET_COLORS[0] },
  });

  const selectedColor = watch("color");

  const onSubmit = (values: FormValues) => {
    createCategory.mutate(
      { name: values.name, color: values.color, description: values.description },
      { onSuccess: onClose }
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-xl border border-border bg-card p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">New Category</h3>
        <button type="button" onClick={onClose} className="rounded p-1 hover:bg-accent transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <input
            {...register("name")}
            placeholder="Category name"
            autoFocus
            className={cn(
              "w-full rounded-md border bg-background px-3 py-2 text-sm",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
              errors.name ? "border-destructive" : "border-input"
            )}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <input
          {...register("description")}
          placeholder="Description (optional)"
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          )}
        />

        {/* Color picker */}
        <div>
          <p className="mb-2 text-xs text-muted-foreground">Color</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setValue("color", color)}
                className={cn(
                  "h-7 w-7 rounded-full transition-transform hover:scale-110",
                  selectedColor === color && "ring-2 ring-offset-2 ring-offset-background"
                )}
                style={{ backgroundColor: color, ringColor: color }}
                aria-label={color}
              />
            ))}
          </div>
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
          disabled={createCategory.isPending}
          className={cn(
            "rounded-md px-3.5 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
          )}
          style={{ backgroundColor: selectedColor }}
        >
          {createCategory.isPending ? "Creating…" : "Create"}
        </button>
      </div>
    </form>
  );
}
