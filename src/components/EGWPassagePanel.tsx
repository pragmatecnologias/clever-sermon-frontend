'use client';

import React, { useState, useEffect } from 'react';
import { Book, ChevronDown, ChevronUp, Loader2, ExternalLink } from 'lucide-react';
import EGWCitationModal from './EGWCitationModal';
import type { WorkspaceFeatureReadinessMap } from '@/lib/api/openapi-client'
import { getFeatureReadiness } from '@/components/feature-readiness'

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

type EGWPassageFilter = 'most_relevant' | 'christ_centered' | 'doctrinal_support' | 'pastoral_application' | 'prophecy_context'
type EGWPassageContentMode = 'quote' | 'summary'

interface EGWPassagePanelProps {
  passage: string;
  book: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
  language?: string;
  showHeader?: boolean;
  featureReadiness?: WorkspaceFeatureReadinessMap | null;
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
  onClick,
  excerpt,
  filterLabel,
  contentMode,
}: { 
  insight: PassageEGWInsight; 
  onClick: () => void;
  excerpt: string;
  filterLabel: string;
  contentMode: EGWPassageContentMode;
}) {
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
            <span className="rounded-full border border-amber-400/30 bg-black/30 px-2 py-1 text-[10px] uppercase tracking-widest text-amber-100/75">
              {filterLabel}
            </span>
          </div>
          <RankingBadge reason={insight.rankingReason} />
        </div>
        <ExternalLink className="w-4 h-4 text-amber-400/40 group-hover:text-amber-400/80 transition-colors flex-shrink-0 ml-2" />
      </div>

      <p className="text-sm text-gray-300 leading-relaxed mt-3 line-clamp-3">
        {excerpt}
      </p>

      {contentMode === 'quote' ? (
        <p className="mt-2 text-xs text-amber-300/70">
          Open the card for the full quote. Summary mode is available above if you want a quicker scan.
        </p>
      ) : null}

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
  featureReadiness,
}: EGWPassagePanelProps) {
  const [data, setData] = useState<EGWPanelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showingAll, setShowingAll] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<PassageEGWInsight | null>(null);
  const [filter, setFilter] = useState<EGWPassageFilter>('most_relevant');
  const [contentMode, setContentMode] = useState<EGWPassageContentMode>('quote');
  const readiness = getFeatureReadiness(featureReadiness, 'egw')

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

  const classifyInsight = (insight: PassageEGWInsight): EGWPassageFilter => {
    const content = `${insight.content} ${insight.reference} ${insight.bookTitle}`.toLowerCase();
    if (/christ|jesus|savior|salvation|grace|gospel/.test(content)) return 'christ_centered';
    if (/command|law|judg|doctrine|truth|faith|worship|babylon|seal|covenant/.test(content)) return 'doctrinal_support';
    if (/pastor|hope|comfort|encourag|application|practical|assurance|invitation/.test(content)) return 'pastoral_application';
    if (/prophet|prophecy|apocalypse|end-time|end time|judgment|advent|second coming|revelation|daniel|beast|horn/.test(content)) return 'prophecy_context';
    return 'most_relevant';
  };

  const filterLabels: Record<EGWPassageFilter, string> = {
    most_relevant: 'Most relevant',
    christ_centered: 'Christ-centered emphasis',
    doctrinal_support: 'Doctrinal support',
    pastoral_application: 'Pastoral application',
    prophecy_context: 'Prophecy / end-time context',
  };

  const filterDescriptions: Record<EGWPassageFilter, string> = {
    most_relevant: 'Show the closest related insights first.',
    christ_centered: 'Highlight Christ, salvation, and the gospel center.',
    doctrinal_support: 'Show doctrinally weighty support and theology.',
    pastoral_application: 'Show material that helps with appeal and care.',
    prophecy_context: 'Show end-time and prophetic context when relevant.',
  };

  const filteredInsights = (data?.insights || []).filter((insight) => {
    if (filter === 'most_relevant') return true;
    const bucket = classifyInsight(insight);
    return bucket === filter;
  });

  const excerptFor = (insight: PassageEGWInsight) => (
    contentMode === 'summary'
      ? (insight.content.length > 140 ? `${insight.content.substring(0, 140)}...` : insight.content)
      : insight.content
  );

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
    const emptyMessage =
      readiness?.status === 'needs_data'
        ? `${readiness.message} Developer action: load the EGW seed data.`
        : readiness?.status === 'needs_prerequisite'
          ? readiness.message
          : readiness?.status === 'needs_service'
            ? `${readiness.message} Developer action: configure the EGW service.`
            : 'No Spirit of Prophecy insights found for this passage.'
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Book className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">🕊 Spirit of Prophecy</h3>
        </div>
        <p className="text-gray-400 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  const containerClassName = showHeader
    ? "bg-gradient-to-br from-amber-900/10 to-amber-800/10 rounded-lg p-6 border border-amber-500/30"
    : "rounded-lg p-0 border-0 bg-transparent";

  return (
    <>
      <div className={containerClassName}>
        {showHeader && (
          <div className="mb-4 space-y-3">
            <div className="flex items-center gap-2">
              <Book className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-semibold text-amber-100">🕊 Spirit of Prophecy</h3>
              <span className="ml-auto text-xs text-amber-400/60">
                {filteredInsights.length} insight{filteredInsights.length !== 1 ? 's' : ''} shown
              </span>
            </div>
            <p className="text-sm text-amber-50/80">
              Scripture stays primary. Use filters to keep EGW supportive, readable, and pastorally useful.
            </p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(filterLabels) as EGWPassageFilter[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilter(mode)}
                  className={`rounded-full border px-3 py-2 text-xs transition-colors ${
                    filter === mode
                      ? 'border-amber-300/70 bg-amber-500/20 text-amber-50'
                      : 'border-white/10 bg-black/20 text-amber-100/75 hover:border-amber-300/40 hover:bg-amber-500/10'
                  }`}
                  title={filterDescriptions[mode]}
                >
                  {filterLabels[mode]}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setContentMode('quote')}
                className={`rounded-full border px-3 py-2 text-xs transition-colors ${
                  contentMode === 'quote'
                    ? 'border-cyan-300/70 bg-cyan-500/20 text-cyan-50'
                    : 'border-white/10 bg-black/20 text-cyan-100/75 hover:border-cyan-300/40 hover:bg-cyan-500/10'
                }`}
              >
                Quote
              </button>
              <button
                type="button"
                onClick={() => setContentMode('summary')}
                className={`rounded-full border px-3 py-2 text-xs transition-colors ${
                  contentMode === 'summary'
                    ? 'border-cyan-300/70 bg-cyan-500/20 text-cyan-50'
                    : 'border-white/10 bg-black/20 text-cyan-100/75 hover:border-cyan-300/40 hover:bg-cyan-500/10'
                }`}
              >
                Summary
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {filteredInsights.map(insight => (
            <InsightCard
              key={insight.paragraphId}
              insight={insight}
              onClick={() => setSelectedInsight(insight)}
              excerpt={excerptFor(insight)}
              filterLabel={filterLabels[classifyInsight(insight)]}
              contentMode={contentMode}
            />
          ))}
        </div>

        {filteredInsights.length === 0 && (
          <div className="rounded-lg border border-dashed border-amber-400/30 bg-black/20 p-4">
            <p className="text-sm text-amber-100/80">
              No EGW insights match the current filter. Try a different emphasis or return to Most relevant.
            </p>
          </div>
        )}

        {data.hasMore && !showingAll && filter === 'most_relevant' && (
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
