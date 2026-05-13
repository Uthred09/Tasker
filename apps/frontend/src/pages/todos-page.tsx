import { useState } from "react";
import { Plus, Search, SlidersHorizontal, CheckSquare } from "lucide-react";
import { useTodos } from "@/api/hooks";
import { useDebounce } from "@/api/hooks";
import { useCategories } from "@/api/hooks";
import { TodoCard } from "@/components/todos/todo-card";
import { TodoCreateForm } from "@/components/todos/todo-create-form";
import { cn } from "@/lib/utils";
import type { TodoFilters } from "@/api/hooks/use-todo-query";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "Any priority" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export default function TodosPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TodoFilters["status"] | "">("");
  const [priority, setPriority] = useState<TodoFilters["priority"] | "">("");
  const [categoryId, setCategoryId] = useState("");
  const [overdue, setOverdue] = useState(false);
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 400);
  const { data: categories } = useCategories({ limit: 100 });

  const filters: TodoFilters = {
    page,
    limit: 20,
    sort: "created_at",
    order: "desc",
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(overdue ? { overdue: true } : {}),
  };

  const { data, isLoading } = useTodos(filters);

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setPriority("");
    setCategoryId("");
    setOverdue(false);
    setPage(1);
  };

  const hasFilters = search || status || priority || categoryId || overdue;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Todos</h1>
        <button
          onClick={() => setShowCreate(true)}
          className={cn(
            "flex items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-medium",
            "text-primary-foreground hover:bg-primary/90 transition-colors"
          )}
        >
          <Plus className="h-4 w-4" />
          New Todo
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="mb-4">
          <TodoCreateForm onClose={() => setShowCreate(false)} />
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-48">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search todos…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className={cn(
              "h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            )}
          />
        </div>

        {/* Status filter */}
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1); }}
          className={cn(
            "h-8 rounded-md border border-input bg-background px-2 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-ring"
          )}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Priority filter */}
        <select
          value={priority}
          onChange={(e) => { setPriority(e.target.value as typeof priority); setPage(1); }}
          className={cn(
            "h-8 rounded-md border border-input bg-background px-2 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-ring"
          )}
        >
          {PRIORITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Category filter */}
        <select
          value={categoryId}
          onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
          className={cn(
            "h-8 rounded-md border border-input bg-background px-2 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-ring"
          )}
        >
          <option value="">All categories</option>
          {categories?.data.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        {/* Overdue toggle */}
        <label className="flex cursor-pointer items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={overdue}
            onChange={(e) => { setOverdue(e.target.checked); setPage(1); }}
            className="rounded border-input accent-primary"
          />
          <span className="text-muted-foreground">Overdue only</span>
        </label>

        {hasFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <SlidersHorizontal className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <CheckSquare className="mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium">
            {hasFilters ? "No todos match your filters" : "No todos yet"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {hasFilters ? "Try adjusting your search or filters." : "Create a todo to get started."}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {data?.data.map((todo) => (
              <TodoCard key={todo.id} todo={todo} />
            ))}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-accent transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {data.page} of {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-accent transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
