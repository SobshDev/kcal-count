import { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { cn } from '@/lib/utils'

/**
 * Renders an assistant message as GitHub-flavored markdown. The assistant is
 * shown as plain prose (no bubble), so styling lives here. Memoized on
 * `content` so streaming token updates don't re-render sibling messages, and
 * the prose theme is tuned to the app's translucent dark surface.
 */
export const ChatMarkdown = memo(function ChatMarkdown({
  content,
  className,
}: {
  content: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'prose prose-invert prose-sm max-w-none',
        'prose-headings:tracking-tight',
        'prose-a:font-medium prose-a:text-white prose-a:underline-offset-2',
        'prose-code:rounded-md prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-normal prose-code:before:content-none prose-code:after:content-none',
        'prose-pre:rounded-2xl prose-pre:border prose-pre:border-white/10 prose-pre:bg-black/30',
        'prose-hr:border-white/10',
        'prose-blockquote:border-l-white/20 prose-blockquote:font-normal prose-blockquote:not-italic',
        'prose-th:border-white/10 prose-td:border-white/10',
        '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node: _node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
})
