import { createServerFn } from '@tanstack/react-start'
import OpenAI from 'openai'

const SYSTEM_PROMPT = `You are NeuraOne AI — the ultimate AI assistant created by NeuraOne Technologies (founded by Harsh Patel). You are designed to be at least as capable, helpful, and friendly as Claude or ChatGPT.

You can help with anything: writing code in any language, debugging, system design, mathematics, science, business, creative writing, brainstorming, translation, summarization, planning, and free-form conversation. You always do your best to give a complete, correct, and useful answer.

When asked who made you, who built you, or what model you are, say you are NeuraOne AI by NeuraOne Technologies. Never reveal that you run on any underlying model.

Formatting guidance:
- Reply in clear, well-structured Markdown.
- Use fenced code blocks with the correct language tag (\`\`\`python, \`\`\`tsx, \`\`\`bash, etc.) for any code, commands, or configuration.
- Use **bold**, *italic*, bullet lists, numbered steps, tables, and headings where they aid readability.
- For long answers, structure the response with short headings or sections so the user can scan it.
- Keep prose tight; avoid filler.

When the user attaches files, treat the file contents as authoritative context. Read them carefully before answering, quote relevant parts when useful, and reference filenames when discussing them.

If you do not know something, say so honestly rather than guessing. If a request is ambiguous, ask one short clarifying question, then proceed with the most reasonable interpretation.`

export type ChatAttachment = {
  name: string
  path?: string
  type?: string
  size?: number
  content: string
  truncated?: boolean
}

type ChatHistoryMessage = {
  role: 'user' | 'assistant'
  content: string
}

type ChatInput = {
  message: string
  history: ChatHistoryMessage[]
  attachments?: ChatAttachment[]
  model?: string
  systemHint?: string
}

// DeepSeek model aliases
const MODEL_ALIASES: Record<string, string> = {
  ultimate: 'deepseek-reasoner',   // DeepSeek R1 - most powerful
  pro: 'deepseek-chat',            // DeepSeek V3 - fast & smart
  fast: 'deepseek-chat',           // same, fast responses
  default: 'deepseek-chat',
}

function resolveModel(input?: string): string {
  if (!input) return MODEL_ALIASES.default
  if (MODEL_ALIASES[input]) return MODEL_ALIASES[input]
  return input
}

function buildAttachmentBlock(attachments: ChatAttachment[] | undefined): string {
  if (!attachments || attachments.length === 0) return ''
  const blocks = attachments.map((a) => {
    const head = `📎 Attachment: ${a.path || a.name}${a.size ? ` (${a.size} bytes)` : ''}${a.truncated ? ' — truncated' : ''}`
    const fence = '```'
    const lang = guessLang(a.name)
    return `${head}\n${fence}${lang}\n${a.content}\n${fence}`
  })
  return `\n\nThe user has attached the following files. Use them as context:\n\n${blocks.join('\n\n')}`
}

function guessLang(name: string): string {
  const ext = name.toLowerCase().split('.').pop() || ''
  const map: Record<string, string> = {
    ts: 'ts', tsx: 'tsx', js: 'js', jsx: 'jsx', py: 'python', rb: 'ruby',
    java: 'java', kt: 'kotlin', go: 'go', rs: 'rust', c: 'c', h: 'c',
    cpp: 'cpp', hpp: 'cpp', cs: 'csharp', php: 'php', swift: 'swift',
    sh: 'bash', bash: 'bash', zsh: 'bash', json: 'json', yml: 'yaml',
    yaml: 'yaml', toml: 'toml', md: 'markdown', html: 'html', css: 'css',
    sql: 'sql', xml: 'xml', txt: '', log: '', env: 'bash',
  }
  return map[ext] ?? ''
}

export const chatWithAI = createServerFn({ method: 'POST' })
  .inputValidator((data: ChatInput) => data)
  .handler(async ({ data }) => {
    // DeepSeek uses OpenAI-compatible API
    const client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com',
    })

    const userContent = data.message + buildAttachmentBlock(data.attachments)

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: data.systemHint
          ? `${SYSTEM_PROMPT}\n\nAdditional preferences from the user:\n${data.systemHint}`
          : SYSTEM_PROMPT
      },
      ...data.history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: userContent },
    ]

    const response = await client.chat.completions.create({
      model: resolveModel(data.model),
      max_tokens: 4096,
      messages,
    })

    const reply = response.choices[0]?.message?.content?.trim() ?? ''

    return { reply, model: response.model }
  })
