import { useEffect, useMemo, useRef, useState } from 'react'
import { chatWithAI } from '@/server/chat.functions'
import { MarkdownRenderer } from '@/components/Markdown'

function stripMarkdownForSpeech(text: string): string {
  let out = text
  out = out.replace(/```[\s\S]*?```/g, ' code block ')
  out = out.replace(/`([^`]+)`/g, '$1')
  out = out.replace(/^\s{0,3}#{1,6}\s+/gm, '')
  out = out.replace(/\*\*([^*]+)\*\*/g, '$1')
  out = out.replace(/\*([^*]+)\*/g, '$1')
  out = out.replace(/_([^_]+)_/g, '$1')
  out = out.replace(/^\s*[-*+]\s+/gm, '')
  out = out.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  return out
}

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  time: string
}

type LanguageOption = {
  code: string
  label: string
  native: string
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en-US', label: 'English (US)', native: 'English' },
  { code: 'en-GB', label: 'English (UK)', native: 'English' },
  { code: 'en-IN', label: 'English (India)', native: 'English' },
  { code: 'en-AU', label: 'English (Australia)', native: 'English' },
  { code: 'hi-IN', label: 'Hindi', native: 'हिन्दी' },
  { code: 'gu-IN', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'bn-IN', label: 'Bengali', native: 'বাংলা' },
  { code: 'ta-IN', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te-IN', label: 'Telugu', native: 'తెలుగు' },
  { code: 'mr-IN', label: 'Marathi', native: 'मराठी' },
  { code: 'kn-IN', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml-IN', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa-IN', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'ur-PK', label: 'Urdu', native: 'اردو' },
  { code: 'es-ES', label: 'Spanish (Spain)', native: 'Español' },
  { code: 'es-MX', label: 'Spanish (Mexico)', native: 'Español' },
  { code: 'fr-FR', label: 'French', native: 'Français' },
  { code: 'fr-CA', label: 'French (Canada)', native: 'Français' },
  { code: 'de-DE', label: 'German', native: 'Deutsch' },
  { code: 'it-IT', label: 'Italian', native: 'Italiano' },
  { code: 'pt-BR', label: 'Portuguese (Brazil)', native: 'Português' },
  { code: 'pt-PT', label: 'Portuguese (Portugal)', native: 'Português' },
  { code: 'ru-RU', label: 'Russian', native: 'Русский' },
  { code: 'uk-UA', label: 'Ukrainian', native: 'Українська' },
  { code: 'pl-PL', label: 'Polish', native: 'Polski' },
  { code: 'nl-NL', label: 'Dutch', native: 'Nederlands' },
  { code: 'sv-SE', label: 'Swedish', native: 'Svenska' },
  { code: 'da-DK', label: 'Danish', native: 'Dansk' },
  { code: 'no-NO', label: 'Norwegian', native: 'Norsk' },
  { code: 'fi-FI', label: 'Finnish', native: 'Suomi' },
  { code: 'cs-CZ', label: 'Czech', native: 'Čeština' },
  { code: 'sk-SK', label: 'Slovak', native: 'Slovenčina' },
  { code: 'hu-HU', label: 'Hungarian', native: 'Magyar' },
  { code: 'ro-RO', label: 'Romanian', native: 'Română' },
  { code: 'el-GR', label: 'Greek', native: 'Ελληνικά' },
  { code: 'tr-TR', label: 'Turkish', native: 'Türkçe' },
  { code: 'ar-SA', label: 'Arabic', native: 'العربية' },
  { code: 'he-IL', label: 'Hebrew', native: 'עברית' },
  { code: 'fa-IR', label: 'Persian', native: 'فارسی' },
  { code: 'ja-JP', label: 'Japanese', native: '日本語' },
  { code: 'ko-KR', label: 'Korean', native: '한국어' },
  { code: 'zh-CN', label: 'Chinese (Mandarin)', native: '中文' },
  { code: 'zh-TW', label: 'Chinese (Taiwan)', native: '中文' },
  { code: 'zh-HK', label: 'Chinese (Cantonese)', native: '粵語' },
  { code: 'th-TH', label: 'Thai', native: 'ไทย' },
  { code: 'vi-VN', label: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'id-ID', label: 'Indonesian', native: 'Bahasa Indonesia' },
  { code: 'ms-MY', label: 'Malay', native: 'Bahasa Melayu' },
  { code: 'fil-PH', label: 'Filipino', native: 'Filipino' },
  { code: 'sw-KE', label: 'Swahili', native: 'Kiswahili' },
  { code: 'af-ZA', label: 'Afrikaans', native: 'Afrikaans' },
]

type Gender = 'all' | 'female' | 'male'

const FEMALE_HINTS = [
  'female', 'woman', 'girl', 'samantha', 'victoria', 'karen', 'tessa', 'fiona',
  'moira', 'allison', 'ava', 'susan', 'zira', 'hazel', 'eva', 'amelie', 'audrey',
  'aurelie', 'anna', 'milena', 'alice', 'ellen', 'kyoko', 'mariska', 'paulina',
  'satu', 'sara', 'sin-ji', 'ting-ting', 'yuna', 'zuzana', 'monica', 'luciana',
  'joana', 'rishi', 'helena', 'laila', 'maja', 'nora', 'serena', 'siri', 'cortana',
]
const MALE_HINTS = [
  'male', 'man', 'boy', 'daniel', 'tom', 'fred', 'alex', 'aaron', 'nicolas',
  'thomas', 'jorge', 'diego', 'felipe', 'rishi', 'mark', 'david', 'george',
  'arthur', 'oliver', 'reed', 'rocko', 'grandpa', 'eddy', 'guido', 'luca',
  'maged', 'majed', 'milos', 'otoya', 'pavel', 'xander', 'yuri',
]

function detectGender(voice: SpeechSynthesisVoice): Gender {
  const name = voice.name.toLowerCase()
  if (FEMALE_HINTS.some((h) => name.includes(h))) return 'female'
  if (MALE_HINTS.some((h) => name.includes(h))) return 'male'
  return 'all'
}

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null
  onerror: ((event: unknown) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

export function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "👋 Hi! I'm NeuraOne AI. Talk or type to me in any language — I'll reply and even speak back. Try the 🎙 mic button!",
      time: now(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [language, setLanguage] = useState<string>('en-US')
  const [autoSpeak, setAutoSpeak] = useState<boolean>(true)
  const [genderFilter, setGenderFilter] = useState<Gender>('all')
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceURI, setVoiceURI] = useState<string>('')
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [recogError, setRecogError] = useState<string>('')

  const chatRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages, loading])

  // Load voices (re-runs when browser fires voiceschanged)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const load = () => {
      const list = window.speechSynthesis.getVoices()
      setVoices(list)
    }
    load()
    window.speechSynthesis.onvoiceschanged = load
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  // Build voice list filtered by selected language
  const langVoices = useMemo(() => {
    const langPrefix = language.split('-')[0].toLowerCase()
    const matches = voices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix))
    return matches.length ? matches : voices
  }, [voices, language])

  // Apply gender filter
  const filteredVoices = useMemo(() => {
    if (genderFilter === 'all') return langVoices
    return langVoices.filter((v) => detectGender(v) === genderFilter)
  }, [langVoices, genderFilter])

  // Pick a default voice when filters change and current pick is invalid
  useEffect(() => {
    if (filteredVoices.length === 0) return
    if (!filteredVoices.some((v) => v.voiceURI === voiceURI)) {
      setVoiceURI(filteredVoices[0].voiceURI)
    }
  }, [filteredVoices, voiceURI])

  const speechSupported = typeof window !== 'undefined' && !!getSpeechRecognition()
  const synthSupported = typeof window !== 'undefined' && !!window.speechSynthesis

  const speak = (text: string) => {
    if (!synthSupported) return
    try {
      window.speechSynthesis.cancel()
      const utter = new SpeechSynthesisUtterance(text)
      const voice = voices.find((v) => v.voiceURI === voiceURI)
      if (voice) utter.voice = voice
      utter.lang = voice?.lang || language
      utter.rate = 1
      utter.pitch = 1
      utter.onstart = () => setSpeaking(true)
      utter.onend = () => setSpeaking(false)
      utter.onerror = () => setSpeaking(false)
      window.speechSynthesis.speak(utter)
    } catch {
      setSpeaking(false)
    }
  }

  const stopSpeaking = () => {
    if (!synthSupported) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }

  const send = async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    const userMsg: ChatMessage = { role: 'user', content: msg, time: now() }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)
    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }))
      const { reply } = await chatWithAI({ data: { message: msg, history } })
      setMessages((prev) => [...prev, { role: 'assistant', content: reply, time: now() }])
      if (autoSpeak) speak(stripMarkdownForSpeech(reply))
    } catch {
      const fallback = "⚠️ Sorry, I couldn't connect right now. Please try again in a moment."
      setMessages((prev) => [...prev, { role: 'assistant', content: fallback, time: now() }])
    } finally {
      setLoading(false)
    }
  }

  const toggleListening = () => {
    setRecogError('')
    const Ctor = getSpeechRecognition()
    if (!Ctor) {
      setRecogError('Voice input is not supported in this browser. Try Chrome or Edge.')
      return
    }
    if (listening) {
      recognitionRef.current?.stop()
      return
    }
    const recognition = new Ctor()
    recognition.lang = language
    recognition.interimResults = false
    recognition.continuous = false

    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1]
      const transcript = last[0].transcript.trim()
      if (transcript) {
        setInput('')
        send(transcript)
      }
    }
    recognition.onerror = () => {
      setRecogError("Couldn't capture audio. Check microphone permission.")
      setListening(false)
    }
    recognition.onend = () => {
      setListening(false)
    }
    recognitionRef.current = recognition
    try {
      recognition.start()
      setListening(true)
    } catch {
      setListening(false)
    }
  }

  const clearChat = () => {
    stopSpeaking()
    setMessages([{ role: 'assistant', content: '👋 Chat cleared! Ask me anything.', time: now() }])
  }

  const quickCmds = ['What can you do?', 'Tell me a fun fact', 'Write a Python hello world', 'Who made you?']

  // Group voices by detected gender for display
  const femaleCount = filteredVoices.filter((v) => detectGender(v) === 'female').length
  const maleCount = filteredVoices.filter((v) => detectGender(v) === 'male').length

  return (
    <div className="demo-chat-box">
      <div className="demo-chat-header">
        <div className="demo-chat-status">
          <span className="status-dot" />NeuraOne AI · Online
          {speaking && <span className="speaking-indicator">🔊 Speaking</span>}
          {listening && <span className="listening-indicator">🎙 Listening…</span>}
        </div>
        <div className="demo-chat-actions">
          <button
            className={`demo-icon-btn ${autoSpeak ? 'active' : ''}`}
            title={autoSpeak ? 'Auto-speak: ON' : 'Auto-speak: OFF'}
            onClick={() => {
              if (autoSpeak) stopSpeaking()
              setAutoSpeak((v) => !v)
            }}
          >
            {autoSpeak ? '🔊' : '🔇'}
          </button>
          <button
            className={`demo-icon-btn ${showSettings ? 'active' : ''}`}
            title="Voice settings"
            onClick={() => setShowSettings((v) => !v)}
          >
            ⚙️
          </button>
          <button className="demo-clear-btn" onClick={clearChat}>🗑 Clear</button>
        </div>
      </div>

      {showSettings && (
        <div className="demo-settings-panel">
          <div className="settings-row">
            <label className="settings-label">🌍 Language</label>
            <select
              className="settings-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label} — {l.native}
                </option>
              ))}
            </select>
          </div>

          <div className="settings-row">
            <label className="settings-label">👤 Voice gender</label>
            <div className="gender-toggle">
              {(['all', 'female', 'male'] as Gender[]).map((g) => (
                <button
                  key={g}
                  className={`gender-btn ${genderFilter === g ? 'active' : ''}`}
                  onClick={() => setGenderFilter(g)}
                >
                  {g === 'all' ? 'All' : g === 'female' ? '♀ Female' : '♂ Male'}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-row">
            <label className="settings-label">🎤 Voice ({filteredVoices.length})</label>
            <select
              className="settings-select"
              value={voiceURI}
              onChange={(e) => setVoiceURI(e.target.value)}
              disabled={filteredVoices.length === 0}
            >
              {filteredVoices.length === 0 && <option value="">No voices match — try changing language or gender</option>}
              {filteredVoices.map((v) => {
                const g = detectGender(v)
                const tag = g === 'female' ? '♀' : g === 'male' ? '♂' : '•'
                return (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {tag} {v.name} ({v.lang}){v.localService ? '' : ' ☁︎'}
                  </option>
                )
              })}
            </select>
          </div>

          <div className="settings-info">
            {voices.length > 0
              ? `${voices.length} system voices available · ${femaleCount} female · ${maleCount} male in current filter`
              : 'Loading voices…'}
          </div>

          <div className="settings-actions">
            <button
              className="settings-test-btn"
              onClick={() =>
                speak(
                  language.startsWith('hi') ? 'नमस्ते! मैं न्यूराओन एआई हूँ।'
                  : language.startsWith('es') ? '¡Hola! Soy NeuraOne AI.'
                  : language.startsWith('fr') ? "Bonjour ! Je suis NeuraOne AI."
                  : language.startsWith('de') ? 'Hallo! Ich bin NeuraOne AI.'
                  : language.startsWith('ja') ? 'こんにちは。NeuraOne AIです。'
                  : language.startsWith('zh') ? '你好，我是 NeuraOne AI。'
                  : language.startsWith('ar') ? 'مرحبا، أنا نيوراون الذكاء الاصطناعي.'
                  : 'Hi, I am NeuraOne AI. How can I help you today?',
                )
              }
              disabled={!synthSupported || filteredVoices.length === 0}
            >
              ▶ Test voice
            </button>
            {speaking && (
              <button className="settings-test-btn stop" onClick={stopSpeaking}>
                ⏹ Stop
              </button>
            )}
          </div>
        </div>
      )}

      <div className="demo-chat-messages" ref={chatRef}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role}`}>
            <div className="chat-avatar">{m.role === 'user' ? '👤' : '🤖'}</div>
            <div className="chat-bubble">
              {m.role === 'assistant' ? (
                <MarkdownRenderer text={m.content} />
              ) : (
                <p style={{ whiteSpace: 'pre-wrap' }}>{m.content}</p>
              )}
              <div className="chat-bubble-foot">
                <span className="chat-time">{m.time}</span>
                {m.role === 'assistant' && synthSupported && (
                  <button
                    className="chat-replay-btn"
                    title="Replay this message"
                    onClick={() => speak(stripMarkdownForSpeech(m.content))}
                  >
                    🔊
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-msg assistant">
            <div className="chat-avatar">🤖</div>
            <div className="chat-bubble"><p className="typing-dots">Thinking…</p></div>
          </div>
        )}
      </div>

      <div className="demo-quick-cmds">
        {quickCmds.map((q) => (
          <button key={q} className="quick-cmd" onClick={() => send(q)}>{q}</button>
        ))}
      </div>

      {recogError && <div className="demo-error">{recogError}</div>}

      <div className="demo-input-row">
        <button
          className={`demo-mic-btn ${listening ? 'recording' : ''}`}
          onClick={toggleListening}
          disabled={loading || !speechSupported}
          title={speechSupported ? (listening ? 'Stop listening' : 'Speak') : 'Voice input not supported here'}
        >
          {listening ? '⏹' : '🎙'}
        </button>
        <input
          className="demo-input"
          placeholder={listening ? 'Listening… speak now' : 'Ask NeuraOne AI anything…'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          disabled={loading}
        />
        <button
          className="demo-send-btn"
          onClick={() => send()}
          disabled={loading || !input.trim()}
        >
          ➤
        </button>
      </div>
    </div>
  )
}
