'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface PassageEGWInsight {
  paragraphId: string;
  bookCode: string;
  bookTitle: string;
  reference: string;
  preview: string;
  rankingScore: number;
  rankingReason: string;
}

interface SDASmartBoost {
  isDoctrinalPassage: boolean;
  theme?: string;
  frequentlyCited?: PassageEGWInsight[];
}

interface SDASmartBoostBannerProps {
  passage: string;
}

export default function SDASmartBoostBanner({ passage }: SDASmartBoostBannerProps) {
  const [boost, setBoost] = useState<SDASmartBoost | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    checkSmartBoost();
  }, [passage]);

  const checkSmartBoost = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/egw/sda-smart-boost-check`);
      url.searchParams.append('passage', passage);

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check smart boost');
      }

      const result = await response.json();
      setBoost(result);
    } catch (err) {
      console.error('Smart boost check failed:', err);
      setBoost(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !boost?.isDoctrinalPassage) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-900/30 to-blue-900/30 border border-amber-400/30 rounded-lg p-4 mb-4 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-amber-200">
            Frequently Cited in Spirit of Prophecy
          </h4>
          <p className="text-xs text-gray-300 mt-1">
            This passage is central to SDA theology: <strong>{boost.theme}</strong>
          </p>
        </div>
        {boost.frequentlyCited && boost.frequentlyCited.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-amber-300 hover:text-amber-200 transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {expanded && boost.frequentlyCited && boost.frequentlyCited.length > 0 && (
        <div className="mt-4 pt-4 border-t border-amber-400/20 space-y-2 animate-in slide-in-from-top duration-200">
          <p className="text-xs font-medium text-amber-300 mb-2">
            Top Referenced Works:
          </p>
          {boost.frequentlyCited.slice(0, 5).map((insight, idx) => (
            <div 
              key={insight.paragraphId} 
              className="flex items-start gap-2 text-xs text-gray-300 bg-black/20 rounded p-2"
            >
              <span className="text-amber-400 font-medium flex-shrink-0">
                {idx + 1}.
              </span>
              <div className="flex-1">
                <p className="font-medium text-gray-200">
                  {insight.bookTitle}, {insight.reference}
                </p>
                <p className="text-gray-400 mt-1 italic">
                  "{insight.preview}"
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
