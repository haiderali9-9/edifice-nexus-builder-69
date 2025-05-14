
import { toast as sonnerToast } from "sonner";
import { useToast as useShadcnToast } from "@/components/ui/toast";

// Create a useToast hook that uses the shadcn useToast hook
export const useToast = useShadcnToast;

// Create an enhanced toast function that uses sonner toast
export const toast = ({ title, description, variant, ...props }: any) => {
  // Use sonner toast for better visual notifications
  if (variant === "destructive") {
    return sonnerToast.error(title, {
      description,
      ...props
    });
  }
  
  return sonnerToast(title, {
    description,
    ...props
  });
};
