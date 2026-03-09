'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface CollapsibleSectionProps {
  title: string
  description?: string
  defaultOpen?: boolean
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'tertiary'
}

export default function CollapsibleSection({ 
  title, 
  description, 
  defaultOpen = false, 
  children,
  variant = 'secondary'
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const variantStyles = {
    primary: 'border-cyan-500/30 bg-cyan-900/10',
    secondary: 'border-purple-500/30 bg-purple-900/10',
    tertiary: 'border-gray-500/30 bg-gray-900/10'
  }

  return (
    <div className={`border rounded-xl ${variantStyles[variant]}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="text-left">
          <h3 className="font-semibold text-gray-100">{title}</h3>
          {description && (
            <p className="text-sm text-gray-400 mt-1">{description}</p>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      
      {isOpen && (
        <div className="px-5 pb-5 pt-2">
          {children}
        </div>
      )}
    </div>
  )
}
