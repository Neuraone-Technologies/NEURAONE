import { useEffect, useRef, useState } from 'react'
import { handleAuthCallback } from '@netlify/identity'

const AUTH_HASH_PATTERN =
  /(^|&)(confirmation_token|recovery_token|invite_token|email_change_token|access_token|error|error_description)=/

type Banner = { tone: 'success' | 'error'; message: string } | null

export function CallbackHandler({ children }: { children: React.ReactNode }) {
  const handled = useRef(false)
  const [banner, setBanner] = useState<Banner>(null)

  useEffect(() => {
    if (handled.current) return
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash
    if (!AUTH_HASH_PATTERN.test(hash)) return
    handled.current = true

    ;(async () => {
      try {
        const result = await handleAuthCallback()
        history.replaceState(null, '', window.location.pathname + window.location.search)

        if (!result) return
        if (result.type === 'confirmation') {
          setBanner({
            tone: 'success',
            message: '✅ Email confirmed! You are now signed in.',
          })
        } else if (result.type === 'recovery') {
          setBanner({
            tone: 'success',
            message: '✅ Recovery link verified. You can now reset your password from your account settings.',
          })
        } else if (result.type === 'email_change') {
          setBanner({
            tone: 'success',
            message: '✅ Email address updated successfully.',
          })
        } else if (result.type === 'oauth') {
          setBanner({
            tone: 'success',
            message: '✅ Signed in successfully.',
          })
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Authentication callback failed.'
        const lower = msg.toLowerCase()
        const friendly = lower.includes('expired')
          ? 'This confirmation link has expired. Please sign up again or request a new confirmation email.'
          : lower.includes('invalid') || lower.includes('not found')
          ? 'This confirmation link is invalid or has already been used. Try logging in — your email may already be confirmed.'
          : msg
        setBanner({ tone: 'error', message: `⚠️ ${friendly}` })
        history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    })()
  }, [])

  return (
    <>
      {banner && (
        <div className={`auth-banner auth-banner-${banner.tone}`} role="status">
          <span>{banner.message}</span>
          <button
            type="button"
            aria-label="Dismiss"
            className="auth-banner-close"
            onClick={() => setBanner(null)}
          >
            ×
          </button>
        </div>
      )}
      {children}
    </>
  )
}
