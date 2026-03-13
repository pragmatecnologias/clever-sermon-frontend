'use client'

import { useEffect, useRef } from 'react'

type ManuscriptRichEditorProps = {
  value: string
  onChange: (value: string) => void
  className?: string
}

const ACTIONS: Array<{ label: string; command: string; value?: string }> = [
  { label: 'H2', command: 'formatBlock', value: 'H2' },
  { label: 'H3', command: 'formatBlock', value: 'H3' },
  { label: 'P', command: 'formatBlock', value: 'P' },
  { label: 'B', command: 'bold' },
  { label: 'I', command: 'italic' },
  { label: '• List', command: 'insertUnorderedList' },
  { label: '1. List', command: 'insertOrderedList' },
]

export default function ManuscriptRichEditor({ value, onChange, className }: ManuscriptRichEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!editorRef.current) return
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '<p></p>'
    }
  }, [value])

  const runCommand = (command: string, commandValue?: string) => {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    if (command === 'formatBlock') {
      document.execCommand(command, false, `<${commandValue || 'p'}>`)
      return
    }
    document.execCommand(command, false, commandValue)
    onChange(editor.innerHTML)
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2 mb-3">
        {ACTIONS.map((action) => (
          <button
            key={`${action.command}-${action.label}`}
            type="button"
            onClick={() => runCommand(action.command, action.value)}
            className="cyber-outline px-2 py-1 text-xs rounded-full"
          >
            {action.label}
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={(event) => onChange((event.currentTarget as HTMLDivElement).innerHTML)}
        className="w-full min-h-[420px] bg-black/40 border border-white/10 rounded-2xl px-6 py-6 text-gray-100 prose prose-invert prose-lg prose-headings:text-white prose-headings:font-semibold prose-h2:text-[2.15rem] prose-h2:leading-[1.15] prose-h2:tracking-[-0.02em] prose-h2:mt-10 prose-h2:mb-5 prose-h2:pb-2 prose-h2:border-b prose-h2:border-white/10 prose-h3:text-[1.5rem] prose-h3:mt-8 prose-h3:mb-4 prose-h3:text-cyan-100 prose-p:text-gray-100 prose-p:leading-[1.95] prose-p:my-6 prose-p:text-[1.06rem] prose-li:my-2 prose-blockquote:border-l-4 prose-blockquote:border-cyan-500/40 prose-blockquote:bg-cyan-500/5 prose-blockquote:px-5 prose-blockquote:py-4 prose-blockquote:rounded-r-xl max-w-none overflow-auto focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
      />
    </div>
  )
}
