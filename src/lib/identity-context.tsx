import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  getUser,
  logout as nlLogout,
  onAuthChange,
  updateUser as nlUpdateUser,
  type User,
} from '@netlify/identity'

export type GeoInfo = {
  ip: string | null
  geo: {
    city: string | null
    country: string | null
    countryCode: string | null
    subdivision: string | null
    timezone: string | null
    latitude: number | null
    longitude: number | null
  } | null
}

interface IdentityContextValue {
  user: User | null
  ready: boolean
  geo: GeoInfo | null
  refreshGeo: () => Promise<void>
  logout: () => Promise<void>
  updateUser: typeof nlUpdateUser
}

const IdentityContext = createContext<IdentityContextValue | null>(null)

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)
  const [geo, setGeo] = useState<GeoInfo | null>(null)

  const refreshGeo = async () => {
    try {
      const r = await fetch('/api/userinfo', { cache: 'no-store' })
      if (!r.ok) return
      const data = (await r.json()) as GeoInfo
      setGeo(data)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    getUser().then((u) => {
      setUser(u ?? null)
      setReady(true)
    })
    const unsubscribe = onAuthChange((_event, u) => {
      setUser(u ?? null)
    })
    refreshGeo()
    return unsubscribe
  }, [])

  return (
    <IdentityContext.Provider
      value={{
        user,
        ready,
        geo,
        refreshGeo,
        logout: nlLogout,
        updateUser: nlUpdateUser,
      }}
    >
      {children}
    </IdentityContext.Provider>
  )
}

export function useIdentity() {
  const ctx = useContext(IdentityContext)
  if (!ctx) throw new Error('useIdentity must be used within an IdentityProvider')
  return ctx
}
