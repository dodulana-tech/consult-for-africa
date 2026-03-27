import { create } from "zustand";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastStore {
  toasts: Toast[];
  _timers: Map<string, ReturnType<typeof setTimeout>>;
  add: (type: ToastType, message: string) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  _timers: new Map(),
  add: (type, message) => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const timer = setTimeout(() => {
      get().remove(id);
    }, 3000);
    set((s) => {
      const timers = new Map(s._timers);
      timers.set(id, timer);
      return { toasts: [...s.toasts, { id, type, message }], _timers: timers };
    });
  },
  remove: (id) => {
    set((s) => {
      const existing = s._timers.get(id);
      if (existing) clearTimeout(existing);
      const timers = new Map(s._timers);
      timers.delete(id);
      return { toasts: s.toasts.filter((t) => t.id !== id), _timers: timers };
    });
  },
}));

/** Convenience hook */
export function useToast() {
  const add = useToastStore((s) => s.add);
  return {
    success: (msg: string) => add("success", msg),
    error: (msg: string) => add("error", msg),
    info: (msg: string) => add("info", msg),
  };
}
