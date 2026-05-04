import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { login, signup, oauthLogin, requestPasswordRecovery } from '@netlify/identity'
import { useIdentity } from '@/lib/identity-context'
import { useState, useEffect } from 'react'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

type Mode = 'login' | 'signup' | 'forgot'

function LoginPage() {
  const { user, ready } = useIdentity()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    if (ready && user) navigate({ to: '/' })
  }, [ready, user, navigate])

  const fullName = `${firstName} ${lastName}`.trim()

  const handleLogin = async () => {
    if (!email || !password) { setError('Please enter email and password.'); return }
    setLoading(true); setError('')
    try {
      await login(email, password)
      navigate({ to: '/' })
    } catch (e: any) {
      const raw = e?.message || 'Login failed. Check your credentials.'
      const lower = raw.toLowerCase()
      if (lower.includes('not confirmed') || lower.includes('email not confirmed')) {
        setError(
          "Your email isn't confirmed yet. Please open the confirmation link from the email we sent you. If the link expired or didn't work, sign up again to receive a new one.",
        )
      } else {
        setError(raw)
      }
    } finally { setLoading(false) }
  }

  const handleSignup = async () => {
    if (!email || !password || !firstName) { setError('Please fill all required fields.'); return }
    setLoading(true); setError('')
    try {
      await signup(email, password, { full_name: fullName || firstName })
      setInfo(`✅ Confirmation email sent to ${email}. Please check your inbox and click the link to activate your account.`)
      setMode('login')
    } catch (e: any) {
      setError(e?.message || 'Signup failed. Please try again.')
    } finally { setLoading(false) }
  }

  const handleForgot = async () => {
    if (!email) { setError('Please enter your email address.'); return }
    setLoading(true); setError('')
    try {
      await requestPasswordRecovery(email)
      setInfo(`✅ Password reset email sent to ${email}.`)
    } catch (e: any) {
      setError(e?.message || 'Failed to send reset email.')
    } finally { setLoading(false) }
  }

  const handleOAuth = (provider: 'github' | 'google') => {
    try { oauthLogin(provider) } catch { setError(`OAuth login with ${provider} failed.`) }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo-area">
          <div className="login-logo-icon">🧠</div>
          <h2>{mode === 'login' ? 'Log in to NeuraOne' : mode === 'signup' ? 'Create your account' : 'Reset password'}</h2>
          <p className="login-sub">
            {mode === 'login'
              ? "Access your AI-powered workspace."
              : mode === 'signup'
              ? "Join NeuraOne and unlock full AI power."
              : "We'll send you a reset link."}
          </p>
        </div>

        {info && <div className="login-info">{info}</div>}
        {error && <div className="login-error">{error}</div>}

        {mode !== 'forgot' && (
          <>
            <button className="social-btn" onClick={() => handleOAuth('google')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            <button className="social-btn" onClick={() => handleOAuth('github')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              Continue with GitHub
            </button>
            <div className="login-divider">OR</div>
          </>
        )}

        {mode === 'signup' && (
          <div className="login-row">
            <input
              className="login-input"
              placeholder="First name *"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <input
              className="login-input"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        )}

        <input
          type="email"
          className="login-input"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {mode !== 'forgot' && (
          <input
            type="password"
            className="login-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSignup())}
          />
        )}

        <button
          className="login-submit-btn"
          onClick={mode === 'login' ? handleLogin : mode === 'signup' ? handleSignup : handleForgot}
          disabled={loading}
        >
          {loading ? '⏳ Please wait…' : mode === 'login' ? 'Log In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
        </button>

        <div className="login-switch">
          {mode === 'login' && (
            <>
              <button onClick={() => { setMode('signup'); setError(''); setInfo('') }}>Don't have an account? Sign up</button>
              <button onClick={() => { setMode('forgot'); setError(''); setInfo('') }}>Forgot password?</button>
            </>
          )}
          {mode === 'signup' && (
            <button onClick={() => { setMode('login'); setError(''); setInfo('') }}>Already have an account? Log in</button>
          )}
          {mode === 'forgot' && (
            <button onClick={() => { setMode('login'); setError(''); setInfo('') }}>← Back to login</button>
          )}
        </div>

        <p className="login-terms">
          By continuing, you agree to NeuraOne's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
