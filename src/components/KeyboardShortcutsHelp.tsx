'use client'

import { useState } from 'react'
import { Keyboard, X } from 'lucide-react'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'

export default function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false)

  useKeyboardShortcut('?', () => setIsOpen(true), { shift: true })

  const shortcuts = [
    { keys: ['⌘', '1'], action: 'Go to Discover phase' },
    { keys: ['⌘', '2'], action: 'Go to Analyze phase' },
    { keys: ['⌘', '3'], action: 'Go to Strategize phase' },
    { keys: ['⌘', '4'], action: 'Go to Create phase' },
    { keys: ['⌘', '5'], action: 'Go to Refine phase' },
    { keys: ['⌘', 'S'], action: 'Save workspace' },
    { keys: ['⌘', 'G'], action: 'Generate content' },
    { keys: ['?'], action: 'Show keyboard shortcuts' },
  ]

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-black/80 border border-white/20 rounded-full p-3 hover:bg-white/10 transition-colors z-40"
        title="Keyboard shortcuts"
      >
        <Keyboard className="w-5 h-5 text-gray-300" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-white/20 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Keyboard Shortcuts</h3>
              <button onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-200" />
              </button>
            </div>
            
            <div className="space-y-2">
              {shortcuts.map((shortcut, idx) => (
                <div key={idx} className="flex items-center justify-between py-2">
                  <span className="text-gray-300">{shortcut.action}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, keyIdx) => (
                      <kbd key={keyIdx} className="px-2 py-1 bg-black/50 border border-white/20 rounded text-xs font-mono text-gray-200">
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
