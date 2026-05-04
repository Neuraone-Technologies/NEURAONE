import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useIdentity } from '@/lib/identity-context'

export function Header() {
  const { user, ready, geo, logout } = useIdentity()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  const handleLogout = async () => {
    await logout()
    navigate({ to: '/' })
    setMenuOpen(false)
  }

  const meta = (user?.userMetadata || {}) as { first_name?: string; last_name?: string; full_name?: string }
  const first = meta.first_name || (meta.full_name || user?.name || '').split(' ')[0]
  const last = meta.last_name || (meta.full_name || user?.name || '').split(' ').slice(1).join(' ')
  const displayName = (first || user?.name || user?.email?.split('@')[0] || 'User').trim()
  const initials = `${(first || user?.email || '?')[0]}${(last || '')[0] || ''}`.toUpperCase()

  const locationLine = geo?.geo
    ? [geo.geo.city, geo.geo.countryCode].filter(Boolean).join(', ')
    : ''

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="logo">
          <div className="logo-glow" />
          <span className="logo-text">⚡ NEURAONE</span>
          <span className="logo-badge">ULTIMATE AI</span>
        </Link>

        <button
          className="nav-burger"
          aria-label="Toggle navigation"
          onClick={() => setNavOpen((v) => !v)}
        >
          ☰
        </button>

        <ul className={`nav-menu ${navOpen ? 'open' : ''}`}>
          <li><a href="/#home" className="nav-link" onClick={() => setNavOpen(false)}>🏠 Home</a></li>
          <li><a href="/#commands" className="nav-link" onClick={() => setNavOpen(false)}>📋 Commands</a></li>
          <li><Link to="/chat" className="nav-link" onClick={() => setNavOpen(false)}>💬 Chat</Link></li>
          <li><a href="/#brain" className="nav-link" onClick={() => setNavOpen(false)}>🧠 AI Brain</a></li>
          <li><a href="/#download" className="nav-link" onClick={() => setNavOpen(false)}>📥 Download</a></li>
          <li><Link to="/faq" className="nav-link" onClick={() => setNavOpen(false)}>❓ FAQ</Link></li>
        </ul>

        <div className="nav-controls">
          {ready && user ? (
            <div className="user-menu" ref={menuRef}>
              <button
                className="user-avatar-btn"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Open profile menu"
              >
                <span className="user-avatar-bubble">{initials || '👤'}</span>
                <span className="user-avatar-text">
                  <span className="user-avatar-name">Hi, {displayName}</span>
                  {locationLine && <span className="user-avatar-meta">📍 {locationLine}</span>}
                </span>
                <span className="user-avatar-caret">▾</span>
              </button>
              {menuOpen && (
                <div className="user-dropdown">
                  <div className="user-dropdown-head">
                    <div className="user-dropdown-avatar">{initials || '👤'}</div>
                    <div>
                      <div className="user-dropdown-name">
                        {`${first || ''} ${last || ''}`.trim() || user.name || user.email}
                      </div>
                      <div className="user-dropdown-email">{user.email}</div>
                      {geo?.ip && (
                        <div className="user-dropdown-ip">
                          IP {geo.ip}{locationLine ? ` · ${locationLine}` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                  <Link to="/chat" className="user-dropdown-item" onClick={() => setMenuOpen(false)}>
                    💬 Chat with NeuraOne
                  </Link>
                  <Link to="/profile" className="user-dropdown-item" onClick={() => setMenuOpen(false)}>
                    👤 Profile
                  </Link>
                  <Link to="/settings" className="user-dropdown-item" onClick={() => setMenuOpen(false)}>
                    ⚙️ Settings
                  </Link>
                  <Link to="/faq" className="user-dropdown-item" onClick={() => setMenuOpen(false)}>
                    ❓ Help & FAQ
                  </Link>
                  <button className="user-dropdown-logout" onClick={handleLogout}>
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-login">Login</Link>
              <Link to="/login" className="btn-signup">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
