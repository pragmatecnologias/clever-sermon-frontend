'use client';

import React from 'react';
import { Book } from 'lucide-react';

interface WorkspaceEGWToggleProps {
  includeEGW: boolean;
  onToggle: (checked: boolean) => void;
  disabled?: boolean;
}

export default function WorkspaceEGWToggle({ 
  includeEGW, 
  onToggle, 
  disabled = false 
}: WorkspaceEGWToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
      <div className="flex items-start gap-3 flex-1">
        <Book className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <label className="text-sm font-medium text-white cursor-pointer">
            Include Spirit of Prophecy References
          </label>
          <p className="text-xs text-gray-400 mt-1">
            Add relevant Ellen G. White insights to study reports, sermon outlines, and manuscripts. 
            All quotes are preserved verbatim with exact citations.
          </p>
        </div>
      </div>
      <div className="ml-4">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={includeEGW}
            onChange={(e) => onToggle(e.target.checked)}
            disabled={disabled}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  );
}
