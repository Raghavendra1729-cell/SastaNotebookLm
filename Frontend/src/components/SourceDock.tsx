import type { ChangeEvent, DragEvent, RefObject } from 'react'
import { ClipboardPaste, FileText, LoaderCircle, Paperclip, Sparkles, Upload } from 'lucide-react'

import type { DocumentRecord } from '../types'

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
  onPasteButtonClick,
  onDragStateChange,
}: SourceDockProps) {
  return (
    <aside className="flex w-full flex-col border-t border-white/10 bg-[#101319] lg:w-[320px] lg:border-l lg:border-t-0">
      <div className="border-b border-white/10 px-5 py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Sources</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Attach context</h2>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-right">
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Indexed</p>
            <p className="mt-1 text-base font-semibold text-white">{documents.length}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <label
          onDragEnter={() => onDragStateChange(true)}
          onDragOver={(event) => {
            event.preventDefault()
            onDragStateChange(true)
          }}
          onDragLeave={() => onDragStateChange(false)}
          onDrop={onDrop}
          className={`group flex cursor-pointer flex-col rounded-2xl border border-dashed p-5 transition ${
            isDragActive
              ? 'border-slate-300 bg-white/10'
              : 'border-white/12 bg-white/4 hover:border-white/30 hover:bg-white/6'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFileTypes}
            className="sr-only"
            onChange={onFileSelection}
          />

          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white">
              {isUploading ? <LoaderCircle className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
            </div>
            <div>
              <p className="text-base font-semibold text-white">
                {isUploading ? 'Uploading...' : 'Drop or browse file'}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-400">PDF and TXT supported.</p>
            </div>
          </div>
        </label>

        <button
          type="button"
          onClick={() => void onPasteButtonClick()}
          className="mt-4 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left text-white transition hover:bg-white/8"
        >
          <div>
            <p className="text-sm font-semibold">Paste text</p>
            <p className="mt-1 text-sm leading-6 text-slate-400">Add clipboard text as context.</p>
          </div>
          <ClipboardPaste className="h-5 w-5 shrink-0 text-slate-300" />
        </button>

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 text-slate-300">
              <Paperclip className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.14em]">Attached</p>
            </div>
            <span className="text-xs text-slate-500">{documents.length} items</span>
          </div>

          <div className="space-y-3">
            {documents.length > 0 ? (
              documents.map((document, index) => (
                <article
                  key={document.id}
                  className={`rounded-2xl border p-4 ${
                    index === 0
                      ? 'border-slate-400/40 bg-white/10'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <div className="mt-0.5 rounded-xl bg-white/10 p-2.5 text-slate-200">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{document.name}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {document.source === 'paste' ? 'Pasted context' : 'Uploaded file'} • {document.chunks} chunks
                        </p>
                      </div>
                    </div>

                    {index === 0 ? (
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-900">
                        Active
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-slate-500">Added at {document.uploadedAt}</p>
                    <div className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-300">
                      <Sparkles className="h-3 w-3" />
                      ready
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/4 px-4 py-5 text-sm leading-6 text-slate-300">
                No context yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </aside>
  )
}
