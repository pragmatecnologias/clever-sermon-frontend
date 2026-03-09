import { useEffect } from 'react'

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: { ctrl?: boolean; cmd?: boolean; shift?: boolean; alt?: boolean } = {}
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const { ctrl = false, cmd = false, shift = false, alt = false } = options
      
      const matchesModifiers =
        (!ctrl || e.ctrlKey) &&
        (!cmd || e.metaKey) &&
        (!shift || e.shiftKey) &&
        (!alt || e.altKey)
      
      if (e.key.toLowerCase() === key.toLowerCase() && matchesModifiers) {
        e.preventDefault()
        callback()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [key, callback, options])
}
