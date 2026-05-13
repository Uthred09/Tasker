import { toast } from "sonner";

export function showApiErrorToast(message?: string) {
  toast.error(message ?? "Something went wrong. Please try again.");
}
