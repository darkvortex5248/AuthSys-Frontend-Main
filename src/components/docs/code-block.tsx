'use client'

import { useState } from 'react'
import { useCopy } from '@/components/ui/copy-dialog'
import { Check, Copy, Terminal } from 'lucide-react'

type CodeBlockProps = {
  code: string
  lang?: string
  title?: string
  showLineNumbers?: boolean
}

export function CodeBlock({
  code,
  lang,
  title,
  showLineNumbers = true,
}: CodeBlockProps) {
  const copy = useCopy()
  const [copied, setCopied] = useState(false)
  const lines = code.trimEnd().split('\n')

  const handleCopy = async () => {
    await copy(code, { label: 'Code copied' })
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group relative my-8 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)]">
      {(title || lang) && (
        <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg-base)]/50 px-5 py-2.5">
          <div className="flex items-center gap-3">
            {lang && (
              <span className="flex items-center gap-1.5 rounded-md bg-[var(--primary)]/10 px-2 py-0.5 text-[11px] font-semibold text-[var(--primary)]">
                <Terminal className="h-3 w-3" />
                {lang}
              </span>
            )}
            {title && (
              <span className="text-xs text-[var(--color-text-muted)]">
                {title}
              </span>
            )}
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-[var(--color-text-muted)] transition-all duration-200 hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      )}
      <div className="relative">
        {!title && !lang && (
          <button
            onClick={handleCopy}
            className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-text-muted)] opacity-0 transition-all duration-200 hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)] group-hover:opacity-100"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="group/line">
                  {showLineNumbers && (
                    <td className="select-none border-r border-[var(--color-border)] px-4 py-0 text-right text-[11px] leading-6 text-[var(--color-text-muted)]/40">
                      {i + 1}
                    </td>
                  )}
                  <td className="px-4 py-0 leading-6">
                    <code className="font-mono text-sm leading-6 text-[var(--color-text-primary)]">
                      {line || ' '}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.03]" />
    </div>
  )
}
