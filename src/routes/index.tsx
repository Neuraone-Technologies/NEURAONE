import { createFileRoute } from '@tanstack/react-router'
import { useIdentity } from '@/lib/identity-context'
import { Link } from '@tanstack/react-router'
import { Chatbot } from '@/components/Chatbot'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="neura-page">
      <HeroSection />
      <CommandsSection />
      <DemoSection />
      <BrainSection />
      <DownloadSection />
    </div>
  )
}

function HeroSection() {
  const { user } = useIdentity()
  return (
    <section id="home" className="hero">
      <div className="hero-content">
        <div className="hero-badge">⚡ NEXT-GEN AI AGENT</div>
        <h1 className="hero-title">
          The World's Most Advanced<br />
          <span className="hero-gradient">Desktop AI Agent</span>
        </h1>
        <p className="hero-desc">
          NeuraOne gives you complete desktop control through natural language.
          Automate tasks, control apps, generate content, and do anything — all with voice or text commands.
        </p>
        <div className="hero-actions">
          <a href="#download" className="btn-primary">📥 Download Free</a>
          <a href="#demo" className="btn-outline">🎮 Try Live Demo</a>
        </div>
        {user && (
          <div className="hero-welcome">
            👋 Welcome back, <strong>{user.name || user.email}</strong>! Ready to experience NeuraOne AI?
          </div>
        )}
        <div className="hero-stats">
          <div className="stat"><span className="stat-num">100+</span><span className="stat-label">AI Commands</span></div>
          <div className="stat"><span className="stat-num">50K+</span><span className="stat-label">Users</span></div>
          <div className="stat"><span className="stat-num">99.9%</span><span className="stat-label">Uptime</span></div>
        </div>
      </div>
    </section>
  )
}

const commands = [
  { icon: '🖥️', title: 'Desktop Control', desc: 'Open apps, manage windows, control your OS via natural language.' },
  { icon: '📝', title: 'Content Creation', desc: 'Write emails, reports, code, and creative content instantly.' },
  { icon: '🔍', title: 'Smart Search', desc: 'Search the web, files, and databases with AI-powered results.' },
  { icon: '🤖', title: 'Task Automation', desc: 'Automate repetitive workflows and save hours every day.' },
  { icon: '💬', title: 'Natural Language', desc: 'Just talk or type — NeuraOne understands what you mean.' },
  { icon: '🧠', title: 'Deep Learning', desc: 'Gets smarter with every interaction, learning your preferences.' },
]

function CommandsSection() {
  return (
    <section id="commands" className="commands-section">
      <div className="section-container">
        <h2 className="section-title">What NeuraOne Can Do</h2>
        <p className="section-sub">100+ powerful AI commands at your fingertips</p>
        <div className="commands-grid">
          {commands.map((cmd) => (
            <div key={cmd.title} className="command-card">
              <div className="cmd-icon">{cmd.icon}</div>
              <h3>{cmd.title}</h3>
              <p>{cmd.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function DemoSection() {
  const { user } = useIdentity()
  return (
    <section id="demo" className="demo-section">
      <div className="section-container">
        <h2 className="section-title">🎮 Live AI Demo</h2>
        <p className="section-sub">
          Chat with NeuraOne AI — speak or type in 50+ languages, choose your favorite male or female voice.
        </p>
        <div className="demo-cta-row">
          <Link to={user ? '/chat' : '/login'} className="btn-primary">
            🚀 Open Full Chat — Files, History, Code & More
          </Link>
        </div>
        <div className="demo-wrapper">
          <Chatbot />
        </div>
      </div>
    </section>
  )
}

function BrainSection() {
  return (
    <section id="brain" className="brain-section">
      <div className="section-container">
        <h2 className="section-title">🧠 Powered by Advanced AI</h2>
        <p className="section-sub">NeuraOne uses cutting-edge language models and neural networks</p>
        <div className="brain-grid">
          <div className="brain-card">
            <div className="brain-icon">⚡</div>
            <h3>Lightning Fast</h3>
            <p>Responses in milliseconds. NeuraOne processes natural language at incredible speed.</p>
          </div>
          <div className="brain-card">
            <div className="brain-icon">🎯</div>
            <h3>Context Aware</h3>
            <p>Remembers your conversation history and builds context for smarter replies.</p>
          </div>
          <div className="brain-card">
            <div className="brain-icon">🔐</div>
            <h3>Private & Secure</h3>
            <p>Your data stays private. End-to-end encryption on all communications.</p>
          </div>
          <div className="brain-card">
            <div className="brain-icon">🌍</div>
            <h3>Multi-Language</h3>
            <p>Works in 50+ languages. Communicate with NeuraOne in your native language.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function DownloadSection() {
  return (
    <section id="download" className="download-section">
      <div className="section-container">
        <h2 className="section-title">📥 Download NeuraOne</h2>
        <p className="section-sub">Get the full desktop AI experience</p>
        <div className="download-notice">
          <div className="notice-icon">🚧</div>
          <h3>Feature Under Development</h3>
          <p>
            The NeuraOne desktop application is currently under active development and will be announced in a few days.
            Sign up or log in to get notified when it's ready!
          </p>
          <div className="notice-platforms">
            <div className="platform-badge">🪟 Windows — Coming Soon</div>
            <div className="platform-badge">🍎 macOS — Coming Soon</div>
            <div className="platform-badge">🐧 Linux — Coming Soon</div>
          </div>
          <Link to="/login" className="btn-primary" style={{ display: 'inline-block', marginTop: '1.5rem' }}>
            🔔 Get Notified on Launch
          </Link>
        </div>
      </div>
    </section>
  )
}
