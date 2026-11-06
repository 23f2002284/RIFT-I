// API base — Vite proxies /api → http://localhost:8000
const API = '/api/v1'

// Dev mode: auth.py accepts this dev user UUID which exists in Supabase auth.users
const DEV_USER_ID = '00000000-0000-0000-0000-000000000001'

const headers = () => ({ Authorization: `Bearer ${DEV_USER_ID}` })

export interface Document {
  id: string
  filename: string
  page_count: number
  file_size: number
  created_at: string
}

export async function fetchDocuments(): Promise<Document[]> {
  const res = await fetch(`${API}/documents`, { headers: headers() })
  if (!res.ok) throw new Error('Failed to fetch documents')
  return res.json()
}

export async function uploadDocument(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<Document> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const form = new FormData()
    form.append('file', file)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status === 201) resolve(JSON.parse(xhr.responseText))
      else reject(new Error(JSON.parse(xhr.responseText)?.detail ?? 'Upload failed'))
    }
    xhr.onerror = () => reject(new Error('Network error during upload'))

    xhr.open('POST', `${API}/documents/upload`)
    xhr.setRequestHeader('Authorization', `Bearer ${DEV_USER_ID}`)
    xhr.send(form)
  })
}

export async function getDocumentUrl(id: string): Promise<string> {
  const res = await fetch(`${API}/documents/${id}/url`, { headers: headers() })
  if (!res.ok) throw new Error('Failed to get document URL')
  const data = await res.json()
  return data.url
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`${API}/documents/${id}`, {
    method: 'DELETE',
    headers: headers(),
  })
  if (!res.ok && res.status !== 204) throw new Error('Failed to delete document')
}

