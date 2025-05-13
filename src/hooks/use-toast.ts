
import { toast as sonnerToast, ToastT } from "sonner";

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  duration?: number;
  action?: React.ReactNode; // Add the missing action property
}

type Toast = ToastProps & {
  id: string;
};

// This will hold our toast notifications
const toasts: Toast[] = [];

export function toast({ title, description, variant = "default", duration, action }: ToastProps) {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast = { id, title, description, variant, duration, action };
  
  // Add to our internal store for the Toaster component
  toasts.push(newToast);
  
  // Use sonner toast for actual display
  sonnerToast(title, {
    description,
    duration,
    className: variant === "destructive" ? "bg-red-100" : 
               variant === "success" ? "bg-green-100" : "",
    // Pass action if it exists
    action: action,
  });
  
  // Remove from our internal store after timeout
  setTimeout(() => {
    const index = toasts.findIndex(t => t.id === id);
    if (index !== -1) {
      toasts.splice(index, 1);
    }
  }, duration || 5000);
  
  return id;
}

export const useToast = () => {
  return {
    toast,
    toasts: toasts, // Expose toasts array for the Toaster component
  };
};
