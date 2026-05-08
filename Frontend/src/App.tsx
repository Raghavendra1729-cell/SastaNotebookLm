import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, FormEvent, KeyboardEvent } from 'react'

import { ChatPanel } from './components/ChatPanel'
import { InstructionRail } from './components/InstructionRail'
import { SourceDock } from './components/SourceDock'
import { Toast } from './components/Toast'
import type { ChatMessage, ChatResponse, DocumentRecord, ToastState, UploadResponse } from './types'

const API_BASE_URL = __BACKEND_URI__

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

const acceptedFileTypes = '.pdf,.txt'

function App() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [prompt, setPrompt] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isChatting, setIsChatting] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const chatViewportRef = useRef<HTMLDivElement | null>(null)

  const activeDocument = documents[0] ?? null
  const canChat = !isChatting

  const chatHistory = useMemo(
    () =>
      messages.map(({ role, content }) => ({
        role,
        content,
      })),
    [messages],
  )

  useEffect(() => {
    if (!toast) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timeoutId)
  }, [toast])

  useEffect(() => {
    if (!chatViewportRef.current) {
      return
    }

    chatViewportRef.current.scrollTo({
      top: chatViewportRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, isChatting])

  // Clear backend data on mount/refresh
  useEffect(() => {
    const clearBackend = async () => {
      try {
        await fetch(`${API_BASE_URL}/clear`, { method: 'DELETE' })
      } catch (error) {
        console.error('Failed to clear backend data:', error)
      }
    }
    clearBackend()
  }, [])

  const showToast = (tone: ToastState['tone'], message: string) => {
    setToast({ tone, message })
  }

  const uploadDocument = useCallback(
    async (file: File, source: DocumentRecord['source']) => {
      setIsUploading(true)

      try {
        const formData = new FormData()
        formData.append('file', file)

        console.log(`Uploading ${file.name} (${file.size} bytes) to ${API_BASE_URL}/upload`)
        
        const response = await fetch(`${API_BASE_URL}/upload`, {
          method: 'POST',
          body: formData,
        }).catch(err => {
          console.error("Network error or timeout:", err)
          if (file.size > 4.5 * 1024 * 1024) {
            throw new Error(`Network error. If you are on Vercel, 9MB is above the 4.5MB limit. Try a smaller file or run locally.`)
          }
          throw new Error(`Failed to connect to backend at ${API_BASE_URL}. Check if server is running and CORS/Mixed Content is allowed.`)
        })

        if (!response.ok) {
          const errorBody = (await response.json().catch(() => null)) as { detail?: string } | null
          throw new Error(errorBody?.detail ?? `Upload failed with status ${response.status}`)
        }

        const payload = (await response.json()) as UploadResponse

        setDocuments((current) => [
          {
            id: createId(),
            name: payload.filename,
            source,
            chunks: payload.chunks,
            uploadedAt: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
          ...current,
        ])

        showToast('success', `${payload.filename} uploaded.`)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload failed.'
        showToast('error', message)
      } finally {
        setIsUploading(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    },
    [],
  )

  const uploadPastedText = useCallback(
    async (rawText: string) => {
      const pastedText = rawText.trim()

      if (!pastedText || isUploading) {
        return
      }

      const textFile = new File([pastedText], `note-${Date.now()}.txt`, {
        type: 'text/plain',
      })
      await uploadDocument(textFile, 'paste')
    },
    [isUploading, uploadDocument],
  )

  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null
      const isEditableTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable

      if (isEditableTarget || isUploading) {
        return
      }

      const pastedText = event.clipboardData?.getData('text/plain')
      if (!pastedText) {
        return
      }

      event.preventDefault()
      await uploadPastedText(pastedText)
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [isUploading, uploadPastedText])

  const handleFileSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    await uploadDocument(file, 'file')
  }

  const handleDrop = async (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragActive(false)

    const file = event.dataTransfer.files?.[0]
    if (!file) {
      return
    }

    await uploadDocument(file, 'file')
  }

  const handlePasteButtonClick = async () => {
    if (!navigator.clipboard?.readText) {
      showToast('error', 'Clipboard paste is not available.')
      return
    }

    try {
      const clipboardText = await navigator.clipboard.readText()
      await uploadPastedText(clipboardText)
    } catch {
      showToast('error', 'Clipboard access blocked.')
    }
  }

  const sendMessage = async () => {
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt || isChatting) {
      return
    }

    setMessages((current) => [
      ...current,
      {
        id: createId(),
        role: 'user',
        content: trimmedPrompt,
      },
    ])
    setPrompt('')
    setIsChatting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmedPrompt,
          history: chatHistory,
        }),
      })

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { detail?: string } | null
        throw new Error(errorBody?.detail ?? 'Chat failed.')
      }

      const payload = (await response.json()) as ChatResponse

      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: 'assistant',
          content: payload.answer,
        },
      ])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Chat failed.'
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: 'assistant',
          content: `Connection error.\n\n${message}`,
        },
      ])
      showToast('error', message)
    } finally {
      setIsChatting(false)
    }
  }

  const handleChatSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await sendMessage()
  }

  const handlePromptKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) {
      return
    }

    event.preventDefault()

    if (!canChat || !prompt.trim()) {
      return
    }

    void sendMessage()
  }

  return (
    <main className="h-screen w-full overflow-hidden bg-[#020617] text-slate-200">
      <div className="flex h-full w-full">
        <InstructionRail />

        <div className="relative flex flex-1 flex-col overflow-hidden bg-transparent">
          <ChatPanel
            activeDocument={activeDocument}
            messages={messages}
            prompt={prompt}
            isChatting={isChatting}
            canChat={canChat}
            chatViewportRef={chatViewportRef}
            onPromptChange={setPrompt}
            onSubmit={handleChatSubmit}
            onPromptKeyDown={handlePromptKeyDown}
          />
        </div>

        <SourceDock
          documents={documents}
          isUploading={isUploading}
          isDragActive={isDragActive}
          fileInputRef={fileInputRef}
          acceptedFileTypes={acceptedFileTypes}
          onFileSelection={handleFileSelection}
          onDrop={handleDrop}
          onPasteButtonClick={handlePasteButtonClick}
          onDragStateChange={setIsDragActive}
        />
      </div>

      <Toast toast={toast} />
    </main>
  )
}

export default App
