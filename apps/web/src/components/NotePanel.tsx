import { useState } from 'react'
import type { Document } from '../api/documents'

interface Note {
  text: string
  ts: string
}

interface Props {
  doc: Document
}

type Tab = 'notes' | 'later' | 'highlights'

interface LaterItem {
  id: string
  filename: string
}

function storageKey(docId: string) {
  return `rift_notes_${docId}`
}

function getNotes(docId: string): Note[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey(docId)) ?? '[]')
  } catch {
    return []
  }
}

function saveNotes(docId: string, notes: Note[]) {
  localStorage.setItem(storageKey(docId), JSON.stringify(notes))
}

function getLater(): LaterItem[] {
  try {
    return JSON.parse(localStorage.getItem('rift_later') ?? '[]')
  } catch {
    return []
  }
}

function saveLater(items: LaterItem[]) {
  localStorage.setItem('rift_later', JSON.stringify(items))
}

export function NotePanel({ doc }: Props) {
  const [tab, setTab] = useState<Tab>('notes')
  const [notes, setNotes] = useState<Note[]>(() => getNotes(doc.id))
  const [draft, setDraft] = useState('')
  const [later, setLater] = useState<LaterItem[]>(() => getLater())

  const addNote = () => {
    if (!draft.trim()) return
    const updated = [{ text: draft.trim(), ts: new Date().toISOString() }, ...notes]
    setNotes(updated)
    saveNotes(doc.id, updated)
    setDraft('')
  }

  const deleteNote = (idx: number) => {
    const updated = notes.filter((_, i) => i !== idx)
    setNotes(updated)
    saveNotes(doc.id, updated)
  }

  const isInLater = later.some((l) => l.id === doc.id)

  const toggleLater = () => {
    let updated: LaterItem[]
    if (isInLater) {
      updated = later.filter((l) => l.id !== doc.id)
    } else {
      updated = [{ id: doc.id, filename: doc.filename }, ...later]
    }
    setLater(updated)
    saveLater(updated)
  }

  const removeLater = (id: string) => {
    const updated = later.filter((l) => l.id !== id)
    setLater(updated)
    saveLater(updated)
  }

  const tabStyle = (t: Tab) => ({
    padding: '6px 14px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    background: tab === t ? 'var(--surface-2)' : 'transparent',
    color: tab === t ? 'var(--text)' : 'var(--text-muted)',
    transition: 'all 150ms ease',
  })

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--surface)',
      borderLeft: '1px solid var(--border)',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 0', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Workspace
        </p>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, paddingBottom: 12 }}>
          {(['notes', 'highlights', 'later'] as Tab[]).map((t) => (
            <button key={t} style={tabStyle(t)} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

        {/* ── Notes ── */}
        {tab === 'notes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Input */}
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) addNote() }}
              placeholder="Add a note… (Ctrl+Enter to save)"
              rows={4}
              style={{
                width: '100%',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text)',
                padding: '10px 12px',
                fontSize: 13,
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.6,
              }}
            />
            <button
              onClick={addNote}
              disabled={!draft.trim()}
              style={{
                alignSelf: 'flex-end',
                background: draft.trim() ? 'var(--accent)' : 'var(--surface-2)',
                color: draft.trim() ? '#fff' : 'var(--text-muted)',
                border: 'none',
                borderRadius: 6,
                padding: '7px 16px',
                fontSize: 12,
                fontWeight: 500,
                cursor: draft.trim() ? 'pointer' : 'default',
                transition: 'all 150ms ease',
              }}
            >
              Save note
            </button>

            {/* Notes list */}
            {notes.length === 0 ? (
              <p style={{ color: 'var(--text-dim)', fontSize: 12, textAlign: 'center', marginTop: 20 }}>
                No notes yet.
              </p>
            ) : (
              notes.map((note, i) => (
                <div key={i} style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}>
                  <p style={{ fontSize: 13, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{note.text}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                      {new Date(note.ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={() => deleteNote(i)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 11 }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--red)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
                    >
                      delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Highlights ── */}
        {tab === 'highlights' && (
          <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--text-dim)' }}>
            <p style={{ fontSize: 24, marginBottom: 10 }}>✏️</p>
            <p style={{ fontSize: 13 }}>Highlights coming soon</p>
          </div>
        )}

        {/* ── Later ── */}
        {tab === 'later' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={toggleLater}
              style={{
                width: '100%',
                background: isInLater ? 'var(--surface-2)' : 'var(--accent)',
                color: isInLater ? 'var(--text-muted)' : '#fff',
                border: isInLater ? '1px solid var(--border)' : 'none',
                borderRadius: 7,
                padding: '9px 16px',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {isInLater ? '✓ Saved for Later' : '+ Save for Later'}
            </button>

            {later.length === 0 ? (
              <p style={{ color: 'var(--text-dim)', fontSize: 12, textAlign: 'center', marginTop: 20 }}>
                Nothing saved for later.
              </p>
            ) : (
              <>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Saved ({later.length})
                </p>
                {later.map((item) => (
                  <div key={item.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    gap: 8,
                  }}>
                    <span style={{
                      fontSize: 12,
                      color: item.id === doc.id ? 'var(--accent)' : 'var(--text)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {item.filename}
                    </span>
                    <button
                      onClick={() => removeLater(item.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', flexShrink: 0 }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--red)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

