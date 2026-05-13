import { CheckSquare, Clock, AlertCircle, ListTodo } from "lucide-react";
import { useTodoStats, useTodos } from "@/api/hooks";
import { cn } from "@/lib/utils";
import { TodoCard } from "@/components/todos/todo-card";

interface StatCardProps {
  label: string;
  value: number | undefined;
  icon: React.ElementType;
  color: string;
  loading: boolean;
}

function StatCard({ label, value, icon: Icon, color, loading }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className={cn("mt-2 text-3xl font-bold", color)}>
            {loading ? "—" : (value ?? 0)}
          </p>
        </div>
        <div className={cn("rounded-lg p-2", `${color} bg-current/10`)}>
          <Icon className={cn("h-4 w-4", color)} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useTodoStats();
  const { data: recent, isLoading: todosLoading } = useTodos({ limit: 5, sort: "created_at", order: "desc" });

  const statCards = [
    { label: "Active", value: stats?.active, icon: ListTodo, color: "text-blue-500" },
    { label: "Completed", value: stats?.completed, icon: CheckSquare, color: "text-emerald-500" },
    { label: "Overdue", value: stats?.overdue, icon: AlertCircle, color: "text-red-500" },
    { label: "Total", value: stats?.total, icon: Clock, color: "text-muted-foreground" },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your tasks and productivity.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} loading={statsLoading} />
        ))}
      </div>

      {/* Recent todos */}
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Recent Todos
        </h2>
        {todosLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : recent?.data.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">No todos yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent?.data.map((todo) => (
              <TodoCard key={todo.id} todo={todo} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
