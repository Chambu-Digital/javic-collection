'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void
  success: (title: string, description?: string, duration?: number) => void
  error: (title: string, description?: string, duration?: number) => void
  warning: (title: string, description?: string, duration?: number) => void
  info: (title: string, description?: string, duration?: number) => void
  loading: (title: string, description?: string) => string
  dismiss: (id?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])

    // Auto remove after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id)
      }, toast.duration || 4000)
    }

    return id
  }

  const success = (title: string, description?: string, duration?: number) => {
    return showToast({ type: 'success', title, description, duration })
  }

  const error = (title: string, description?: string, duration?: number) => {
    return showToast({ type: 'error', title, description, duration })
  }

  const warning = (title: string, description?: string, duration?: number) => {
    return showToast({ type: 'warning', title, description, duration })
  }

  const info = (title: string, description?: string, duration?: number) => {
    return showToast({ type: 'info', title, description, duration })
  }

  const loading = (title: string, description?: string) => {
    return showToast({ type: 'info', title, description, duration: 0 })
  }

  const dismiss = (id?: string) => {
    if (id) {
      removeToast(id)
    } else {
      setToasts([])
    }
  }

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, loading, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[], onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast, onRemove: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10)
  }, [])

  const handleRemove = () => {
    setIsLeaving(true)
    setTimeout(() => onRemove(toast.id), 300)
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />
    }
  }

  const getStyles = () => {
    const baseStyles = "border-l-4 shadow-lg"
    switch (toast.type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-500`
      case 'error':
        return `${baseStyles} bg-red-50 border-red-500`
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-500`
      case 'info':
        return `${baseStyles} bg-blue-50 border-blue-500`
    }
  }

  return (
    <div
      className={`
        ${getStyles()}
        rounded-lg p-4 transition-all duration-300 ease-in-out transform
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${isLeaving ? 'scale-95' : 'scale-100'}
      `}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
              {toast.description && (
                <p className="text-sm text-gray-600 mt-1">{toast.description}</p>
              )}
            </div>
            <button
              onClick={handleRemove}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {toast.action && (
            <div className="mt-3">
              <button
                onClick={() => {
                  toast.action!.onClick()
                  handleRemove()
                }}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {toast.action.label}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}