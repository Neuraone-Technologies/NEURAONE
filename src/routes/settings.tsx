import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useIdentity } from '@/lib/identity-context'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

interface AppPrefs {
  language: string
  theme: 'dark' | 'midnight' | 'aurora'
  fontScale: number
  density: 'cozy' | 'compact'
  notificationsEmail: boolean
  voiceAutoSpeak: boolean
  enterToSend: boolean
}

const PREF_KEY = 'neuraone:app-prefs:v1'

const DEFAULT: AppPrefs = {
  language: 'en',
  theme: 'dark',
  fontScale: 1,
  density: 'cozy',
  notificationsEmail: true,
  voiceAutoSpeak: true,
  enterToSend: true,
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi (हिन्दी)' },
  { code: 'gu', label: 'Gujarati (ગુજરાતી)' },
  { code: 'bn', label: 'Bengali (বাংলা)' },
  { code: 'ta', label: 'Tamil (தமிழ்)' },
  { code: 'te', label: 'Telugu (తెలుగు)' },
  { code: 'mr', label: 'Marathi (मराठी)' },
  { code: 'kn', label: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ml', label: 'Malayalam (മലയാളം)' },
  { code: 'pa', label: 'Punjabi (ਪੰਜਾਬੀ)' },
  { code: 'ur', label: 'Urdu (اردو)' },
  { code: 'es', label: 'Spanish (Español)' },
  { code: 'fr', label: 'French (Français)' },
  { code: 'de', label: 'German (Deutsch)' },
  { code: 'it', label: 'Italian (Italiano)' },
  { code: 'pt', label: 'Portuguese (Português)' },
  { code: 'ru', label: 'Russian (Русский)' },
  { code: 'ar', label: 'Arabic (العربية)' },
  { code: 'ja', label: 'Japanese (日本語)' },
  { code: 'ko', label: 'Korean (한국어)' },
  { code: 'zh', label: 'Chinese (中文)' },
  { code: 'tr', label: 'Turkish (Türkçe)' },
  { code: 'vi', label: 'Vietnamese (Tiếng Việt)' },
  { code: 'th', label: 'Thai (ไทย)' },
]

function loadPrefs(): AppPrefs {
  if (typeof window === 'undefined') return DEFAULT
  try {
    const raw = localStorage.getItem(PREF_KEY)
    if (!raw) return DEFAULT
    return { ...DEFAULT, ...(JSON.parse(raw) as Partial<AppPrefs>) }
  } catch {
    return DEFAULT
  }
}

function savePrefs(p: AppPrefs) {
  if (typeof window === 'undefined') return
  localStorage.setItem(PREF_KEY, JSON.stringify(p))
}

function SettingsPage() {
  const { user, ready, updateUser } = useIdentity()
  const navigate = useNavigate()
  const [prefs, setPrefs] = useState<AppPrefs>(DEFAULT)
  const [emailNew, setEmailNew] = useState('')
  const [phoneNew, setPhoneNew] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [info, setInfo] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (ready && !user) navigate({ to: '/login' })
  }, [ready, user, navigate])

  useEffect(() => {
    setPrefs(loadPrefs())
    if (user) {
      const meta = (user.userMetadata || {}) as { phone?: string }
      setPhoneNew(meta.phone || '')
    }
  }, [user?.id])

  useEffect(() => {
    savePrefs(prefs)
  }, [prefs])

  if (!ready || !user) return <div className="chat-loading">Loading settings…</div>

  const updateEmail = async () => {
    if (!emailNew) return
    setBusy(true); setError(''); setInfo('')
    try {
      await updateUser({ email: emailNew })
      setInfo(`✅ Confirmation email sent to ${emailNew}. Click the link to confirm the change.`)
      setEmailNew('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update email.')
    } finally { setBusy(false) }
  }

  const updatePhone = async () => {
    setBusy(true); setError(''); setInfo('')
    try {
      await updateUser({ data: { ...(user.userMetadata as object), phone: phoneNew } })
      setInfo('✅ Phone number saved.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update phone.')
    } finally { setBusy(false) }
  }

  const updatePassword = async () => {
    if (!pwNew) return
    setBusy(true); setError(''); setInfo('')
    try {
      await updateUser({ password: pwNew })
      setInfo('✅ Password updated.')
      setPwNew('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update password.')
    } finally { setBusy(false) }
  }

  return (
    <div className="account-page">
      <div className="account-shell">
        <aside className="account-side">
          <h3>Account</h3>
          <Link to="/profile" className="account-side-link">👤 Profile</Link>
          <Link to="/settings" className="account-side-link active">⚙️ Settings</Link>
          <Link to="/chat" className="account-side-link">💬 Chat</Link>
          <Link to="/" className="account-side-link">🏠 Home</Link>
        </aside>

        <main className="account-main">
          <div className="account-header">
            <h2>Settings</h2>
            <p className="account-email">Customize NeuraOne the way you like it</p>
          </div>

          {info && <div className="login-info">{info}</div>}
          {error && <div className="login-error">{error}</div>}

          <section className="account-card">
            <h3>🌍 Language & appearance</h3>
            <div className="account-grid">
              <label>
                <span>Interface language</span>
                <select
                  value={prefs.language}
                  onChange={(e) => setPrefs({ ...prefs, language: e.target.value })}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Theme</span>
                <select
                  value={prefs.theme}
                  onChange={(e) => setPrefs({ ...prefs, theme: e.target.value as AppPrefs['theme'] })}
                >
                  <option value="dark">Cosmic Dark (default)</option>
                  <option value="midnight">Midnight</option>
                  <option value="aurora">Aurora</option>
                </select>
              </label>
              <label>
                <span>Density</span>
                <select
                  value={prefs.density}
                  onChange={(e) => setPrefs({ ...prefs, density: e.target.value as AppPrefs['density'] })}
                >
                  <option value="cozy">Cozy</option>
                  <option value="compact">Compact</option>
                </select>
              </label>
              <label>
                <span>Font size · {prefs.fontScale.toFixed(2)}×</span>
                <input
                  type="range" min="0.85" max="1.3" step="0.05"
                  value={prefs.fontScale}
                  onChange={(e) => setPrefs({ ...prefs, fontScale: Number(e.target.value) })}
                />
              </label>
            </div>
          </section>

          <section className="account-card">
            <h3>💬 Chat behavior</h3>
            <div className="toggle-row">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={prefs.enterToSend}
                  onChange={(e) => setPrefs({ ...prefs, enterToSend: e.target.checked })}
                />
                <span>Enter sends messages (Shift+Enter for new line)</span>
              </label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={prefs.voiceAutoSpeak}
                  onChange={(e) => setPrefs({ ...prefs, voiceAutoSpeak: e.target.checked })}
                />
                <span>Auto-speak AI responses</span>
              </label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={prefs.notificationsEmail}
                  onChange={(e) => setPrefs({ ...prefs, notificationsEmail: e.target.checked })}
                />
                <span>Email me about important updates</span>
              </label>
            </div>
          </section>

          <section className="account-card">
            <h3>📧 Update email</h3>
            <p className="account-email">Current: {user.email}</p>
            <div className="account-row">
              <input
                type="email"
                placeholder="new@example.com"
                value={emailNew}
                onChange={(e) => setEmailNew(e.target.value)}
              />
              <button className="login-submit-btn" onClick={updateEmail} disabled={busy || !emailNew}>
                Send confirmation
              </button>
            </div>
          </section>

          <section className="account-card">
            <h3>📱 Update phone</h3>
            <div className="account-row">
              <input
                type="tel"
                placeholder="+91 ..."
                value={phoneNew}
                onChange={(e) => setPhoneNew(e.target.value)}
              />
              <button className="login-submit-btn" onClick={updatePhone} disabled={busy}>
                Save phone
              </button>
            </div>
          </section>

          <section className="account-card">
            <h3>🔒 Change password</h3>
            <div className="account-row">
              <input
                type="password"
                placeholder="New password"
                value={pwNew}
                onChange={(e) => setPwNew(e.target.value)}
              />
              <button className="login-submit-btn" onClick={updatePassword} disabled={busy || !pwNew}>
                Update password
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
