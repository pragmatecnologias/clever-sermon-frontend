'use client';

import React, { useState, useEffect } from 'react';
import { Book, Search, Loader2 } from 'lucide-react';
import type { WorkspaceFeatureReadinessMap } from '@/lib/api/openapi-client'
import { getFeatureReadiness } from '@/components/feature-readiness'

interface EGWInsight {
  id: string;
  bookCode: string;
  bookTitle: string;
  reference: string;
  content: string;
  chapterNumber: number;
  paragraphNumber: number;
}

type EGWViewMode = 'most_relevant' | 'christ_centered' | 'doctrinal_support' | 'pastoral_application' | 'prophecy_context'
type EGWContentMode = 'quote' | 'summary'

interface EGWPanelProps {
  passage: string;
  workspaceId?: string;
  featureReadiness?: WorkspaceFeatureReadinessMap | null;
}

export default function EGWPanel({ passage, workspaceId, featureReadiness }: EGWPanelProps) {
  const [insights, setInsights] = useState<EGWInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<EGWViewMode>('most_relevant');
  const [contentMode, setContentMode] = useState<EGWContentMode>('quote');
  const readiness = getFeatureReadiness(featureReadiness, 'egw')

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
      // Normalize API response: backend returns { paragraph, bookTitle, reference, excerpt }
      // but frontend expects flat { id, bookCode, bookTitle, reference, content, chapterNumber, paragraphNumber }
      const normalized: EGWInsight[] = (Array.isArray(data) ? data : []).map((item: any) => ({
        id: item.paragraph?.id || `${item.paragraph?.bookCode}-${item.paragraph?.chapterNumber}-${item.paragraph?.paragraphNumber}`,
        bookCode: item.paragraph?.bookCode || '',
        bookTitle: item.bookTitle || item.paragraph?.bookTitle || '',
        reference: item.reference || item.paragraph?.reference || '',
        content: item.excerpt || item.paragraph?.content || '',
        chapterNumber: item.paragraph?.chapterNumber || 0,
        paragraphNumber: item.paragraph?.paragraphNumber || 0,
      }));
      setInsights(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load EGW insights');
    } finally {
      setLoading(false);
    }
  };

  const parsePassageReference = (ref: string) => {
    const normalizedRef = String(ref || '').trim().replace(/:[A-Z0-9]{2,}$/i, '')
    const match = normalizedRef.match(/^([\w\s]+)\s+(\d+)(?::(\d+)(?:-(\d+))?)?/);
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

  const classifyInsight = (insight: EGWInsight): EGWViewMode => {
    const text = `${insight.bookTitle} ${insight.reference} ${insight.content}`.toLowerCase();
    if (/christ|jesus|savior|salvation|grace|gospel|cross|redeem/.test(text)) return 'christ_centered';
    if (/doctrine|sabbath|sanctuary|commandment|judgment|truth|law|faith|worship/.test(text)) return 'doctrinal_support';
    if (/practical|counsel|application|family|home|church|daily|comfort|minister|pastoral/.test(text)) return 'pastoral_application';
    if (/prophecy|revelation|daniel|end time|babylon|beast|judgment|advent/.test(text)) return 'prophecy_context';
    return 'most_relevant';
  };

  const filteredInsights = viewMode === 'most_relevant'
    ? insights
    : insights.filter((insight) => classifyInsight(insight) === viewMode);

  const viewLabels: Record<EGWViewMode, string> = {
    most_relevant: 'Most relevant',
    christ_centered: 'Christ-centered emphasis',
    doctrinal_support: 'Doctrinal support',
    pastoral_application: 'Pastoral application',
    prophecy_context: 'Prophecy / end-time context',
  };

  const viewDescriptions: Record<EGWViewMode, string> = {
    most_relevant: 'Show the strongest support first.',
    christ_centered: 'Prioritize Christ, salvation, and grace.',
    doctrinal_support: 'Prioritize teaching, truth, and Adventist doctrine.',
    pastoral_application: 'Prioritize practical counsel for the congregation.',
    prophecy_context: 'Prioritize prophetic and end-time support.',
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Book className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Ellen G. White Insights</h3>
        </div>
        <p className="text-sm text-gray-400">Gathering Spirit of Prophecy support for this passage...</p>
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
    const emptyMessage =
      readiness?.status === 'needs_data'
        ? `${readiness.message} Load the EGW seed data so this panel can show support from Spirit of Prophecy.`
        : readiness?.status === 'needs_prerequisite'
          ? readiness.message
        : readiness?.status === 'needs_service'
            ? `${readiness.message} Configure the EGW service so this panel can show support from Spirit of Prophecy.`
            : 'No EGW insights were found for this passage yet. Try a different passage or continue without EGW.'
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Book className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Ellen G. White Insights</h3>
        </div>
        <p className="text-gray-400 text-sm">{emptyMessage}</p>
        {process.env.NODE_ENV !== 'production' && readiness?.status === 'needs_data' ? (
          <p className="mt-2 text-xs text-amber-200">
            Admin action: seed the EGW library, then refresh this workspace.
          </p>
        ) : null}
      </div>
    );
  }

  if (filteredInsights.length === 0) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Book className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Ellen G. White Insights</h3>
        </div>
        <p className="text-gray-400 text-sm">
          No EGW insights match the current filter. Try a different emphasis or return to Most relevant.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Book className="w-5 h-5 text-blue-400" />
        <Search className="w-4 h-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-white">Ellen G. White Insights</h3>
        <span className="ml-auto text-xs text-gray-400">{filteredInsights.length}/{insights.length} insights</span>
      </div>

      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(viewLabels) as EGWViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`text-xs px-3 py-2 rounded-full border transition ${
                viewMode === mode
                  ? 'border-blue-300/60 bg-blue-500/15 text-blue-100'
                  : 'border-white/10 bg-black/30 text-gray-300 hover:text-white'
              }`}
              title={viewDescriptions[mode]}
            >
              {viewLabels[mode]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.25em] text-gray-400">Display</span>
          <button
            type="button"
            onClick={() => setContentMode('quote')}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${
              contentMode === 'quote'
                ? 'border-amber-300/60 bg-amber-500/15 text-amber-100'
                : 'border-white/10 bg-black/30 text-gray-300 hover:text-white'
            }`}
          >
            Quote
          </button>
          <button
            type="button"
            onClick={() => setContentMode('summary')}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${
              contentMode === 'summary'
                ? 'border-amber-300/60 bg-amber-500/15 text-amber-100'
                : 'border-white/10 bg-black/30 text-gray-300 hover:text-white'
            }`}
          >
            Summary
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredInsights.map((insight) => {
          const isExpanded = expanded.includes(insight.id);
          const preview = contentMode === 'summary' ? insight.content.substring(0, 130) : insight.content.substring(0, 200);
          const needsExpansion = insight.content.length > 200;
          const emphasis = classifyInsight(insight);
          const bodyText = contentMode === 'quote' && isExpanded ? insight.content : preview;

          return (
            <div key={insight.id} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-sm font-semibold text-blue-300">{insight.bookTitle}</h4>
                  <p className="text-xs text-gray-400">{insight.reference}</p>
                </div>
                <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border border-white/10 text-gray-300">
                  {viewLabels[emphasis]}
                </span>
              </div>
              
              <p className="text-sm text-gray-300 leading-relaxed">
                {bodyText}
                {needsExpansion && !isExpanded && contentMode === 'quote' ? '...' : ''}
              </p>

              {needsExpansion && contentMode === 'quote' && (
                <button
                  onClick={() => toggleExpanded(insight.id)}
                  title={isExpanded ? 'Collapse this EGW insight' : 'Expand this EGW insight'}
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
