import type { ChangeEvent, DragEvent, RefObject } from 'react'
import { ClipboardPaste, FileText, LoaderCircle, Upload, Files } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

import type { DocumentRecord } from '../types'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type SourceDockProps = {
  documents: DocumentRecord[]
  isUploading: boolean
  isDragActive: boolean
  fileInputRef: RefObject<HTMLInputElement | null>
  acceptedFileTypes: string
  onFileSelection: (event: ChangeEvent<HTMLInputElement>) => Promise<void>
  onDrop: (event: DragEvent<HTMLLabelElement>) => Promise<void>
  onPasteButtonClick: () => Promise<void>
  onDragStateChange: (isActive: boolean) => void
}

export function SourceDock({
  documents,
  isUploading,
  isDragActive,
  fileInputRef,
  acceptedFileTypes,
  onFileSelection,
  onDrop,
  onDragStateChange,
  onPasteButtonClick,
}: SourceDockProps) {
  return (
    <aside className="relative flex h-full w-full flex-col border-l border-white/5 bg-black/20 backdrop-blur-3xl lg:w-[320px]">
      <header className="shrink-0 border-b border-white/5 px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Files className="h-4 w-4 text-blue-400" />
            <h2 className="font-['Manrope'] text-lg font-bold tracking-tight text-white">Sources</h2>
          </div>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5">
            <span className="text-xs font-bold text-blue-400">{documents.length}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar space-y-6">
        <div className="space-y-3">
          <label
            onDragEnter={() => onDragStateChange(true)}
            onDragOver={(event) => {
              event.preventDefault()
              onDragStateChange(true)
            }}
            onDragLeave={() => onDragStateChange(false)}
            onDrop={onDrop}
            className={cn(
              "group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border transition-all duration-300",
              isDragActive
                ? "border-blue-500 bg-blue-500/10"
                : "border-white/10 bg-white/[0.01] hover:border-white/20 hover:bg-white/[0.03]"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFileTypes}
              className="sr-only"
              onChange={onFileSelection}
            />

            <div className="p-5">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
                  isUploading ? "bg-blue-600 text-white" : "bg-white/5 text-slate-400 group-hover:text-blue-400"
                )}>
                  {isUploading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Upload File</p>
                  <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-tighter">PDF or Text</p>
                </div>
              </div>
            </div>
            
            <AnimatePresence>
              {isDragActive && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 flex items-center justify-center bg-blue-600/10 backdrop-blur-sm"
                >
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Drop here</span>
                </motion.div>
              )}
            </AnimatePresence>
          </label>

          <button
            type="button"
            onClick={() => void onPasteButtonClick()}
            className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.01] p-5 text-left transition-all hover:border-white/20 hover:bg-white/[0.03] group"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-400 group-hover:text-blue-400">
                <ClipboardPaste className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Paste Text</p>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-tighter">Add from clipboard</p>
              </div>
            </div>
          </button>
        </div>

        <section>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-4 px-1">Active Sources</h3>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {documents.length > 0 ? (
                documents.map((document, index) => (
                  <motion.article
                    key={document.id}
                    layout
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={cn(
                      "rounded-2xl border transition-all",
                      index === 0
                        ? "border-blue-500/30 bg-blue-500/[0.03]"
                        : "border-white/5 bg-white/[0.01]"
                    )}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "mt-1 flex h-8 w-8 items-center justify-center rounded-lg",
                          index === 0 ? "bg-blue-600/10 text-blue-400" : "bg-white/5 text-slate-600"
                        )}>
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-xs font-bold text-slate-200">{document.name}</p>
                            {index === 0 && (
                              <span className="shrink-0 text-[8px] font-black uppercase text-blue-500">Active</span>
                            )}
                          </div>
                          <p className="mt-1 text-[10px] font-medium text-slate-600">
                            {document.chunks} chunks • {document.uploadedAt}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/5 bg-white/[0.01] px-4 py-10 text-center">
                  <p className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">No Sources Added</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
      
      <footer className="shrink-0 p-5 border-t border-white/5">
        <div className="rounded-xl bg-white/[0.02] p-4 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Index Ready</span>
          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(56,189,248,0.4)]" />
        </div>
      </footer>
    </aside>
  )
}
