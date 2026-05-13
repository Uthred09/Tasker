import { Link } from "react-router-dom";
import { CheckCheck, CheckSquare, Tag, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: CheckSquare,
    title: "Smart Todos",
    description: "Create todos with priority, due dates, categories, and sub-tasks.",
  },
  {
    icon: Tag,
    title: "Categories",
    description: "Organize todos with color-coded categories for quick filtering.",
  },
  {
    icon: BarChart3,
    title: "Weekly Reports",
    description: "Automatic email digests with your productivity stats every week.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <CheckCheck className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">Tasker</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/sign-in"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/sign-up"
              className={cn(
                "rounded-md bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground",
                "hover:bg-primary/90 transition-colors"
              )}
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="max-w-xl text-4xl font-bold tracking-tight text-foreground">
          Stay on top of everything you need to do
        </h1>
        <p className="mt-4 max-w-md text-base text-muted-foreground">
          A clean, fast task manager with categories, priorities, attachments,
          comments, and weekly email summaries.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            to="/sign-up"
            className={cn(
              "rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground",
              "hover:bg-primary/90 transition-colors"
            )}
          >
            Start for free
          </Link>
          <Link
            to="/sign-in"
            className={cn(
              "rounded-md border border-border px-5 py-2.5 text-sm font-medium",
              "hover:bg-accent transition-colors"
            )}
          >
            Sign in
          </Link>
        </div>

        {/* Features */}
        <div className="mt-20 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-card p-5 text-left"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="mb-1 text-sm font-semibold">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
