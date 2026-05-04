import { useMemo, useState } from 'react'

type MdBlock =
  | { type: 'code'; lang: string; code: string }
  | { type: 'heading'; level: number; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'hr' }

export function MarkdownRenderer({ text }: { text: string }) {
  const blocks = useMemo(() => parseMarkdown(text), [text])
  return (
    <div className="md">
      {blocks.map((b, i) => {
        if (b.type === 'code') return <CodeBlock key={i} lang={b.lang} code={b.code} />
        if (b.type === 'heading') {
          const Tag = `h${Math.min(b.level, 4)}` as 'h1' | 'h2' | 'h3' | 'h4'
          return <Tag key={i}>{renderInline(b.text)}</Tag>
        }
        if (b.type === 'list') {
          const ListTag = b.ordered ? 'ol' : 'ul'
          return (
            <ListTag key={i}>
              {b.items.map((it, j) => (
                <li key={j}>{renderInline(it)}</li>
              ))}
            </ListTag>
          )
        }
        if (b.type === 'quote') return <blockquote key={i}>{renderInline(b.text)}</blockquote>
        if (b.type === 'hr') return <hr key={i} />
        return (
          <p key={i} style={{ whiteSpace: 'pre-wrap' }}>
            {renderInline(b.text)}
          </p>
        )
      })}
    </div>
  )
}

export function parseMarkdown(input: string): MdBlock[] {
  const lines = input.split('\n')
  const out: MdBlock[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const fence = line.match(/^```(\w*)\s*$/)
    if (fence) {
      const lang = fence[1] || ''
      const codeLines: string[] = []
      i++
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        codeLines.push(lines[i])
        i++
      }
      i++
      out.push({ type: 'code', lang, code: codeLines.join('\n') })
      continue
    }
    if (/^---+\s*$/.test(line)) { out.push({ type: 'hr' }); i++; continue }
    const heading = line.match(/^(#{1,6})\s+(.+)$/)
    if (heading) { out.push({ type: 'heading', level: heading[1].length, text: heading[2] }); i++; continue }
    if (/^\s*>\s?/.test(line)) {
      const buf: string[] = []
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ''))
        i++
      }
      out.push({ type: 'quote', text: buf.join('\n') })
      continue
    }
    if (/^\s*[-*+]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line)
      const items: string[] = []
      while (
        i < lines.length &&
        ((ordered && /^\s*\d+\.\s+/.test(lines[i])) ||
          (!ordered && /^\s*[-*+]\s+/.test(lines[i])))
      ) {
        items.push(lines[i].replace(/^\s*(?:[-*+]|\d+\.)\s+/, ''))
        i++
      }
      out.push({ type: 'list', ordered, items })
      continue
    }
    if (line.trim() === '') { i++; continue }
    const paraLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^```/.test(lines[i]) &&
      !/^#{1,6}\s+/.test(lines[i]) &&
      !/^\s*>\s?/.test(lines[i]) &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i])
      i++
    }
    out.push({ type: 'paragraph', text: paraLines.join('\n') })
  }
  return out
}

export function renderInline(text: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = []
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(_[^_]+_)|(\[[^\]]+\]\([^)]+\))/g
  let last = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) tokens.push(text.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith('`')) {
      tokens.push(<code key={key++} className="md-inline-code">{tok.slice(1, -1)}</code>)
    } else if (tok.startsWith('**')) {
      tokens.push(<strong key={key++}>{tok.slice(2, -2)}</strong>)
    } else if (tok.startsWith('*') || tok.startsWith('_')) {
      tokens.push(<em key={key++}>{tok.slice(1, -1)}</em>)
    } else if (tok.startsWith('[')) {
      const match = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (match) {
        tokens.push(
          <a key={key++} href={match[2]} target="_blank" rel="noopener noreferrer">
            {match[1]}
          </a>
        )
      } else tokens.push(tok)
    } else tokens.push(tok)
    last = m.index + tok.length
  }
  if (last < text.length) tokens.push(text.slice(last))
  return tokens
}

export function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }
  return (
    <div className="md-code-block">
      <div className="md-code-bar">
        <span className="md-code-lang">{lang || 'code'}</span>
        <button className="md-code-copy" onClick={copy}>
          {copied ? '✓ copied' : '📋 copy'}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  )
}
