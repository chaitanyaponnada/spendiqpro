
"use client"

// Inspired by react-hot-toast library
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  duration?: number;
}

type Toast = Omit<ToasterToast, "id">

interface ToastContextType {
    toasts: ToasterToast[];
    toast: (props: Toast) => { id: string; dismiss: () => void; };
    dismiss: (toastId?: string) => void;
}

export const ToastContext = React.createContext<ToastContextType | undefined>(undefined);


let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

function useToast() {
    const context = React.useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToasterProvider");
    }
    return context;
}

// Backwards compatibility for the old toast function
const toast = (props: Toast) => {
    // This is a placeholder and will not work correctly without the context provider.
    // The new approach requires using the `toast` function from the `useToast` hook.
    console.warn("Legacy toast function called. For full functionality, use the `toast` function from the `useToast` hook within a ToasterProvider.")
    const id = genId()
    return { id, dismiss: () => {} }
}

toast.dismiss = (toastId?: string) => {
     // This is a placeholder.
     console.warn("Legacy toast.dismiss function called.")
}


export { useToast, toast, ToastContext as ToastContextValue };
export type { ToasterToast, Toast };
