// Legacy local toast implementation removed.
// Use Sonner's `toast` API instead: `import { toast } from 'sonner'`.

export function useToast() {
  // no-op shim to avoid runtime errors if something still imports this.
  return {
    toasts: [] as any[],
    toast: () => ({ dismiss: () => {} }),
    dismiss: (_id?: string) => {},
  };
}

export const toast = (_props?: any) => ({ dismiss: () => {} });
