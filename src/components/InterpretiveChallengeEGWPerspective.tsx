'use client';

import React, { useState, useEffect } from 'react';
import { Book, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface EGWQuote {
  reference: string;
  text: string;
}

interface EGWInterpretivePerspective {
  passage: string;
  hasCommentary: boolean;
  perspective?: string;
  references?: string[];
  quotes?: EGWQuote[];
}

interface InterpretiveChallengeEGWPerspectiveProps {
  passage: string;
}

export default function InterpretiveChallengeEGWPerspective({ 
  passage 
}: InterpretiveChallengeEGWPerspectiveProps) {
  const [perspective, setPerspective] = useState<EGWInterpretivePerspective | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (passage) {
      fetchPerspective();
    }
  }, [passage]);

  const fetchPerspective = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/egw/interpretive-perspective`);
      url.searchParams.append('passage', passage);
      url.searchParams.append('language', 'en');

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch EGW perspective');
      }

      const result = await response.json();
      setPerspective(result);
    } catch (err) {
      console.error('Failed to fetch EGW perspective:', err);
      setPerspective(null);
    } finally {
      setLoading(false);
    }
  };

  if (!perspective && !loading) return null;

  return (
    <div className="mt-4 border-t border-gray-700 pt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-blue-300 hover:text-blue-200 transition-colors w-full"
      >
        <Book className="w-4 h-4" />
        <span>🕊 Spirit of Prophecy Perspective</span>
        {loading ? (
          <Loader2 className="w-4 h-4 ml-auto animate-spin" />
        ) : (
          <div className="ml-auto">
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        )}
      </button>

      {expanded && perspective && (
        <div className="mt-3 pl-6 animate-in slide-in-from-top duration-200">
          {perspective.hasCommentary ? (
            <div className="space-y-4">
              {perspective.quotes && perspective.quotes.length > 0 ? (
                perspective.quotes.map((quote, idx) => (
                  <div 
                    key={idx} 
                    className="bg-gray-800/30 rounded-lg p-4 border border-gray-700"
                  >
                    <blockquote className="text-sm text-gray-300 leading-relaxed italic border-l-2 border-blue-400/30 pl-4 mb-2">
                      "{quote.text}"
                    </blockquote>
                    <p className="text-xs text-gray-400">
                      — {quote.reference}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-300 bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                  <p className="whitespace-pre-line">{perspective.perspective}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
              <p className="text-sm text-gray-400 italic">
                No direct Spirit of Prophecy commentary found for this verse.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                This honest acknowledgment builds credibility. Not all passages have direct EGW commentary.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
