import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:8000'

interface Note {
  id: number
  title: string
  content: string
  tags: string
  created_at: string
  updated_at: string
}

interface PaginatedResponse {
  count: number
  next: string | null
  previous: string | null
  results: Note[]
}

interface SummaryResult {
  text: string
  aiUsed: boolean
}

function parseTags(tags: string): string[] {
  return tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

const TAG_PALETTE = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
]

function getTagColor(tag: string): string {
  let h = 0
  for (const c of tag) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return TAG_PALETTE[h % TAG_PALETTE.length]
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

// ── NoteForm ──────────────────────────────────────────────────────────────────

interface NoteFormProps {
  initialTitle?: string
  initialContent?: string
  initialTags?: string
  onSubmit: (title: string, content: string, tags: string) => Promise<void>
  onCancel?: () => void
  submitLabel: string
  submitting: boolean
  error: string | null
  clearOnSuccess?: boolean
}

function NoteForm({
  initialTitle = '',
  initialContent = '',
  initialTags = '',
  onSubmit,
  onCancel,
  submitLabel,
  submitting,
  error,
  clearOnSuccess = false,
}: NoteFormProps) {
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [tags, setTags] = useState(initialTags)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await onSubmit(title, content, tags)
    if (clearOnSuccess) {
      setTitle('')
      setContent('')
      setTags('')
    }
  }

  const inputCls =
    'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="text"
        placeholder="標題 *"
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
        className={inputCls}
      />
      <textarea
        placeholder="內容 *"
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={4}
        required
        className={`${inputCls} resize-none`}
      />
      <input
        type="text"
        placeholder="標籤（逗號分隔，例如：react, python, AI）"
        value={tags}
        onChange={e => setTags(e.target.value)}
        className={inputCls}
      />

      {error && (
        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? '處理中…' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
        )}
      </div>
    </form>
  )
}

// ── NoteCard ──────────────────────────────────────────────────────────────────

interface NoteCardProps {
  note: Note
  summary: SummaryResult | undefined
  summarizing: boolean
  deleting: boolean
  editing: boolean
  editSubmitting: boolean
  editError: string | null
  onSummarize: () => void
  onDelete: () => void
  onEdit: () => void
  onSaveEdit: (title: string, content: string, tags: string) => Promise<void>
  onCancelEdit: () => void
  onTagClick: (tag: string) => void
}

function NoteCard({
  note, summary, summarizing, deleting, editing, editSubmitting, editError,
  onSummarize, onDelete, onEdit, onSaveEdit, onCancelEdit, onTagClick,
}: NoteCardProps) {
  const tags = parseTags(note.tags)
  const isBusy = summarizing || deleting

  if (editing) {
    return (
      <article className="bg-white rounded-xl border-2 border-indigo-400 shadow-md p-5">
        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-3">編輯筆記</p>
        <NoteForm
          initialTitle={note.title}
          initialContent={note.content}
          initialTags={note.tags}
          onSubmit={onSaveEdit}
          onCancel={onCancelEdit}
          submitLabel="儲存"
          submitting={editSubmitting}
          error={editError}
        />
      </article>
    )
  }

  return (
    <article className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-semibold text-slate-800 text-base leading-snug line-clamp-3">
          {note.title}
        </h2>
        <span className="text-xs text-slate-400 whitespace-nowrap shrink-0 mt-0.5">
          {formatDate(note.updated_at || note.created_at)}
        </span>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => onTagClick(tag)}
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getTagColor(tag)} hover:opacity-80 transition-opacity`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap line-clamp-4 grow">
        {note.content}
      </p>

      {summary && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">
            {summary.aiUsed ? '🤖 AI 摘要' : '📋 快速摘要'}
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">{summary.text}</p>
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t border-slate-100">
        <button
          onClick={onSummarize}
          disabled={isBusy}
          className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {summarizing ? '摘要中…' : '📋 快速摘要'}
        </button>
        <button
          onClick={onEdit}
          disabled={isBusy}
          className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
        >
          編輯
        </button>
        <button
          onClick={onDelete}
          disabled={isBusy}
          className="text-xs px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {deleting ? '…' : '刪除'}
        </button>
      </div>
    </article>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [notes, setNotes] = useState<Note[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [summarizingId, setSummarizingId] = useState<number | null>(null)
  const [summaries, setSummaries] = useState<Record<number, SummaryResult>>({})

  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const debouncedSearch = useDebounce(search, 400)
  const abortRef = useRef<AbortController | null>(null)

  const fetchNotes = useCallback((q: string, tag: string | null) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setFetchError(null)

    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (tag) params.set('tag', tag)
    params.set('page_size', '200')

    fetch(`${API_BASE}/api/notes/?${params}`, { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((data: PaginatedResponse | Note[]) => {
        if (Array.isArray(data)) {
          setNotes(data)
          setTotalCount(data.length)
        } else {
          setNotes(data.results)
          setTotalCount(data.count)
        }
      })
      .catch(e => { if (e.name !== 'AbortError') setFetchError(String(e)) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchNotes(debouncedSearch, selectedTag)
  }, [debouncedSearch, selectedTag, fetchNotes])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const n of notes) parseTags(n.tags).forEach(t => set.add(t))
    return Array.from(set).sort()
  }, [notes])

  async function createNote(title: string, content: string, tags: string) {
    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch(`${API_BASE}/api/notes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, tags }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = typeof data === 'object'
          ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('；')
          : String(data)
        throw new Error(msg)
      }
      setNotes(prev => [data as Note, ...prev])
      setTotalCount(c => c + 1)
      setShowCreate(false)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : String(err))
    } finally {
      setCreating(false)
    }
  }

  async function deleteNote(id: number) {
    if (!confirm('確定要刪除這則筆記嗎？')) return
    setDeletingId(id)
    try {
      const res = await fetch(`${API_BASE}/api/notes/${id}/`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setNotes(prev => prev.filter(n => n.id !== id))
      setTotalCount(c => c - 1)
      setSummaries(prev => { const next = { ...prev }; delete next[id]; return next })
    } catch (err) {
      alert(`刪除失敗：${err instanceof Error ? err.message : err}`)
    } finally {
      setDeletingId(null)
    }
  }

  async function summarize(id: number) {
    setSummarizingId(id)
    try {
      const res = await fetch(`${API_BASE}/api/notes/${id}/summarize/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail ?? `HTTP ${res.status}`)
      setSummaries(prev => ({
        ...prev,
        [id]: { text: data.summary ?? '（無摘要）', aiUsed: Boolean(data.ai_used) },
      }))
    } catch (err) {
      setSummaries(prev => ({
        ...prev,
        [id]: { text: `錯誤：${err instanceof Error ? err.message : err}`, aiUsed: false },
      }))
    } finally {
      setSummarizingId(null)
    }
  }

  async function saveEdit(id: number, title: string, content: string, tags: string) {
    setEditSubmitting(true)
    setEditError(null)
    try {
      const res = await fetch(`${API_BASE}/api/notes/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, tags }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = typeof data === 'object'
          ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('；')
          : String(data)
        throw new Error(msg)
      }
      setNotes(prev => prev.map(n => n.id === id ? data as Note : n))
      setEditingId(null)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : String(err))
    } finally {
      setEditSubmitting(false)
    }
  }

  function handleTagClick(tag: string) {
    setSelectedTag(prev => (prev === tag ? null : tag))
  }

  const isSearching = search.trim() !== debouncedSearch.trim()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <h1 className="text-lg font-bold text-slate-800 shrink-0">🎓 學習筆記</h1>

          <div className="flex-1 relative">
            <input
              type="search"
              placeholder="搜尋標題、內容或標籤…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-slate-50"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {isSearching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">…</span>
            )}
          </div>

          <button
            onClick={() => { setShowCreate(v => !v); setCreateError(null) }}
            className="shrink-0 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            {showCreate ? '取消' : '+ 新增筆記'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-5">
        {/* ── Create form ── */}
        {showCreate && (
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <p className="text-sm font-semibold text-slate-700 mb-4">新增筆記</p>
            <NoteForm
              onSubmit={createNote}
              submitLabel="新增筆記"
              submitting={creating}
              error={createError}
              clearOnSuccess
            />
          </section>
        )}

        {/* ── Tag filters ── */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-slate-500 font-medium">標籤：</span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                selectedTag === null
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              全部
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${getTagColor(tag)} ${
                  selectedTag === tag
                    ? 'ring-2 ring-offset-1 ring-current opacity-100'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* ── Loading / Error / Empty states ── */}
        {loading && (
          <div className="text-center py-16 text-slate-400">
            <div className="text-4xl mb-3">⏳</div>
            <p>載入中…</p>
          </div>
        )}

        {fetchError && !loading && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 text-sm">
            <p className="font-semibold mb-1">載入失敗</p>
            <p className="text-rose-600">{fetchError}</p>
            <button
              onClick={() => fetchNotes(debouncedSearch, selectedTag)}
              className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 transition-colors"
            >
              重試
            </button>
          </div>
        )}

        {!loading && !fetchError && notes.length === 0 && !debouncedSearch && !selectedTag && (
          <div className="text-center py-16 text-slate-400">
            <div className="text-5xl mb-3">📝</div>
            <p className="text-lg font-medium text-slate-600">還沒有筆記</p>
            <p className="text-sm mt-1">點擊「+ 新增筆記」開始記錄學習心得</p>
          </div>
        )}

        {!loading && !fetchError && notes.length === 0 && (debouncedSearch || selectedTag) && (
          <div className="text-center py-16 text-slate-400">
            <div className="text-4xl mb-3">🔍</div>
            <p>找不到符合「{debouncedSearch || selectedTag}」的筆記</p>
          </div>
        )}

        {/* ── Notes grid ── */}
        {!loading && notes.length > 0 && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {notes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                summary={summaries[note.id]}
                summarizing={summarizingId === note.id}
                deleting={deletingId === note.id}
                editing={editingId === note.id}
                editSubmitting={editSubmitting}
                editError={editError}
                onSummarize={() => summarize(note.id)}
                onDelete={() => deleteNote(note.id)}
                onEdit={() => { setEditingId(note.id); setEditError(null) }}
                onSaveEdit={(t, c, g) => saveEdit(note.id, t, c, g)}
                onCancelEdit={() => setEditingId(null)}
                onTagClick={handleTagClick}
              />
            ))}
          </div>
        )}

        {/* ── Count ── */}
        {!loading && totalCount > 0 && (
          <p className="text-center text-xs text-slate-400">
            {debouncedSearch || selectedTag
              ? `找到 ${notes.length} / ${totalCount} 則筆記`
              : `共 ${totalCount} 則筆記`
            }
          </p>
        )}
      </main>
    </div>
  )
}
