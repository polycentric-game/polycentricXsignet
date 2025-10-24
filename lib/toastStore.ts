import { create } from 'zustand';
import { Toast, ToastType } from '@/components/ui/Toast';

interface ToastState {
  toasts: Toast[];
  addToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  
  addToast: (type, title, message, duration = 5000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: Toast = { id, type, title, message, duration };
    
    set((state) => ({
      toasts: [...state.toasts, toast],
    }));
  },
  
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
  
  clearToasts: () => {
    set({ toasts: [] });
  },
}));

// Convenience functions
export const toast = {
  success: (title: string, message?: string) => 
    useToastStore.getState().addToast('success', title, message),
  error: (title: string, message?: string) => 
    useToastStore.getState().addToast('error', title, message),
  info: (title: string, message?: string) => 
    useToastStore.getState().addToast('info', title, message),
  warning: (title: string, message?: string) => 
    useToastStore.getState().addToast('warning', title, message),
};
