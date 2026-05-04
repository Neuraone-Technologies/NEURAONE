import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export const Route = createFileRoute('/faq')({
  component: FAQ,
})

const faqs = [
  {
    question: 'What is NeuraOne?',
    answer:
      'NeuraOne is an advanced AI agent platform created by NeuraOne Technologies. It gives you complete desktop control, content creation, smart search, and task automation through natural language commands — all powered by cutting-edge AI.',
  },
  {
    question: 'When will the desktop app be available for download?',
    answer:
      'The NeuraOne desktop application is currently under active development. It will be announced very soon. Sign up with your email to get notified the moment it launches for Windows, macOS, and Linux.',
  },
  {
    question: 'How do I create an account?',
    answer:
      'Click "Get Started" or "Login" in the top navigation bar. You can sign up with your email and a password, or use Google or GitHub for one-click login. After signup, you\'ll receive a confirmation email — click the link to activate your account.',
  },
  {
    question: 'Is the AI chatbot really powered by advanced AI?',
    answer:
      'Yes! The live demo chatbot on the homepage uses state-of-the-art AI models to answer your questions. It can handle topics ranging from technology and coding to science, business, and creative writing.',
  },
  {
    question: 'Who built NeuraOne?',
    answer:
      'NeuraOne was built by Harsh Patel and the NeuraOne Technologies team. Our mission is to make powerful AI accessible to everyone through an intuitive, natural language interface.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Absolutely. NeuraOne uses end-to-end encryption for all data in transit and at rest. Your conversations and personal information are never shared with third parties.',
  },
  {
    question: 'What languages does NeuraOne support?',
    answer:
      'NeuraOne AI can understand and respond in 50+ languages. Simply type or speak in your preferred language and NeuraOne will respond in kind.',
  },
]

function FAQ() {
  return (
    <div className="min-h-screen" style={{ padding: '80px 1.5rem' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, textAlign: 'center', marginBottom: '0.75rem', color: '#fff' }}>
          Frequently Asked Questions
        </h1>
        <p style={{ textAlign: 'center', color: '#7070a0', marginBottom: '3rem' }}>
          Everything you need to know about NeuraOne AI.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {faqs.map((faq, i) => (
            <Accordion key={i} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </div>
  )
}

function Accordion({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ background: 'rgba(15,15,35,0.7)', border: '1px solid rgba(108,99,255,0.25)', borderRadius: '14px', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        className="faq-accordion-btn"
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 1.25rem', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
      >
        <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#d0d0f0' }}>{question}</span>
        <ChevronDown
          size={18}
          style={{ flexShrink: 0, color: '#6c63ff', transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
        />
      </button>
      {open && (
        <div style={{ padding: '0 1.25rem 1.1rem', color: '#8080a0', fontSize: '0.875rem', lineHeight: 1.7 }}>
          {answer}
        </div>
      )}
    </div>
  )
}
