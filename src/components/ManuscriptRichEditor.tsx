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
        className="w-full min-h-[260px] bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-gray-100 prose prose-invert prose-p:my-2 prose-h2:my-2 prose-h3:my-2 max-w-none overflow-auto focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
      />
    </div>
  )
}

