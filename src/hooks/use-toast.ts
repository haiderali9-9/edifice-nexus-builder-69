
import { toast as sonnerToast } from "sonner";

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function toast({ title, description, variant = "default" }: ToastProps) {
  sonnerToast(title, {
    description,
    className: variant === "destructive" ? "bg-red-100" : "",
  });
}

export const useToast = () => {
  return {
    toast,
  };
};
