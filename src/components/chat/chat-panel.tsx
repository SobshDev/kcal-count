import { useMemo, useState } from 'react'
import {
  AuthLoading,
  Authenticated,
  Unauthenticated,
  useAction,
  useMutation,
  useQuery,
} from 'convex/react'
import { SignInButton } from '@clerk/tanstack-react-start'
import {
  AlertCircle,
  ArrowUp,
  History,
  MessageSquarePlus,
  Sparkles,
  Trash2,
} from 'lucide-react'

import { api } from '../../../convex/_generated/api'
import type { Doc, Id } from '../../../convex/_generated/dataModel'
import { ChatMarkdown } from '@/components/chat/chat-markdown'
import { Button } from '@/components/ui/button'
import { Bubble, BubbleContent } from '@/components/ui/bubble'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/ui/input-group'
import { Marker, MarkerContent, MarkerIcon } from '@/components/ui/marker'
import { Message, MessageContent } from '@/components/ui/message'
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/ui/message-scroller'
import { Spinner } from '@/components/ui/spinner'
import { getChatErrorMessage } from '@/lib/chat-error'

// Full answers read far better as markdown, so request the ceiling the backend
// allows (DEFAULT_MAX_OUTPUT_TOKENS is only 512).
const CHAT_MAX_OUTPUT_TOKENS = 2_048

const SUGGESTIONS = [
  'How am I tracking toward my goals today?',
  'What should I eat for dinner?',
  'Suggest a high-protein snack',
  'Review my week',
]

export function ChatPanel() {
  return (
    <>
      <Authenticated>
        <Conversation />
      </Authenticated>
      <Unauthenticated>
        <SignedOut />
      </Unauthenticated>
      <AuthLoading>
        <CenteredSpinner />
      </AuthLoading>
    </>
  )
}

function Conversation() {
  const chats = useQuery(api.chats.list)
  const [chatId, setChatId] = useState<Id<'chats'> | null>(null)
  const messages = useQuery(api.chats.messages, chatId ? { chatId } : 'skip')
  const createChat = useMutation(api.chats.create)
  const removeChat = useMutation(api.chats.remove)
  const sendMessage = useAction(api.ai.sendChatMessage)

  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  )

  const currentChat = chatId
    ? chats?.find((chat) => chat._id === chatId)
    : undefined
  const streaming =
    messages?.some(
      (message) =>
        message.status === 'pending' || message.status === 'streaming',
    ) ?? false
  const busy = isSending || streaming
  const hasMessages = (messages?.length ?? 0) > 0

  async function submit(rawContent: string) {
    const content = rawContent.trim()
    if (!content || busy) return
    setError(null)
    setInput('')
    setIsSending(true)
    try {
      let id = chatId
      if (!id) {
        id = await createChat({})
        setChatId(id)
      }
      await sendMessage({
        chatId: id,
        content,
        timezone,
        maxOutputTokens: CHAT_MAX_OUTPUT_TOKENS,
      })
    } catch (caught) {
      setError(getChatErrorMessage(caught))
      setInput(content)
    } finally {
      setIsSending(false)
    }
  }

  function startNewChat() {
    if (busy) return
    setChatId(null)
    setInput('')
    setError(null)
  }

  async function deleteChat(id: Id<'chats'>) {
    try {
      await removeChat({ chatId: id })
      if (id === chatId) startNewChat()
    } catch (caught) {
      setError(getChatErrorMessage(caught))
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void submit(input)
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <header className="flex items-center justify-between gap-3 pb-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <Sparkles className="size-4 text-white/80" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white/85">
              {currentChat?.title ?? 'Nutrition coach'}
            </p>
            <p className="truncate text-xs text-white/40">
              Personalized to your logged data
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {currentChat ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void deleteChat(currentChat._id)}
              aria-label="Delete conversation"
              className="text-white/50 hover:bg-white/10 hover:text-white"
            >
              <Trash2 aria-hidden="true" />
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={startNewChat}
            disabled={busy}
            className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <MessageSquarePlus data-icon="inline-start" aria-hidden="true" />
            New chat
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Conversation history"
                className="text-white/60 hover:bg-white/10 hover:text-white"
              >
                <History aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="dark max-h-80 w-72 overflow-y-auto"
            >
              <DropdownMenuLabel>Recent conversations</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {chats === undefined ? (
                <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                  Loading…
                </p>
              ) : chats.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                  No conversations yet
                </p>
              ) : (
                chats.map((chat) => (
                  <DropdownMenuItem
                    key={chat._id}
                    onSelect={() => setChatId(chat._id)}
                    className="flex-col items-start gap-0.5 data-[active=true]:bg-accent data-[active=true]:font-medium"
                    data-active={chat._id === chatId}
                  >
                    <span className="w-full truncate">{chat.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(chat.updatedAt)}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">
        {hasMessages && messages ? (
          <MessageScrollerProvider autoScroll defaultScrollPosition="end">
            <MessageScroller>
              <MessageScrollerViewport>
                <MessageScrollerContent className="px-1 pt-2 pb-4">
                  {messages.map((message) => (
                    <MessageRow key={message._id} message={message} />
                  ))}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>
        ) : chatId && messages === undefined ? (
          <CenteredSpinner />
        ) : (
          <EmptyState onPick={(text) => void submit(text)} disabled={busy} />
        )}
      </div>

      <div className="pt-3">
        {error ? (
          <div className="mb-2 flex items-start gap-2 px-1 text-sm text-[oklch(0.78_0.11_25)]">
            <AlertCircle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <span>{error}</span>
          </div>
        ) : null}
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void submit(input)
          }}
        >
          <InputGroup className="border-white/10 bg-white/[0.04] backdrop-blur-md">
            <InputGroupTextarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your meals, macros, or goals…"
              maxLength={24_000}
              rows={1}
              aria-label="Message the nutrition coach"
              className="max-h-40 min-h-[2.75rem] text-white placeholder:text-white/40"
            />
            <InputGroupAddon align="block-end" className="gap-2">
              <span className="text-xs text-white/35">
                Enter to send · Shift + Enter for a new line
              </span>
              <InputGroupButton
                type="submit"
                variant="default"
                size="icon-sm"
                disabled={!input.trim() || busy}
                aria-label="Send message"
                className="ml-auto"
              >
                {busy ? (
                  <Spinner className="text-primary-foreground" />
                ) : (
                  <ArrowUp aria-hidden="true" />
                )}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>
        <p className="mt-2 px-1 text-center text-xs text-white/30">
          Coach gives estimates and can be wrong. Verify important details.
        </p>
      </div>
    </div>
  )
}

function MessageRow({ message }: { message: Doc<'chatMessages'> }) {
  const isUser = message.role === 'user'

  return (
    <MessageScrollerItem messageId={message._id} scrollAnchor={isUser}>
      <Message align={isUser ? 'end' : 'start'}>
        <MessageContent>
          {isUser ? (
            <Bubble variant="secondary" align="end">
              <BubbleContent className="whitespace-pre-wrap">
                {message.content}
              </BubbleContent>
            </Bubble>
          ) : message.status === 'failed' ? (
            <AssistantError message={message} />
          ) : message.content ? (
            <ChatMarkdown content={message.content} />
          ) : (
            <ThinkingIndicator />
          )}
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  )
}

function ThinkingIndicator() {
  return (
    <Marker role="status">
      <MarkerIcon>
        <Spinner className="text-white/60" />
      </MarkerIcon>
      <MarkerContent className="shimmer text-white/70">Thinking…</MarkerContent>
    </Marker>
  )
}

function AssistantError({ message }: { message: Doc<'chatMessages'> }) {
  return (
    <div className="flex flex-col gap-2">
      {message.content ? <ChatMarkdown content={message.content} /> : null}
      <div className="flex items-start gap-2 rounded-2xl border border-[oklch(0.5_0.11_25/0.35)] bg-[oklch(0.5_0.11_25/0.12)] px-3 py-2 text-sm text-[oklch(0.82_0.1_25)]">
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          {message.error?.trim()
            ? getChatErrorMessage(message.error)
            : 'Something went wrong. Please try again.'}
        </span>
      </div>
    </div>
  )
}

function EmptyState({
  onPick,
  disabled,
}: {
  onPick: (text: string) => void
  disabled: boolean
}) {
  return (
    <div className="flex h-full items-center justify-center">
      <Empty className="border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="bg-white/10 text-white">
            <Sparkles aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle className="text-white">Your nutrition coach</EmptyTitle>
          <EmptyDescription className="text-white/55">
            Ask about meals, macros, and progress. Answers use your logged data,
            targets, and recent trends.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => onPick(suggestion)}
                className="border-white/15 bg-white/[0.03] text-white/80 hover:bg-white/10 hover:text-white"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </EmptyContent>
      </Empty>
    </div>
  )
}

function CenteredSpinner() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner className="size-5 text-white/40" />
    </div>
  )
}

function SignedOut() {
  return (
    <div className="flex h-full items-center justify-center">
      <Empty className="border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="bg-white/10 text-white">
            <Sparkles aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle className="text-white">Sign in to chat</EmptyTitle>
          <EmptyDescription className="text-white/55">
            Your nutrition coach uses your private data, so you need an account
            to start a conversation.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <SignInButton mode="redirect">
            <Button>Sign in</Button>
          </SignInButton>
        </EmptyContent>
      </Empty>
    </div>
  )
}

function formatRelativeTime(timestamp: number) {
  const minutes = Math.round((Date.now() - timestamp) / 60_000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return `${Math.round(days / 7)}w ago`
}
