/**
 * Simple IndexedDB storage for offline / page-refresh persistence of uploaded PDF blobs.
 * Browsers allow hundreds of megabytes in IndexedDB (unlike localStorage which is capped at ~5MB).
 */

const DB_NAME = 'rift_pdf_cache_db'
const STORE_NAME = 'pdf_blobs'
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function savePdfBlob(id: string, blob: Blob): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.put(blob, id)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch (err) {
    console.warn('Failed to save PDF blob to IndexedDB:', err)
  }
}

export async function getPdfBlob(id: string): Promise<Blob | null> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.get(id)
      req.onsuccess = () => resolve((req.result as Blob) || null)
      req.onerror = () => reject(req.error)
    })
  } catch (err) {
    console.warn('Failed to retrieve PDF blob from IndexedDB:', err)
    return null
  }
}

export async function deletePdfBlob(id: string): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.delete(id)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch (err) {
    console.warn('Failed to delete PDF blob from IndexedDB:', err)
  }
}
