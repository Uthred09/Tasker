import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/layouts/app-layout";
import { AuthLayout } from "@/layouts/auth-layout";
import { ProtectedRoute } from "@/components/protected-route";
import { PublicRoute } from "@/components/public-route";
import LandingPage from "@/pages/landing-page";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import DashboardPage from "@/pages/dashboard-page";
import TodosPage from "@/pages/todos-page";
import CategoriesPage from "@/pages/categories-page";
import SettingsPage from "@/pages/settings-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <PublicRoute>
        <LandingPage />
      </PublicRoute>
    ),
  },
  {
    element: (
      <PublicRoute>
        <AuthLayout />
      </PublicRoute>
    ),
    children: [
      { path: "/sign-in/*", element: <SignInPage /> },
      { path: "/sign-up/*", element: <SignUpPage /> },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/todos", element: <TodosPage /> },
      { path: "/categories", element: <CategoriesPage /> },
      { path: "/settings", element: <SettingsPage /> },
    ],
  },
]);
