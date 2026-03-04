'use client';

import React from 'react';
import { Book } from 'lucide-react';

interface EGWQuote {
  reference: string;
  bookTitle: string;
  text: string;
  category: 'thematic' | 'devotional' | 'practical' | 'prophetic';
}

interface EGWStudySection {
  thematicEmphasis?: string;
  devotionalInsight?: string;
  practicalCounsel?: string;
  propheticExpansion?: string;
  quotes: EGWQuote[];
}

interface StudyReportEGWSectionProps {
  section: EGWStudySection | null;
}

export default function StudyReportEGWSection({ section }: StudyReportEGWSectionProps) {
  if (!section) return null;

  return (
    <div className="mt-8 border-t border-gray-700 pt-6">
      <div className="flex items-center gap-2 mb-4">
        <Book className="w-5 h-5 text-blue-400" />
        <h3 className="text-xl font-semibold text-white">
          🕊 Spirit of Prophecy Insight
        </h3>
      </div>

      <p className="text-sm text-gray-400 mb-6 italic">
        The following insights from Ellen G. White's writings relate to this passage:
      </p>

      {/* Thematic Emphasis */}
      {section.thematicEmphasis && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-blue-300 mb-3">
            Thematic Emphasis
          </h4>
          <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line bg-gray-800/30 rounded-lg p-4 border border-gray-700">
            {section.thematicEmphasis}
          </div>
        </div>
      )}

      {/* Devotional Insight */}
      {section.devotionalInsight && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-blue-300 mb-3">
            Devotional Insight
          </h4>
          <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line bg-gray-800/30 rounded-lg p-4 border border-gray-700">
            {section.devotionalInsight}
          </div>
        </div>
      )}

      {/* Practical Counsel */}
      {section.practicalCounsel && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-blue-300 mb-3">
            Practical Counsel
          </h4>
          <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line bg-gray-800/30 rounded-lg p-4 border border-gray-700">
            {section.practicalCounsel}
          </div>
        </div>
      )}

      {/* Prophetic Expansion */}
      {section.propheticExpansion && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-blue-300 mb-3">
            Prophetic Expansion
          </h4>
          <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line bg-gray-800/30 rounded-lg p-4 border border-gray-700">
            {section.propheticExpansion}
          </div>
        </div>
      )}

      {/* Full Quotes Section */}
      {section.quotes && section.quotes.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-medium text-blue-300 mb-3">
            Referenced Quotes
          </h4>
          <div className="space-y-4">
            {section.quotes.map((quote, idx) => (
              <div 
                key={idx} 
                className="bg-gray-800/30 rounded-lg p-4 border border-gray-700"
              >
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/40">
                    {quote.category}
                  </span>
                </div>
                <blockquote className="text-sm text-gray-300 leading-relaxed italic border-l-2 border-blue-400/30 pl-4 mb-2">
                  "{quote.text}"
                </blockquote>
                <p className="text-xs text-gray-400">
                  — {quote.bookTitle}, {quote.reference}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Note */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-400 italic">
          Note: All quotes are preserved verbatim from original sources. 
          Spirit of Prophecy insights complement but do not replace Scripture study.
        </p>
      </div>
    </div>
  );
}
