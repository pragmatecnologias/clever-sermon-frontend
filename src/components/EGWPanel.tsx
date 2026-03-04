'use client';

import React, { useState, useEffect } from 'react';
import { Book, Search, Loader2 } from 'lucide-react';

interface EGWInsight {
  id: string;
  bookCode: string;
  bookTitle: string;
  reference: string;
  content: string;
  chapterNumber: number;
  paragraphNumber: number;
}

interface EGWPanelProps {
  passage: string;
  workspaceId?: string;
}

export default function EGWPanel({ passage, workspaceId }: EGWPanelProps) {
  const [insights, setInsights] = useState<EGWInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);

  useEffect(() => {
    if (passage) {
      fetchEGWInsights();
    }
  }, [passage]);

  const fetchEGWInsights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const parsedPassage = parsePassageReference(passage);
      
      if (!parsedPassage) {
        setError('Invalid passage reference');
        return;
      }

      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/egw/insights/passage`);
      url.searchParams.append('book', parsedPassage.book);
      url.searchParams.append('chapter', parsedPassage.chapter.toString());
      if (parsedPassage.verseStart) {
        url.searchParams.append('verseStart', parsedPassage.verseStart.toString());
      }
      if (parsedPassage.verseEnd) {
        url.searchParams.append('verseEnd', parsedPassage.verseEnd.toString());
      }
      url.searchParams.append('language', 'en');
      url.searchParams.append('limit', '5');

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch EGW insights');
      }

      const data = await response.json();
      setInsights(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load EGW insights');
    } finally {
      setLoading(false);
    }
  };

  const parsePassageReference = (ref: string) => {
    const match = ref.match(/^([\w\s]+)\s+(\d+)(?::(\d+)(?:-(\d+))?)?/);
    if (!match) return null;
    
    return {
      book: match[1].trim(),
      chapter: parseInt(match[2]),
      verseStart: match[3] ? parseInt(match[3]) : undefined,
      verseEnd: match[4] ? parseInt(match[4]) : undefined,
    };
  };

  const toggleExpanded = (id: string) => {
    setExpanded(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Book className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Ellen G. White Insights</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Book className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Ellen G. White Insights</h3>
        </div>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Book className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Ellen G. White Insights</h3>
        </div>
        <p className="text-gray-400 text-sm">No EGW insights found for this passage.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Book className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Ellen G. White Insights</h3>
        <span className="ml-auto text-xs text-gray-400">{insights.length} insights</span>
      </div>

      <div className="space-y-4">
        {insights.map((insight) => {
          const isExpanded = expanded.includes(insight.id);
          const preview = insight.content.substring(0, 200);
          const needsExpansion = insight.content.length > 200;

          return (
            <div key={insight.id} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-sm font-semibold text-blue-300">{insight.bookTitle}</h4>
                  <p className="text-xs text-gray-400">{insight.reference}</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-300 leading-relaxed">
                {isExpanded ? insight.content : preview}
                {needsExpansion && !isExpanded && '...'}
              </p>

              {needsExpansion && (
                <button
                  onClick={() => toggleExpanded(insight.id)}
                  className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                >
                  {isExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
