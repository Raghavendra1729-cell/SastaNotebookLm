import type { FormEvent, KeyboardEvent, RefObject } from 'react'
import ReactMarkdown from 'react-markdown'
import { MessageSquare, LoaderCircle, SendHorizonal, FileCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

import type { ChatMessage, DocumentRecord } from '../types'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type ChatPanelProps = {
  activeDocument: DocumentRecord | null
  messages: ChatMessage[]
  prompt: string
  isChatting: boolean
  canChat: boolean
  chatViewportRef: RefObject<HTMLDivElement | null>
  onPromptChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
  onPromptKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
}

export function ChatPanel({
  activeDocument,
  messages,
  prompt,
  isChatting,
  canChat,
  chatViewportRef,
  onPromptChange,
  onSubmit,
  onPromptKeyDown,
}: ChatPanelProps) {
  return (
    <section className="relative flex h-full flex-1 flex-col overflow-hidden bg-transparent">
      {/* Subtle Background Blue */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 h-[50%] w-[50%] rounded-full bg-blue-500/[0.03] blur-[120px]" />
      </div>

      <header className="z-20 shrink-0 border-b border-white/5 bg-black/10 px-8 py-5 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-['Manrope'] text-lg font-bold tracking-tight text-white">
                Conversation
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <div className={cn("h-1.5 w-1.5 rounded-full", activeDocument ? "bg-blue-400 animate-pulse" : "bg-slate-600")} />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {activeDocument ? activeDocument.name : 'General Mode'}
                </p>
              </div>
            </div>
          </div>
          
          {activeDocument && (
            <div className="hidden md:flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-1.5">
              <FileCheck className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Context Active</span>
            </div>
          )}
        </div>
      </header>

      <div 
        ref={chatViewportRef} 
        className="z-10 flex-1 overflow-y-auto px-4 py-8 md:px-12 custom-scrollbar"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
          <AnimatePresence mode="popLayout">
            {messages.length === 0 ? (
              <motion.div 
                key="welcome"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-24 text-center"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600/10 text-blue-500">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <h3 className="font-['Manrope'] text-2xl font-bold tracking-tight text-white">
                  Welcome to Sasta LLM
                </h3>
                <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-slate-400 font-medium">
                  Add documents on the right to start grounded research, or ask a general question below.
                </p>
              </motion.div>
            ) : (
              messages.map((message) => {
                const isAssistant = message.role === 'assistant'

                return (
                  <motion.article
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex w-full",
                      isAssistant ? "justify-start" : "justify-end"
                    )}
                  >
                    <div
                      className={cn(
                        "relative max-w-[90%] rounded-2xl px-6 py-4 shadow-sm transition-all duration-200",
                        isAssistant
                          ? "rounded-tl-none border border-white/5 bg-white/[0.02] text-slate-200"
                          : "rounded-tr-none bg-blue-600 text-white shadow-blue-500/10"
                      )}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-[0.2em]",
                          isAssistant ? "text-blue-400" : "text-blue-100"
                        )}>
                          {isAssistant ? 'Sasta LLM' : 'User'}
                        </span>
                      </div>

                      <div className={cn(
                        "markdown-body",
                        isAssistant ? "text-slate-200" : "text-white"
                      )}>
                        {isAssistant ? (
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        ) : (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        )}
                      </div>
                    </div>
                  </motion.article>
                )
              })
            )}

            {isChatting && (
              <motion.article 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="rounded-2xl rounded-tl-none border border-white/5 bg-white/[0.02] px-6 py-4 text-slate-400 shadow-sm">
                  <div className="flex items-center gap-3">
                    <LoaderCircle className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="text-sm font-medium italic">Processing...</span>
                  </div>
                </div>
              </motion.article>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="z-20 shrink-0 border-t border-white/5 bg-black/20 p-6 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl">
          <form onSubmit={onSubmit} className="relative">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition-all duration-300 focus-within:border-blue-500/40 focus-within:bg-white/[0.04]">
              <textarea
                value={prompt}
                onChange={(event) => onPromptChange(event.target.value)}
                onKeyDown={onPromptKeyDown}
                placeholder={activeDocument ? "Search context..." : "Ask a question..."}
                disabled={isChatting}
                className="w-full max-h-[160px] min-h-[56px] resize-none border-0 bg-transparent px-6 py-4 text-[15px] leading-relaxed text-white outline-none placeholder:text-slate-600 disabled:cursor-not-allowed custom-scrollbar"
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'inherit';
                  target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
                }}
              />

              <div className="flex items-center justify-between bg-black/20 px-4 py-2">
                <div className="flex items-center gap-3 px-2">
                  <div className={cn("h-1.5 w-1.5 rounded-full", activeDocument ? "bg-blue-400 shadow-[0_0_8px_rgba(56,189,248,0.4)]" : "bg-slate-700")} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {activeDocument ? "Source Active" : "General Mode"}
                  </span>
                </div>
                
                <button
                  type="submit"
                  disabled={!canChat || !prompt.trim()}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-blue-600 px-5 text-[12px] font-bold text-white transition-all hover:bg-blue-500 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-600"
                >
                  {isChatting ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <SendHorizonal className="h-4 w-4" />
                  )}
                  <span>SEND</span>
                </button>
              </div>
            </div>
          </form>
          <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-600">
            Sasta LLM • Research Interface
          </p>
        </div>
      </div>
    </section>
  )
}
