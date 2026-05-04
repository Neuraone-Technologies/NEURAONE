import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { ChatView } from '@/components/ChatView'
import { useIdentity } from '@/lib/identity-context'

export const Route = createFileRoute('/chat')({
  component: ChatPage,
})

function ChatPage() {
  const { user, ready } = useIdentity()
  const navigate = useNavigate()

  useEffect(() => {
    if (ready && !user) navigate({ to: '/login' })
  }, [ready, user, navigate])

  if (!ready) {
    return <div className="chat-loading">Loading…</div>
  }
  if (!user) return null

  return <ChatView />
}
