import { AlertCircle, CheckCircle2 } from 'lucide-react'

import type { ToastState } from '../types'

type ToastProps = {
  toast: ToastState | null
}

export function Toast({ toast }: ToastProps) {
  if (!toast) {
    return null
  }

  const isSuccess = toast.tone === 'success'

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50">
      <div
        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-[0_20px_50px_rgba(15,23,42,0.18)] ${
          isSuccess ? 'border-emerald-200 bg-white text-slate-800' : 'border-rose-200 bg-white text-slate-800'
        }`}
      >
        <div
          className={`rounded-full p-1.5 ${
            isSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
          }`}
        >
          {isSuccess ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        </div>
        <span>{toast.message}</span>
      </div>
    </div>
  )
}
