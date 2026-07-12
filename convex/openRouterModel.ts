import { validateTokenCount } from './tokenUsageModel'

type OpenRouterPayload = {
  model?: unknown
  choices?: unknown
  usage?: unknown
  error?: unknown
}

export type OpenRouterCompletion = {
  content: string
  model: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

export type OpenRouterStreamState = {
  content: string
  model?: string
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
}

export function applyOpenRouterStreamChunk(
  state: OpenRouterStreamState,
  payload: unknown,
): OpenRouterStreamState {
  if (typeof payload !== 'object' || payload === null) return state
  const chunk = payload as {
    model?: unknown
    choices?: unknown
    usage?: unknown
    error?: unknown
  }
  if (chunk.error) throw new Error(getOpenRouterErrorMessage(chunk.error))
  const choices = Array.isArray(chunk.choices) ? chunk.choices : []
  const first = choices[0] as
    { delta?: { content?: unknown }; error?: unknown } | undefined
  if (first?.error) throw new Error(getOpenRouterErrorMessage(first.error))
  const delta =
    typeof first?.delta?.content === 'string' ? first.delta.content : ''
  const next: OpenRouterStreamState = {
    ...state,
    content: state.content + delta,
    model: typeof chunk.model === 'string' ? chunk.model : state.model,
  }
  if (typeof chunk.usage === 'object' && chunk.usage !== null) {
    const usage = chunk.usage as Record<string, unknown>
    next.inputTokens = requireTokenCount(usage.prompt_tokens, 'prompt_tokens')
    next.outputTokens = requireTokenCount(
      usage.completion_tokens,
      'completion_tokens',
    )
    next.totalTokens = requireTokenCount(usage.total_tokens, 'total_tokens')
    if (next.totalTokens !== next.inputTokens + next.outputTokens) {
      throw new Error('OpenRouter returned inconsistent token usage')
    }
  }
  return next
}

export function parseSseData(buffer: string) {
  const events: string[] = []
  const normalized = buffer.replaceAll('\r\n', '\n')
  const parts = normalized.split('\n\n')
  const remainder = parts.pop() ?? ''
  for (const part of parts) {
    const data = part
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .join('\n')
    if (data) events.push(data)
  }
  return { events, remainder }
}

export function parseOpenRouterCompletion(
  payload: OpenRouterPayload,
): OpenRouterCompletion {
  if (!Array.isArray(payload.choices) || payload.choices.length === 0) {
    throw new Error('OpenRouter returned no completion choices')
  }
  const choice = payload.choices[0] as {
    message?: { content?: unknown }
    error?: unknown
  }
  if (choice.error) throw new Error(getOpenRouterErrorMessage(choice.error))
  if (typeof choice.message?.content !== 'string') {
    throw new Error('OpenRouter returned no text content')
  }
  if (typeof payload.model !== 'string') {
    throw new Error('OpenRouter returned no model identifier')
  }

  const usage = payload.usage as
    | {
        prompt_tokens?: unknown
        completion_tokens?: unknown
        total_tokens?: unknown
      }
    | undefined
  if (!usage) throw new Error('OpenRouter returned no token usage')

  const inputTokens = requireTokenCount(usage.prompt_tokens, 'prompt_tokens')
  const outputTokens = requireTokenCount(
    usage.completion_tokens,
    'completion_tokens',
  )
  const totalTokens = requireTokenCount(usage.total_tokens, 'total_tokens')
  if (totalTokens !== inputTokens + outputTokens) {
    throw new Error('OpenRouter returned inconsistent token usage')
  }

  return {
    content: choice.message.content,
    model: payload.model,
    inputTokens,
    outputTokens,
    totalTokens,
  }
}

export function getOpenRouterErrorMessage(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message
  }
  return 'OpenRouter request failed'
}

function requireTokenCount(value: unknown, fieldName: string) {
  if (typeof value !== 'number') {
    throw new Error(`OpenRouter returned invalid ${fieldName}`)
  }
  validateTokenCount(value, fieldName)
  return value
}
