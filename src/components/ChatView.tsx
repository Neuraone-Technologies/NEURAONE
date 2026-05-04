import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { chatWithAI, type ChatAttachment } from '@/server/chat.functions'
import { useIdentity } from '@/lib/identity-context'
import { MarkdownRenderer } from '@/components/Markdown'

export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  time: number
  attachments?: ChatAttachment[]
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
  model: string
}

const STORAGE_KEY = 'neuraone:conversations:v1'
const PREF_KEY = 'neuraone:chat-prefs:v1'
const MAX_FILE_BYTES = 256 * 1024 // 256 KB per file
const MAX_TOTAL_BYTES = 1024 * 1024 // 1 MB total per turn

const MODELS = [
  { id: 'ultimate', label: 'NeuraOne Ultimate', desc: 'Highest quality, deeper reasoning' },
  { id: 'pro', label: 'NeuraOne Pro', desc: 'Balanced speed and quality (default)' },
  { id: 'fast', label: 'NeuraOne Fast', desc: 'Lightning fast for quick chats' },
]

const QUICK_PROMPTS = [
  '🧑‍💻 Write a Python script that scrapes a webpage',
  '🧠 Explain quantum entanglement to a 10-year old',
  '✍️ Draft a polished follow-up email to a client',
  '🐛 Help me debug this error from my logs',
  '📊 Compare React vs Vue with a table',
  '🎨 Write CSS for a glassmorphism card',
]

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function loadConversations(): Conversation[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Conversation[]
    if (!Array.isArray(parsed)) return []
    return parsed.sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

function saveConversations(list: Conversation[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // ignore quota errors
  }
}

interface ChatPrefs {
  model: string
  language: string
  systemHint: string
  fontScale: number
  density: 'cozy' | 'compact'
  enterToSend: boolean
}

const DEFAULT_PREFS: ChatPrefs = {
  model: 'pro',
  language: 'auto',
  systemHint: '',
  fontScale: 1,
  density: 'cozy',
  enterToSend: true,
}

function loadPrefs(): ChatPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS
  try {
    const raw = localStorage.getItem(PREF_KEY)
    if (!raw) return DEFAULT_PREFS
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<ChatPrefs>) }
  } catch {
    return DEFAULT_PREFS
  }
}

function savePrefs(p: ChatPrefs) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(p))
  } catch {
    // ignore
  }
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.round(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(ts).toLocaleDateString()
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

async function readFileAsText(file: File): Promise<{ text: string; truncated: boolean }> {
  const slice = file.size > MAX_FILE_BYTES ? file.slice(0, MAX_FILE_BYTES) : file
  const text = await slice.text()
  return { text, truncated: file.size > MAX_FILE_BYTES }
}

function isProbablyText(file: File): boolean {
  if (file.type.startsWith('text/')) return true
  if (file.type === 'application/json') return true
  if (file.type === 'application/xml') return true
  if (file.type === 'application/javascript') return true
  const ext = file.name.toLowerCase().split('.').pop() || ''
  const textExt = new Set([
    'txt', 'md', 'markdown', 'json', 'yaml', 'yml', 'toml', 'xml', 'csv',
    'js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'py', 'rb', 'go', 'rs', 'java',
    'kt', 'kts', 'c', 'h', 'cpp', 'hpp', 'cs', 'php', 'swift', 'sh', 'bash',
    'zsh', 'sql', 'html', 'htm', 'css', 'scss', 'sass', 'less', 'vue',
    'svelte', 'env', 'conf', 'ini', 'log', 'gitignore', 'editorconfig',
  ])
  return textExt.has(ext)
}

interface ChatViewProps {
  embedded?: boolean
}

export function ChatView({ embedded = false }: ChatViewProps) {
  const { user } = useIdentity()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<ChatAttachment[]>([])
  const [prefs, setPrefs] = useState<ChatPrefs>(DEFAULT_PREFS)
  const [showSidebar, setShowSidebar] = useState(!embedded)
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)
  const [error, setError] = useState('')

  const chatRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load
  useEffect(() => {
    setConversations(loadConversations())
    setPrefs(loadPrefs())
  }, [])

  // Persist conversations
  useEffect(() => {
    if (conversations.length) saveConversations(conversations)
  }, [conversations])

  // Persist prefs
  useEffect(() => {
    savePrefs(prefs)
  }, [prefs])

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [activeId, loading])

  const activeConv = useMemo(
    () => conversations.find((c) => c.id === activeId) || null,
    [conversations, activeId]
  )

  useEffect(() => {
    if (activeConv && chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [activeConv?.messages.length])

  const startNewConversation = useCallback((firstMessage?: string): Conversation => {
    const conv: Conversation = {
      id: uid(),
      title: firstMessage ? truncateTitle(firstMessage) : 'New chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: prefs.model,
    }
    setConversations((prev) => [conv, ...prev])
    setActiveId(conv.id)
    return conv
  }, [prefs.model])

  const ensureActive = (firstMessage?: string): Conversation => {
    if (activeConv) return activeConv
    return startNewConversation(firstMessage)
  }

  const updateConversation = (id: string, mut: (c: Conversation) => Conversation) => {
    setConversations((prev) => {
      const next = prev.map((c) => (c.id === id ? mut(c) : c))
      next.sort((a, b) => b.updatedAt - a.updatedAt)
      return next
    })
  }

  const renameConversation = (id: string, title: string) => {
    updateConversation(id, (c) => ({ ...c, title: title.slice(0, 80), updatedAt: c.updatedAt }))
  }

  const deleteConversation = (id: string) => {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id)
      saveConversations(next)
      return next
    })
    if (activeId === id) setActiveId(null)
  }

  const clearAll = () => {
    if (!confirm('Delete ALL chat history? This cannot be undone.')) return
    setConversations([])
    setActiveId(null)
    if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY)
  }

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    setError('')
    const arr = Array.from(fileList)
    let total = pendingFiles.reduce((s, f) => s + (f.size || 0), 0)
    const accepted: ChatAttachment[] = []
    const rejected: string[] = []
    for (const file of arr) {
      if (!isProbablyText(file) && file.size > 4096) {
        rejected.push(`${file.name} (binary file not supported)`)
        continue
      }
      if (total + file.size > MAX_TOTAL_BYTES) {
        rejected.push(`${file.name} (total size exceeds 1 MB)`)
        continue
      }
      try {
        const { text, truncated } = await readFileAsText(file)
        const path = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name
        accepted.push({
          name: file.name,
          path,
          type: file.type || undefined,
          size: file.size,
          content: text,
          truncated,
        })
        total += file.size
      } catch {
        rejected.push(`${file.name} (could not read)`)
      }
    }
    if (accepted.length) setPendingFiles((prev) => [...prev, ...accepted])
    if (rejected.length) setError(`Skipped: ${rejected.join(', ')}`)
  }

  const removePendingFile = (idx: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
    if ((!text && pendingFiles.length === 0) || loading) return
    setError('')
    const conv = ensureActive(text)
    const userMsg: ChatMessage = {
      id: uid(),
      role: 'user',
      content: text || '(see attached files)',
      time: Date.now(),
      attachments: pendingFiles.length ? pendingFiles : undefined,
    }
    const attachmentsToSend = pendingFiles
    setInput('')
    setPendingFiles([])
    updateConversation(conv.id, (c) => ({
      ...c,
      messages: [...c.messages, userMsg],
      updatedAt: Date.now(),
      title: c.messages.length === 0 ? truncateTitle(text || userMsg.content) : c.title,
    }))
    setLoading(true)
    try {
      const history = conv.messages.map((m) => ({ role: m.role, content: m.content }))
      const { reply } = await chatWithAI({
        data: {
          message: text || 'Please analyze the attached files.',
          history,
          attachments: attachmentsToSend.length ? attachmentsToSend : undefined,
          model: prefs.model,
          systemHint: buildSystemHint(prefs, user?.name, user?.email),
        },
      })
      const aiMsg: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content: reply,
        time: Date.now(),
      }
      updateConversation(conv.id, (c) => ({
        ...c,
        messages: [...c.messages, aiMsg],
        updatedAt: Date.now(),
      }))
    } catch (e) {
      const fallback: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content:
          "⚠️ I couldn't reach the NeuraOne brain right now. Please try again in a moment.\n\n" +
          (e instanceof Error ? `Error: ${e.message}` : ''),
        time: Date.now(),
      }
      updateConversation(conv.id, (c) => ({
        ...c,
        messages: [...c.messages, fallback],
        updatedAt: Date.now(),
      }))
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (prefs.enterToSend && !e.shiftKey) {
        e.preventDefault()
        send()
      }
    }
  }

  const copyMessage = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // ignore
    }
  }

  const exportChat = (conv: Conversation) => {
    const blob = new Blob(
      [
        `# ${conv.title}\n` +
          `Exported: ${new Date().toISOString()}\n\n` +
          conv.messages
            .map(
              (m) =>
                `## ${m.role === 'user' ? 'You' : 'NeuraOne AI'} — ${new Date(m.time).toISOString()}\n\n${m.content}\n`
            )
            .join('\n'),
      ],
      { type: 'text/markdown' }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${conv.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'chat'}.md`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className={`neura-chat ${embedded ? 'neura-chat-embedded' : 'neura-chat-page'} density-${prefs.density}`}
      style={{ ['--chat-font-scale' as string]: String(prefs.fontScale) }}
    >
      {showSidebar && (
        <aside className="neura-chat-sidebar">
          <div className="sidebar-head">
            <button className="new-chat-btn" onClick={() => startNewConversation()}>
              ＋ New Chat
            </button>
            <button
              className="sidebar-toggle"
              onClick={() => setShowSidebar(false)}
              title="Hide history"
            >
              ‹
            </button>
          </div>
          <div className="sidebar-list">
            {conversations.length === 0 && (
              <div className="sidebar-empty">No chats yet — start one!</div>
            )}
            {conversations.map((c) => (
              <button
                key={c.id}
                className={`sidebar-item ${c.id === activeId ? 'active' : ''}`}
                onClick={() => setActiveId(c.id)}
                title={c.title}
              >
                <div className="sidebar-item-title">💬 {c.title}</div>
                <div className="sidebar-item-meta">
                  <span>{c.messages.length} msgs</span>
                  <span>· {relativeTime(c.updatedAt)}</span>
                </div>
                <div
                  className="sidebar-item-actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    title="Rename"
                    onClick={() => {
                      const t = prompt('Rename chat', c.title)
                      if (t) renameConversation(c.id, t)
                    }}
                  >
                    ✎
                  </button>
                  <button title="Export" onClick={() => exportChat(c)}>⤓</button>
                  <button
                    title="Delete"
                    onClick={() => {
                      if (confirm(`Delete "${c.title}"?`)) deleteConversation(c.id)
                    }}
                  >
                    ✕
                  </button>
                </div>
              </button>
            ))}
          </div>
          {conversations.length > 0 && (
            <button className="sidebar-clear" onClick={clearAll}>
              🗑 Clear all history
            </button>
          )}
        </aside>
      )}

      <main className="neura-chat-main">
        <header className="neura-chat-bar">
          {!showSidebar && (
            <button className="bar-icon" onClick={() => setShowSidebar(true)} title="Show history">
              ☰
            </button>
          )}
          <div className="bar-title">
            <span className="bar-dot" />
            {activeConv ? activeConv.title : 'NeuraOne AI'}
          </div>
          <select
            className="bar-model"
            value={prefs.model}
            onChange={(e) => setPrefs((p) => ({ ...p, model: e.target.value }))}
            title="Choose AI model"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <button
            className={`bar-icon ${showSettingsPanel ? 'active' : ''}`}
            onClick={() => setShowSettingsPanel((v) => !v)}
            title="Chat settings"
          >
            ⚙️
          </button>
          {activeConv && (
            <button className="bar-icon" onClick={() => exportChat(activeConv)} title="Export">
              ⤓
            </button>
          )}
        </header>

        {showSettingsPanel && (
          <div className="neura-chat-settings">
            <div className="cs-row">
              <label>Model</label>
              <div className="cs-options">
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    className={`cs-pill ${prefs.model === m.id ? 'active' : ''}`}
                    onClick={() => setPrefs((p) => ({ ...p, model: m.id }))}
                    title={m.desc}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="cs-row">
              <label>Reply language</label>
              <select
                value={prefs.language}
                onChange={(e) => setPrefs((p) => ({ ...p, language: e.target.value }))}
              >
                <option value="auto">Auto-detect</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिन्दी)</option>
                <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                <option value="Bengali">Bengali (বাংলা)</option>
                <option value="Tamil">Tamil (தமிழ்)</option>
                <option value="Telugu">Telugu (తెలుగు)</option>
                <option value="Marathi">Marathi (मराठी)</option>
                <option value="Spanish">Spanish (Español)</option>
                <option value="French">French (Français)</option>
                <option value="German">German (Deutsch)</option>
                <option value="Italian">Italian (Italiano)</option>
                <option value="Portuguese">Portuguese (Português)</option>
                <option value="Russian">Russian (Русский)</option>
                <option value="Arabic">Arabic (العربية)</option>
                <option value="Japanese">Japanese (日本語)</option>
                <option value="Korean">Korean (한국어)</option>
                <option value="Chinese">Chinese (中文)</option>
              </select>
            </div>
            <div className="cs-row">
              <label>Custom instructions</label>
              <textarea
                rows={3}
                placeholder="e.g. Always answer concisely and in bullet points."
                value={prefs.systemHint}
                onChange={(e) => setPrefs((p) => ({ ...p, systemHint: e.target.value }))}
              />
            </div>
            <div className="cs-row cs-row-inline">
              <label>Density</label>
              <select
                value={prefs.density}
                onChange={(e) => setPrefs((p) => ({ ...p, density: e.target.value as 'cozy' | 'compact' }))}
              >
                <option value="cozy">Cozy</option>
                <option value="compact">Compact</option>
              </select>
              <label>Font</label>
              <input
                type="range"
                min="0.85"
                max="1.3"
                step="0.05"
                value={prefs.fontScale}
                onChange={(e) => setPrefs((p) => ({ ...p, fontScale: Number(e.target.value) }))}
              />
              <label>
                <input
                  type="checkbox"
                  checked={prefs.enterToSend}
                  onChange={(e) => setPrefs((p) => ({ ...p, enterToSend: e.target.checked }))}
                />
                Enter to send
              </label>
            </div>
          </div>
        )}

        <div className="neura-chat-messages" ref={chatRef}>
          {!activeConv || activeConv.messages.length === 0 ? (
            <Welcome onPick={(t) => send(t)} userName={user?.name || user?.email?.split('@')[0]} />
          ) : (
            activeConv.messages.map((m) => (
              <MessageBubble key={m.id} message={m} onCopy={copyMessage} />
            ))
          )}
          {loading && (
            <div className="chat-msg assistant">
              <div className="chat-avatar">🤖</div>
              <div className="chat-bubble">
                <p className="typing-dots">NeuraOne is thinking…</p>
              </div>
            </div>
          )}
        </div>

        {pendingFiles.length > 0 && (
          <div className="pending-attachments">
            {pendingFiles.map((f, i) => (
              <span key={i} className="pending-chip" title={f.path || f.name}>
                📎 {f.name}
                {f.truncated ? ' (truncated)' : ''}
                <button onClick={() => removePendingFile(i)} aria-label="remove">✕</button>
              </span>
            ))}
          </div>
        )}

        {error && <div className="chat-error">{error}</div>}

        <div className="neura-chat-composer">
          <div className="composer-actions">
            <button
              className="composer-btn"
              title="Attach files"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              📎
            </button>
            <button
              className="composer-btn"
              title="Attach a folder"
              onClick={() => folderInputRef.current?.click()}
              disabled={loading}
            >
              📁
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={(e) => {
                handleFiles(e.target.files)
                e.target.value = ''
              }}
            />
            <input
              ref={folderInputRef}
              type="file"
              hidden
              multiple
              {...({ webkitdirectory: '', directory: '' } as Record<string, unknown>)}
              onChange={(e) => {
                handleFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </div>
          <textarea
            ref={textareaRef}
            className="composer-textarea"
            placeholder="Ask NeuraOne anything — code, ideas, files, anything…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            disabled={loading}
          />
          <button
            className="composer-send"
            onClick={() => send()}
            disabled={loading || (!input.trim() && pendingFiles.length === 0)}
            title="Send"
          >
            ➤
          </button>
        </div>
      </main>
    </div>
  )
}

function buildSystemHint(prefs: ChatPrefs, name?: string, email?: string): string | undefined {
  const lines: string[] = []
  if (name) lines.push(`The user's name is ${name}.`)
  else if (email) lines.push(`The user's email is ${email}.`)
  if (prefs.language && prefs.language !== 'auto') {
    lines.push(`Always reply in ${prefs.language}, regardless of the language used by the user.`)
  }
  if (prefs.systemHint.trim()) lines.push(prefs.systemHint.trim())
  return lines.length ? lines.join('\n') : undefined
}

function truncateTitle(text: string): string {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= 48) return t || 'New chat'
  return t.slice(0, 45) + '…'
}

function Welcome({ onPick, userName }: { onPick: (t: string) => void; userName?: string }) {
  return (
    <div className="chat-welcome">
      <div className="welcome-logo">⚡</div>
      <h2>{userName ? `Welcome back, ${userName}` : 'Welcome to NeuraOne AI'}</h2>
      <p>The ultimate AI assistant — code, write, plan, learn, attach files, ask anything.</p>
      <div className="welcome-grid">
        {QUICK_PROMPTS.map((q) => (
          <button key={q} className="welcome-card" onClick={() => onPick(q.replace(/^[^\s]+\s/, ''))}>
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

function MessageBubble({ message, onCopy }: { message: ChatMessage; onCopy: (t: string) => void }) {
  return (
    <div className={`chat-msg ${message.role}`}>
      <div className="chat-avatar">{message.role === 'user' ? '👤' : '🤖'}</div>
      <div className="chat-bubble">
        {message.attachments && message.attachments.length > 0 && (
          <div className="bubble-attachments">
            {message.attachments.map((a, i) => (
              <span key={i} className="bubble-chip" title={a.path || a.name}>
                📎 {a.name}
              </span>
            ))}
          </div>
        )}
        <MarkdownRenderer text={message.content} />
        <div className="chat-bubble-foot">
          <span className="chat-time">{formatTime(message.time)}</span>
          <button className="chat-mini-btn" onClick={() => onCopy(message.content)} title="Copy">
            📋
          </button>
        </div>
      </div>
    </div>
  )
}

