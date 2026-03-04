'use client';

import React from 'react';
import { BookOpen, Book } from 'lucide-react';

interface EGWSupport {
  reference: string;
  bookTitle: string;
  quote: string;
  citationFormat: string;
  relevance: string;
}

interface SermonPointSupport {
  point: string;
  scriptureSupport: string[];
  egwSupport?: EGWSupport[];
}

interface SermonPointEGWSupportProps {
  support: SermonPointSupport;
  showEGW: boolean;
}

export default function SermonPointEGWSupport({ support, showEGW }: SermonPointEGWSupportProps) {
  return (
    <div className="border border-gray-700 rounded-lg p-4 bg-black/30">
      <h4 className="text-sm font-semibold text-white mb-3">
        {support.point}
      </h4>

      {/* Scripture Support */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-medium text-blue-300">
            Scripture Support
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {support.scriptureSupport && support.scriptureSupport.length > 0 ? (
            support.scriptureSupport.map(ref => (
              <span 
                key={ref} 
                className="text-xs px-2 py-1 bg-blue-500/20 text-blue-200 rounded border border-blue-400/30"
              >
                {ref}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400 italic">
              No Scripture references yet
            </span>
          )}
        </div>
      </div>

      {/* EGW Support (if enabled) */}
      {showEGW && support.egwSupport && support.egwSupport.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Book className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-medium text-purple-300">
              Spirit of Prophecy Support
            </span>
          </div>
          <div className="space-y-3">
            {support.egwSupport.map((egw, idx) => (
              <div 
                key={idx} 
                className="text-xs text-gray-300 pl-3 border-l-2 border-purple-400/30 bg-purple-500/5 rounded-r p-2"
              >
                <p className="italic mb-1 leading-relaxed">"{egw.quote}"</p>
                <p className="text-gray-400 mb-1">
                  — {egw.bookTitle}, {egw.reference}
                </p>
                <p className="text-purple-300 text-[10px] mt-1">
                  {egw.relevance}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
