import { ref, readonly } from 'vue'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration: number
  action?: ToastAction
  progress?: number
  startTime?: number
}

const toasts = ref<Toast[]>([])
let toastId = 0
const intervals = new Map<number, ReturnType<typeof setInterval>>()

export const useToast = () => {
  const show = (
    message: string,
    type: Toast['type'] = 'info',
    duration: number = 3000,
    action?: ToastAction
  ) => {
    const id = ++toastId
    const toast: Toast = {
      id,
      message,
      type,
      duration,
      action,
      progress: 100,
      startTime: Date.now()
    }
    toasts.value.push(toast)

    if (duration > 0) {
      // Update progress for animation
      const interval = setInterval(() => {
        const toastIndex = toasts.value.findIndex(t => t.id === id)
        if (toastIndex === -1) {
          clearInterval(interval)
          intervals.delete(id)
          return
        }

        const elapsed = Date.now() - (toast.startTime || Date.now())
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
        toasts.value[toastIndex].progress = remaining

        if (remaining <= 0) {
          clearInterval(interval)
          intervals.delete(id)
          remove(id)
        }
      }, 50)

      intervals.set(id, interval)
    }

    return id
  }

  const remove = (id: number) => {
    const interval = intervals.get(id)
    if (interval) {
      clearInterval(interval)
      intervals.delete(id)
    }

    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const success = (message: string, duration?: number, action?: ToastAction) =>
    show(message, 'success', duration, action)
  const error = (message: string, duration?: number, action?: ToastAction) =>
    show(message, 'error', duration, action)
  const info = (message: string, duration?: number, action?: ToastAction) =>
    show(message, 'info', duration, action)
  const warning = (message: string, duration?: number, action?: ToastAction) =>
    show(message, 'warning', duration, action)

  // Helper for undo actions
  const showWithUndo = (
    message: string,
    onUndo: () => void,
    type: Toast['type'] = 'info',
    duration: number = 5000
  ) => {
    const id = show(message, type, duration, {
      label: '復原',
      onClick: () => {
        onUndo()
        remove(id)
      }
    })
    return id
  }

  return {
    toasts: readonly(toasts),
    show,
    remove,
    success,
    error,
    info,
    warning,
    showWithUndo,
  }
}
