import { useState } from "react";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { useCategories, useDeleteCategory } from "@/api/hooks";
import { CategoryCreateForm } from "@/components/categories/category-create-form";
import { CategoryEditForm } from "@/components/categories/category-edit-form";
import { cn } from "@/lib/utils";
import type { z } from "zod";
import type { ZTodoCategory } from "@tasker/zod";

type Category = z.infer<typeof ZTodoCategory>;

export default function CategoriesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  const { data, isLoading } = useCategories({ limit: 100 });
  const deleteCategory = useDeleteCategory();

  const handleDelete = (id: string) => {
    if (!confirm("Delete this category? Todos in this category will be uncategorized.")) return;
    deleteCategory.mutate(id);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize your todos with color-coded categories.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className={cn(
            "flex items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-medium",
            "text-primary-foreground hover:bg-primary/90 transition-colors"
          )}
        >
          <Plus className="h-4 w-4" />
          New Category
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="mb-4">
          <CategoryCreateForm onClose={() => setShowCreate(false)} />
        </div>
      )}

      {/* Edit form */}
      {editCategory && (
        <div className="mb-4">
          <CategoryEditForm category={editCategory} onClose={() => setEditCategory(null)} />
        </div>
      )}

      {/* Category grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <Tag className="mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium">No categories yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create a category to start organizing your todos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data?.data.map((cat) => (
            <div
              key={cat.id}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div
                className="h-8 w-8 shrink-0 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{cat.name}</p>
                {cat.description && (
                  <p className="truncate text-xs text-muted-foreground">{cat.description}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => setEditCategory(cat)}
                  className="rounded p-1 hover:bg-accent transition-colors"
                  aria-label="Edit"
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="rounded p-1 hover:bg-destructive/10 transition-colors"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
