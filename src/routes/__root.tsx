import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { IdentityProvider } from '@/lib/identity-context'
import { CallbackHandler } from '@/components/CallbackHandler'
import { Header } from '@/components/Header'
import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'NeuraOne Ultimate AI Agent' },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <IdentityProvider>
          <CallbackHandler>
            <Header />
            {children}
            <Footer />
          </CallbackHandler>
        </IdentityProvider>
        <Scripts />
      </body>
    </html>
  )
}

function Footer() {
  const whatsappNumber = '917380783560'
  const whatsappMessage = encodeURIComponent(
    "Hi NeuraOne! I'd like to know more about your AI agent.",
  )
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-col footer-brand">
            <span className="footer-logo">⚡ NEURAONE</span>
            <p>The world's most advanced desktop AI agent.</p>
            <a
              className="footer-whatsapp"
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat with us on WhatsApp"
            >
              <span className="whatsapp-icon" aria-hidden="true">💬</span>
              <span className="whatsapp-text">
                <span className="whatsapp-label">Chat on WhatsApp</span>
                <span className="whatsapp-number">+91 73807 83560</span>
              </span>
            </a>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Our Services</h4>
            <ul className="footer-list">
              <li>Desktop AI Automation</li>
              <li>Voice & Text Control</li>
              <li>Content Generation</li>
              <li>Smart Workflow Automation</li>
              <li>Custom AI Agent Solutions</li>
              <li>Enterprise AI Integration</li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-list footer-list-links">
              <li><a href="/#home">Home</a></li>
              <li><a href="/#commands">What It Does</a></li>
              <li><a href="/#demo">Live Demo</a></li>
              <li><a href="/#download">Download</a></li>
              <li><a href="/faq">FAQ</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Visit Us</h4>
            <address className="footer-address">
              <strong>NeuraOne Technologies</strong><br />
              Mau, Uttar Pradesh<br />
              India — 221601
            </address>
            <a
              className="footer-directions"
              href="https://www.google.com/maps/search/?api=1&query=Mau+Uttar+Pradesh+221601+India"
              target="_blank"
              rel="noopener noreferrer"
            >
              📍 Get Directions
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-certified">
            <span className="footer-cert-badge">✓ CERTIFIED</span>
            <span className="footer-cert-text">CERTIFIED BY NEURAONE TECHNOLOGIES</span>
          </div>
          <div className="footer-copy">
            © 2025 NeuraOne Technologies. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}
