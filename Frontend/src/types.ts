export type ChatRole = 'user' | 'assistant'

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
}

export type DocumentRecord = {
  id: string
  name: string
  source: 'file' | 'paste'
  chunks: number
  uploadedAt: string
}

export type ToastState = {
  tone: 'success' | 'error'
  message: string
}

export type UploadResponse = {
  filename: string
  message: string
  chunks: number
}

export type ChatResponse = {
  answer: string
}
