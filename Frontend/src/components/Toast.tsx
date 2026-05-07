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
    <div className="pointer-events-none fixed bottom-8 left-1/2 -translate-x-1/2 z-50 md:left-auto md:right-8 md:translate-x-0">
      <div
        className={`flex animate-in fade-in slide-in-from-bottom-2 items-center gap-3 rounded-2xl border px-5 py-4 text-[13px] font-bold shadow-2xl backdrop-blur-xl transition-all ${
          isSuccess 
            ? 'border-emerald-500/20 bg-[#0c0e12]/90 text-emerald-400' 
            : 'border-rose-500/20 bg-[#0c0e12]/90 text-rose-400'
        }`}
      >
        <div
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
            isSuccess ? 'bg-emerald-500/10' : 'bg-rose-500/10'
          }`}
        >
          {isSuccess ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        </div>
        <span className="leading-tight">{toast.message}</span>
      </div>
    </div>
  )
}
