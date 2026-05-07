# Sasta NotebookLm

Sasta NotebookLm is a lightweight NotebookLM-style application for uploading documents and chatting against their contents.

## Stack

- Frontend: React, Vite, Tailwind CSS, Lucide React
- Backend: FastAPI
- Retrieval: local Qdrant
- Rendering: Markdown for assistant responses

## Features

- Upload `PDF` and `TXT` documents
- Drag-and-drop ingestion
- Paste raw text into the notebook as a source
- Chat interface with conversation history
- Retrieval-augmented answers using uploaded content
- Configurable frontend-to-backend connection through environment variables

## Project Structure

```text
BackEnd/
  core/
  models/
  routes/
  services/

Frontend/
  public/
  src/
```

## Environment Variables

### Backend

Copy `BackEnd/.env.example` to `BackEnd/.env` and provide values for:

- `HF_KEY`
- `HF_MODEL`
- `GOOGLE_API_KEY`
- `CORS_ORIGINS`

### Frontend

Copy `Frontend/.env.example` to `Frontend/.env` and provide values for:

- `BACKEND_URI`

## Local Development

### Backend

```bash
cd BackEnd
.venv/bin/pip install -r requirements.txt
.venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

## Current Behavior

- The backend exposes:
  - `POST /upload`
  - `POST /chat`
- The frontend supports:
  - drag-and-drop upload
  - click-to-browse upload
  - clipboard paste for text sources
  - Enter to send, Shift+Enter for newline

## Notes

- The frontend is currently built with Vite.
- Local Qdrant is intentionally kept for development and local usage.
- Example env files are included for both frontend and backend.
