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

  const showToast = (tone: ToastState['tone'], message: string) => {
    setToast({ tone, message })
  }

  const uploadDocument = useCallback(
    async (file: File, source: DocumentRecord['source']) => {
      setIsUploading(true)

      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(`${API_BASE_URL}/upload`, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorBody = (await response.json().catch(() => null)) as { detail?: string } | null
          throw new Error(errorBody?.detail ?? 'Upload failed.')
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

        showToast('success', `${payload.filename} uploaded. ${payload.chunks} chunks indexed.`)
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

      const textFile = new File([pastedText], `pasted-note-${Date.now()}.txt`, {
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
      showToast('error', 'Clipboard paste is not available in this browser.')
      return
    }

    try {
      const clipboardText = await navigator.clipboard.readText()
      await uploadPastedText(clipboardText)
    } catch {
      showToast('error', 'Clipboard access was blocked. Use Ctrl+V or Cmd+V instead.')
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
        throw new Error(errorBody?.detail ?? 'Chat request failed.')
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
      const message = error instanceof Error ? error.message : 'Chat request failed.'
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: 'assistant',
          content: `I hit an error while contacting the backend.\n\n${message}`,
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
    <main className="min-h-screen bg-[#0c0e12] text-white">
      <div className="min-h-screen lg:grid lg:grid-cols-[270px_minmax(0,1fr)_330px]">
        <InstructionRail />

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
