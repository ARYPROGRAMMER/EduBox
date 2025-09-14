// Minimal shim for legacy UI code. Prefer Sonner's `toast` directly.

export function useToast() {
  return {
    toasts: [] as any[],
    toast: () => ({ dismiss: () => {} }),
    dismiss: (_id?: string) => {},
  };
}

export const toast = (_props?: any) => ({ dismiss: () => {} });
