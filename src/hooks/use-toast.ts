
import { toast as sonnerToast } from "sonner";
import { useState, useCallback } from "react";
import type { ToastProps } from "@/components/ui/toast";

// Create a local implementation of useToast
// This will avoid circular dependencies with components/ui/use-toast.ts

type ToastActionElement = React.ReactElement;

export type ToastData = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 1000000;

type State = {
  toasts: ToastData[];
};

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

export const useToast = () => {
  const [state, setState] = useState<State>({
    toasts: [],
  });

  const dismiss = useCallback((toastId?: string) => {
    setState((state) => {
      if (toastId) {
        toastTimeouts.forEach((_, key) => {
          if (key === toastId) {
            toastTimeouts.delete(key);
          }
        });
        
        return {
          ...state,
          toasts: state.toasts.filter(({ id }) => id !== toastId),
        };
      }
      
      return {
        ...state,
        toasts: [],
      };
    });
  }, []);

  const toast = useCallback(
    ({ ...props }: Omit<ToastData, "id">) => {
      const id = genId();

      const update = (props: ToastData) =>
        setState((state) => ({
          ...state,
          toasts: state.toasts.map((t) =>
            t.id === props.id ? { ...t, ...props } : t
          ),
        }));

      const dismiss = () => {
        setState((state) => ({
          ...state,
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      };

      setState((state) => {
        const toasts = [...state.toasts];

        if (toasts.length >= TOAST_LIMIT) {
          toasts.shift();
        }

        const newToast = { id, ...props };
        toasts.push(newToast);
        
        return {
          ...state,
          toasts,
        };
      });

      setTimeout(() => {
        dismiss();
      }, TOAST_REMOVE_DELAY);

      return {
        id,
        dismiss,
        update,
      };
    },
    [dismiss]
  );

  return {
    toasts: state.toasts,
    toast,
    dismiss,
  };
};

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
