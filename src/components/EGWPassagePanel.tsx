'use client';

import React, { useState, useEffect } from 'react';
import { Book, ChevronDown, ChevronUp, Loader2, ExternalLink } from 'lucide-react';
import EGWCitationModal from './EGWCitationModal';

interface PassageEGWInsight {
  paragraphId: string;
  bookCode: string;
  bookTitle: string;
  chapterTitle: string;
  reference: string;
  content: string;
  preview: string;
  scriptureReference: string;
  rankingScore: number;
  rankingReason: 'exact_verse' | 'same_chapter' | 'thematic' | 'doctrinal';
}

interface EGWPanelData {
  passage: string;
  insights: PassageEGWInsight[];
  totalAvailable: number;
  hasMore: boolean;
}

interface EGWPassagePanelProps {
  passage: string;
  book: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
  language?: string;
  showHeader?: boolean;
}

function RankingBadge({ reason }: { reason: PassageEGWInsight['rankingReason'] }) {
  const badges = {
    exact_verse: {
      label: 'Directly comments on this verse',
      color: 'bg-green-500/20 text-green-200 border-green-400/40'
    },
    same_chapter: {
      label: 'Relates to this chapter',
      color: 'bg-blue-500/20 text-blue-200 border-blue-400/40'
    },
    thematic: {
      label: 'Thematically connected',
      color: 'bg-purple-500/20 text-purple-200 border-purple-400/40'
    },
    doctrinal: {
      label: 'Key doctrinal theme',
      color: 'bg-amber-500/20 text-amber-200 border-amber-400/40'
    }
  };

  const badge = badges[reason];

  return (
    <span className={`text-xs px-2 py-1 rounded-full border ${badge.color}`}>
      {badge.label}
    </span>
  );
}

function InsightCard({ 
  insight, 
  onClick
}: { 
  insight: PassageEGWInsight; 
  onClick: () => void;
}) {
  // Create excerpt - first 150 chars
  const excerpt = insight.content.length > 150 
    ? insight.content.substring(0, 150) + '...' 
    : insight.content;

  return (
    <button
      onClick={onClick}
      className="w-full border border-amber-500/30 rounded-lg p-4 mb-3 bg-gradient-to-br from-amber-900/10 to-amber-800/10 hover:from-amber-900/20 hover:to-amber-800/20 transition-all text-left group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-semibold text-amber-200">
              {insight.bookTitle}
            </span>
            <span className="text-xs text-amber-400/60">
              {insight.reference}
            </span>
          </div>
          <RankingBadge reason={insight.rankingReason} />
        </div>
        <ExternalLink className="w-4 h-4 text-amber-400/40 group-hover:text-amber-400/80 transition-colors flex-shrink-0 ml-2" />
      </div>

      <p className="text-sm text-gray-300 leading-relaxed mt-3 line-clamp-3">
        {excerpt}
      </p>

      <p className="mt-2 text-xs text-amber-300/70">
        Related to: {insight.scriptureReference}
      </p>

      <div className="mt-3 flex items-center gap-1 text-xs text-amber-400 group-hover:text-amber-300 transition-colors">
        <span>Click to read full quote</span>
        <ChevronDown className="w-3 h-3" />
      </div>
    </button>
  );
}

export default function EGWPassagePanel({ 
  passage, 
  book, 
  chapter, 
  verseStart, 
  verseEnd,
  language = 'en',
  showHeader = true,
}: EGWPassagePanelProps) {
  const [data, setData] = useState<EGWPanelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showingAll, setShowingAll] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<PassageEGWInsight | null>(null);

  useEffect(() => {
    fetchInsights();
  }, [passage, book, chapter, verseStart, verseEnd, language, showingAll]);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/egw/passage-panel`);
      url.searchParams.append('book', book);
      url.searchParams.append('chapter', chapter.toString());
      if (verseStart !== undefined) {
        url.searchParams.append('verseStart', verseStart.toString());
      }
      if (verseEnd !== undefined) {
        url.searchParams.append('verseEnd', verseEnd.toString());
      }
      url.searchParams.append('language', language);
      url.searchParams.append('limit', showingAll ? '20' : '5');

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch EGW insights');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load EGW insights');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMore = () => {
    setShowingAll(true);
  };

  if (loading && !data) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Book className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">🕊 Spirit of Prophecy</h3>
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
          <h3 className="text-lg font-semibold text-white">🕊 Spirit of Prophecy</h3>
        </div>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!data || data.insights.length === 0) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Book className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">🕊 Spirit of Prophecy</h3>
        </div>
        <p className="text-gray-400 text-sm">
          No Spirit of Prophecy insights found for this passage.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br from-amber-900/10 to-amber-800/10 rounded-lg p-6 border border-amber-500/30">
        {showHeader && (
          <div className="flex items-center gap-2 mb-4">
            <Book className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-amber-100">🕊 Spirit of Prophecy</h3>
            <span className="ml-auto text-xs text-amber-400/60">
              {data.insights.length} insight{data.insights.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        <div className="space-y-2">
          {data.insights.map(insight => (
            <InsightCard
              key={insight.paragraphId}
              insight={insight}
              onClick={() => setSelectedInsight(insight)}
            />
          ))}
        </div>

        {data.hasMore && !showingAll && (
          <button
            onClick={handleViewMore}
            disabled={loading}
            className="mt-4 w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
          >
            {loading ? 'Loading...' : `View More Insights (${data.totalAvailable} total)`}
          </button>
        )}

        <div className="mt-4 pt-4 border-t border-amber-500/20">
          <p className="text-xs text-amber-400/60 italic">
            All quotes preserved verbatim from original sources. Spirit of Prophecy insights complement but do not replace Scripture study.
          </p>
        </div>
      </div>

      {selectedInsight && (
        <EGWCitationModal
          isOpen={!!selectedInsight}
          onClose={() => setSelectedInsight(null)}
          citation={{
            book: selectedInsight.bookTitle,
            chapter: selectedInsight.chapterTitle,
            paragraph: selectedInsight.paragraphId.split('_').pop() || '1',
            reference: selectedInsight.reference,
            text: selectedInsight.content,
            page: undefined
          }}
        />
      )}
    </>
  );
}
