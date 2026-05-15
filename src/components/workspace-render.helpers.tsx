'use client'

import type { ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'

export const renderMarkdown = (content: string) => (
  <div className="space-y-3 text-gray-100/90 leading-relaxed">
    <ReactMarkdown
      components={{
        h1: ({ children }: { children?: ReactNode }) => <h1 className="text-xl font-semibold text-white">{children}</h1>,
        h2: ({ children }: { children?: ReactNode }) => <h2 className="text-lg font-semibold text-white">{children}</h2>,
        h3: ({ children }: { children?: ReactNode }) => <h3 className="text-base font-semibold text-white">{children}</h3>,
        p: ({ children }: { children?: ReactNode }) => <p className="text-gray-100/90">{children}</p>,
        strong: ({ children }: { children?: ReactNode }) => <strong className="text-cyan-200">{children}</strong>,
        em: ({ children }: { children?: ReactNode }) => <em className="text-cyan-100">{children}</em>,
        ul: ({ children }: { children?: ReactNode }) => <ul className="list-disc list-inside space-y-1">{children}</ul>,
        ol: ({ children }: { children?: ReactNode }) => <ol className="list-decimal list-inside space-y-1">{children}</ol>,
        li: ({ children }: { children?: ReactNode }) => <li className="text-gray-100/90">{children}</li>,
        hr: () => <hr className="border-white/10" />,
      }}
    >
      {content || ''}
    </ReactMarkdown>
  </div>
)

export const renderSmartValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return <span className="text-gray-100/80">—</span>
  }
  if (Array.isArray(value)) {
    return (
      <ul className="mt-2 list-disc list-outside pl-5 space-y-2 text-gray-100/90">
        {value.map((item, index) => (
          <li key={`value-${index}`} className="leading-relaxed marker:text-cyan-200">
            {typeof item === 'string' ? (
              <span className="block">{item}</span>
            ) : (
              <pre className="text-xs text-gray-100/90 whitespace-pre-wrap">{JSON.stringify(item, null, 2)}</pre>
            )}
          </li>
        ))}
      </ul>
    )
  }
  if (typeof value === 'string') {
    return <div className="mt-2">{renderMarkdown(value)}</div>
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return <span className="text-gray-100/90">{String(value)}</span>
  }
  return <pre className="text-xs text-gray-100/90 whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
}

export const renderCompactList = (
  items: string[],
  key: string,
  emptyText: string,
  expandedTextBlocks: Record<string, boolean>,
  toggleTextBlock: (key: string) => void,
  colorClass = 'text-gray-100',
) => {
  const values = (Array.isArray(items) ? items : []).map((item) => String(item).trim()).filter(Boolean)
  if (!values.length) {
    return <p className="text-xs text-gray-300">{emptyText}</p>
  }

  const expanded = !!expandedTextBlocks[key]
  const visible = expanded ? values : values.slice(0, 4)

  return (
    <div>
      <ul className={`list-disc list-inside space-y-1 text-xs ${colorClass}`}>
        {visible.map((item, index) => (
          <li key={`${key}-${index}`} className="leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
      {values.length > 4 && (
        <button onClick={() => toggleTextBlock(key)} className="mt-2 cyber-outline text-[10px] px-2 py-1 rounded-full">
          {expanded ? 'Show fewer' : `Show ${values.length - 4} more`}
        </button>
      )}
    </div>
  )
}

export const renderCollapsibleMarkdown = (
  text: string,
  key: string,
  expandedTextBlocks: Record<string, boolean>,
  toggleTextBlock: (key: string) => void,
  collapsedHeight = 'max-h-24',
) => {
  const normalized = (text || '').trim()
  if (!normalized) return null
  const isLong = normalized.length > 260
  const expanded = !!expandedTextBlocks[key]

  return (
    <div>
      <div className={`${!expanded && isLong ? `${collapsedHeight} overflow-hidden` : ''} text-gray-100/95 leading-relaxed`}>
        {renderMarkdown(normalized)}
      </div>
      {isLong && (
        <button onClick={() => toggleTextBlock(key)} className="mt-2 cyber-outline text-[10px] px-2 py-1 rounded-full">
          {expanded ? 'Show less' : 'Show full'}
        </button>
      )}
    </div>
  )
}

export const renderOutlinePointSection = (
  label: string,
  items: string[] | undefined,
  key: string,
  expandedTextBlocks: Record<string, boolean>,
  toggleTextBlock: (key: string) => void,
  colorClass = 'text-gray-200',
  onItemClick?: (value: string) => void,
) => {
  const values = (Array.isArray(items) ? items : []).map((item: string) => String(item).trim()).filter(Boolean)
  if (!values.length) return null

  return (
    <div className="mt-3">
      <p className="text-[10px] uppercase tracking-widest text-cyan-300/90 mb-2">{label}</p>
      {onItemClick ? (
        <div className="flex flex-wrap gap-2">
          {values.map((item, index) => (
            <button
              key={`${key}-${index}`}
              onClick={() => onItemClick(item)}
              className="text-xs px-2 py-1 rounded-full border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/10"
            >
              {item}
            </button>
          ))}
        </div>
      ) : (
        renderCompactList(values, key, '', expandedTextBlocks, toggleTextBlock, colorClass)
      )}
    </div>
  )
}
