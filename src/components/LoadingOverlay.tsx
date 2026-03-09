'use client'

import { Loader2 } from 'lucide-react'

interface LoadingOverlayProps {
  message: string
  duration?: string
}

export default function LoadingOverlay({ message, duration }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-2xl z-50">
      <div className="bg-black/80 border border-cyan-500/50 rounded-xl p-6 max-w-md">
        <div className="flex items-center gap-4">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <div>
            <p className="text-cyan-200 font-medium">{message}</p>
            {duration && (
              <p className="text-sm text-gray-400 mt-1">Estimated time: {duration}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
