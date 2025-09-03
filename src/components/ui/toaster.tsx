
"use client"

import * as React from 'react';
import { ToastContext, type ToasterToast, type Toast } from "@/hooks/use-toast"
import {
  Toast as RadixToast,
  ToastClose,
  ToastDescription,
  ToastProvider as RadixToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

const TOAST_LIMIT = 3
const TOAST_REMOVE_DELAY = 1000000

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string, dispatch: React.Dispatch<Action>) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}


export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // Instead of queuing for removal, we simply update the state to close the toast.
      // The `onOpenChange` prop on the toast component will handle removing it from
      // the DOM after the exit animation.
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}


export function Toaster() {
  const { toasts } = React.useContext(ToastContext)!
  
  return (
      <RadixToastProvider>
        {toasts.map(function ({ id, title, description, action, ...props }) {
            return (
            <RadixToast 
              key={id} 
              {...props}
            >
                <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                    <ToastDescription>{description}</ToastDescription>
                )}
                </div>
                {action}
                <ToastClose />
            </RadixToast>
            )
        })}
        <ToastViewport />
      </RadixToastProvider>
  )
}

export function ToasterProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = React.useReducer(reducer, { toasts: [] });

    const toast = React.useCallback(({ duration = 5000, ...props }: Toast) => {
        const id = genId()

        const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

        dispatch({
            type: "ADD_TOAST",
            toast: {
                ...props,
                id,
                open: true,
                onOpenChange: (open: boolean) => {
                    if (!open) dismiss()
                },
            },
        })
        
        setTimeout(() => {
            dismiss();
        }, duration)

        return {
            id: id,
            dismiss,
        }
    }, [])

    const dismiss = React.useCallback((toastId?: string) => {
        dispatch({ type: "DISMISS_TOAST", toastId })
    }, [])

    React.useEffect(() => {
      // This effect can be used for any side-effects related to toasts.
      // For now, it's empty, but it's good practice to keep it for future use.
    }, [state]);


    return (
        <ToastContext.Provider value={{ toasts: state.toasts, toast, dismiss }}>
            {children}
        </ToastContext.Provider>
    )
}
