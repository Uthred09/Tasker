import { Outlet } from "react-router-dom";
import { CheckCheck } from "lucide-react";

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mb-8 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <CheckCheck className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold tracking-tight">Tasker</span>
      </div>
      <Outlet />
    </div>
  );
}
