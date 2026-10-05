import React, { useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react'

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  const styles = {
    success: {
      bg: 'bg-teal-50',
      border: 'border-teal-200',
      text: 'text-teal-800',
      icon: <CheckCircle className="w-5 h-5 text-teal-600" />
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: <XCircle className="w-5 h-5 text-red-500" />
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />
    }
  }

  const style = styles[type] || styles.success

  return (
    <div className={`fixed bottom-4 right-4 z-[60] max-w-md w-full ${style.bg} border ${style.border} rounded-xl shadow-lg p-4 animate-slide-up`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">{style.icon}</div>
        <div className="flex-1">
          <p className={`text-sm font-medium ${style.text}`}>{message}</p>
        </div>
        <button onClick={onClose} className="flex-shrink-0 text-[#64748B] hover:text-[#0F172A]">
          <X size={18} />
        </button>
      </div>
    </div>
  )
}

export default Toast