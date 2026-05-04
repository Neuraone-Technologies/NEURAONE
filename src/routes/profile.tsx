import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useIdentity } from '@/lib/identity-context'

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
})

interface ProfileMeta {
  first_name?: string
  last_name?: string
  dob?: string
  phone?: string
  bio?: string
  full_name?: string
}

function ProfilePage() {
  const { user, ready, geo, refreshGeo, updateUser } = useIdentity()
  const navigate = useNavigate()
  const meta = (user?.userMetadata || {}) as ProfileMeta
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [dob, setDob] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [info, setInfo] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (ready && !user) navigate({ to: '/login' })
  }, [ready, user, navigate])

  useEffect(() => {
    if (!user) return
    const splitName = (meta.full_name || user.name || '').split(' ')
    setFirst(meta.first_name ?? splitName[0] ?? '')
    setLast(meta.last_name ?? splitName.slice(1).join(' ') ?? '')
    setDob(meta.dob ?? '')
    setPhone(meta.phone ?? '')
    setBio(meta.bio ?? '')
  }, [user?.id])

  if (!ready || !user) return <div className="chat-loading">Loading profile…</div>

  const save = async () => {
    setSaving(true)
    setInfo('')
    setError('')
    try {
      const fullName = `${first} ${last}`.trim()
      await updateUser({
        data: {
          full_name: fullName || undefined,
          first_name: first || undefined,
          last_name: last || undefined,
          dob: dob || undefined,
          phone: phone || undefined,
          bio: bio || undefined,
        },
      })
      setInfo('✅ Profile saved.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save profile.')
    } finally {
      setSaving(false)
    }
  }

  const initials = (first || user.name || user.email || '?')
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('')

  const locationLine = geo?.geo
    ? [geo.geo.city, geo.geo.subdivision, geo.geo.country].filter(Boolean).join(', ')
    : 'Detecting…'

  return (
    <div className="account-page">
      <div className="account-shell">
        <aside className="account-side">
          <h3>Account</h3>
          <Link to="/profile" className="account-side-link active">👤 Profile</Link>
          <Link to="/settings" className="account-side-link">⚙️ Settings</Link>
          <Link to="/chat" className="account-side-link">💬 Chat</Link>
          <Link to="/" className="account-side-link">🏠 Home</Link>
        </aside>
        <main className="account-main">
          <div className="account-header">
            <div className="account-avatar">{initials || '👤'}</div>
            <div>
              <h2>{`${first} ${last}`.trim() || user.name || user.email}</h2>
              <p className="account-email">{user.email}</p>
            </div>
          </div>

          {info && <div className="login-info">{info}</div>}
          {error && <div className="login-error">{error}</div>}

          <section className="account-card">
            <h3>Personal info</h3>
            <div className="account-grid">
              <label>
                <span>First name</span>
                <input value={first} onChange={(e) => setFirst(e.target.value)} placeholder="First name" />
              </label>
              <label>
                <span>Last name</span>
                <input value={last} onChange={(e) => setLast(e.target.value)} placeholder="Last name" />
              </label>
              <label>
                <span>Date of birth</span>
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </label>
              <label>
                <span>Phone</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 73807 83560"
                />
              </label>
              <label className="account-grid-full">
                <span>Bio</span>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell NeuraOne about yourself…"
                />
              </label>
            </div>
            <button className="login-submit-btn" onClick={save} disabled={saving}>
              {saving ? '⏳ Saving…' : '💾 Save changes'}
            </button>
          </section>

          <section className="account-card">
            <h3>Network & location</h3>
            <div className="kv-grid">
              <div><span>IP address</span><strong>{geo?.ip || 'Detecting…'}</strong></div>
              <div><span>Location</span><strong>{locationLine}</strong></div>
              <div><span>Timezone</span><strong>{geo?.geo?.timezone || '—'}</strong></div>
              <div><span>Country code</span><strong>{geo?.geo?.countryCode || '—'}</strong></div>
              <div><span>Coordinates</span>
                <strong>
                  {geo?.geo?.latitude != null && geo?.geo?.longitude != null
                    ? `${geo.geo.latitude.toFixed(2)}, ${geo.geo.longitude.toFixed(2)}`
                    : '—'}
                </strong>
              </div>
              <div><span>Account ID</span><strong className="kv-mono">{user.id}</strong></div>
            </div>
            <button className="btn-outline btn-outline-sm" onClick={() => refreshGeo()}>
              🔄 Refresh
            </button>
          </section>
        </main>
      </div>
    </div>
  )
}
