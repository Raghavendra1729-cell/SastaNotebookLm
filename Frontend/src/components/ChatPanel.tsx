import type { FormEvent, KeyboardEvent, RefObject } from 'react'
import ReactMarkdown from 'react-markdown'
import { Bot, LoaderCircle, SendHorizonal } from 'lucide-react'

import type { ChatMessage, DocumentRecord } from '../types'

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
    <section className="flex min-h-screen flex-1 flex-col bg-[#121418]">
      <header className="border-b border-white/10 px-6 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Chat</p>
        <h2 className="mt-2 font-['Manrope',_ui-sans-serif,_system-ui] text-2xl font-semibold tracking-tight text-white">
          Ask anything
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          {activeDocument ? `Using context: ${activeDocument.name}` : 'No context attached. Normal chatbot mode.'}
        </p>
      </header>

      <div ref={chatViewportRef} className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          {messages.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#171a20] px-7 py-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                <Bot className="h-6 w-6" />
              </div>
              <h3 className="font-['Manrope',_ui-sans-serif,_system-ui] text-3xl font-semibold tracking-tight text-white">
                Welcome
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Start chatting. Add files or pasted text on the right when you want grounded answers.
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isAssistant = message.role === 'assistant'

              return (
                <article
                  key={message.id}
                  className={`flex gap-4 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  {isAssistant ? (
                    <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
                      <Bot className="h-5 w-5" />
                    </div>
                  ) : null}

                  <div
                    className={`max-w-3xl rounded-3xl border px-5 py-4 ${
                      isAssistant
                        ? 'border-white/10 bg-[#1c2028] text-slate-100'
                        : 'border-slate-600 bg-[#2b313d] text-white'
                    }`}
                  >
                    <p
                      className={`mb-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                        isAssistant ? 'text-slate-300' : 'text-slate-200'
                      }`}
                    >
                      {isAssistant ? 'Assistant' : 'You'}
                    </p>

                    {isAssistant ? (
                      <div className="markdown-body markdown-dark text-sm leading-7">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-7">{message.content}</p>
                    )}
                  </div>

                  {!isAssistant ? (
                    <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
                      <span className="text-sm font-semibold">You</span>
                    </div>
                  ) : null}
                </article>
              )
            })
          )}

          {isChatting ? (
            <article className="flex gap-4">
              <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
                <Bot className="h-5 w-5" />
              </div>
              <div className="rounded-3xl border border-white/10 bg-[#1c2028] px-5 py-4 text-slate-200">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Assistant</p>
                <div className="flex items-center gap-3 text-sm">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Thinking...
                </div>
              </div>
            </article>
          ) : null}
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#0f1115] px-6 py-5">
        <div className="mx-auto max-w-4xl">
          <form onSubmit={onSubmit}>
            <div className="rounded-3xl border border-white/10 bg-[#171a20] p-3">
              <textarea
                value={prompt}
                onChange={(event) => onPromptChange(event.target.value)}
                onKeyDown={onPromptKeyDown}
              placeholder={
                activeDocument
                  ? 'Ask about your context...'
                  : 'Ask anything...'
              }
              disabled={isChatting}
              rows={3}
              className="w-full resize-none border-0 bg-transparent px-2 py-2 text-sm leading-7 text-white outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:text-slate-500"
            />

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 px-2 pt-3">
                <p className="text-xs text-slate-400">
                  {activeDocument
                    ? 'Enter to send.'
                    : 'Normal chatbot mode.'}
                </p>
                <button
                  type="submit"
                  disabled={!canChat || !prompt.trim()}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  {isChatting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
                  Send
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
