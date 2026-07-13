const TOKEN_EXHAUSTED_MESSAGE =
  'You don\u2019t have enough AI tokens left for this message. Try a shorter message or come back tomorrow.'

type ErrorData = {
  code?: unknown
  message?: unknown
}

export function getChatErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null) {
    const data = 'data' in error ? (error.data as ErrorData | null) : null

    if (data?.code === 'TOKENS_EXHAUSTED') {
      return TOKEN_EXHAUSTED_MESSAGE
    }
    if (typeof data?.message === 'string') {
      return mapChatErrorText(data.message)
    }
    if ('message' in error && typeof error.message === 'string') {
      return mapChatErrorText(error.message)
    }
  }

  if (typeof error === 'string') {
    return mapChatErrorText(error)
  }

  return 'Could not send your message. Please try again.'
}

function mapChatErrorText(message: string) {
  return message.includes('TOKENS_EXHAUSTED')
    ? TOKEN_EXHAUSTED_MESSAGE
    : message
}
