'use client';

import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, XCircle, Loader2 } from 'lucide-react';

interface CitationValidation {
  verseReference: string;
  statement: string;
  verseText: string;
  supportLevel: 'supported' | 'weak' | 'not_supported';
  phraseOverlap: string[];
  matchScore: number;
  explanation: string;
}

interface CitationValidatorProps {
  citations: Array<{ statement: string; verseReferences: string[] }>;
  onValidationComplete?: (results: CitationValidation[]) => void;
}

export default function CitationValidator({ citations, onValidationComplete }: CitationValidatorProps) {
  const [validations, setValidations] = useState<CitationValidation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateCitations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scripture/validate-citations-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          citations,
          translation: 'KJV'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to validate citations');
      }

      const results = await response.json();
      setValidations(results);
      onValidationComplete?.(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  const getSupportIcon = (level: CitationValidation['supportLevel']) => {
    switch (level) {
      case 'supported':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'weak':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'not_supported':
        return <XCircle className="w-5 h-5 text-red-400" />;
    }
  };

  const getSupportColor = (level: CitationValidation['supportLevel']) => {
    switch (level) {
      case 'supported':
        return 'text-green-400';
      case 'weak':
        return 'text-yellow-400';
      case 'not_supported':
        return 'text-red-400';
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Citation Validation</h3>
        <button
          onClick={validateCitations}
          disabled={loading || citations.length === 0}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Validating...
            </>
          ) : (
            'Validate All'
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {validations.length === 0 && !loading && (
        <p className="text-gray-400 text-sm">Click "Validate All" to check citation accuracy</p>
      )}

      {validations.length > 0 && (
        <div className="space-y-4">
          {validations.map((validation, index) => (
            <div key={index} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-start gap-3 mb-3">
                {getSupportIcon(validation.supportLevel)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-blue-300">{validation.verseReference}</span>
                    <span className={`text-xs font-medium ${getSupportColor(validation.supportLevel)}`}>
                      {validation.supportLevel.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {Math.round(validation.matchScore * 100)}% match
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{validation.statement}</p>
                  <p className="text-xs text-gray-400 italic mb-2">"{validation.verseText}"</p>
                  <p className="text-xs text-gray-500">{validation.explanation}</p>
                  
                  {validation.phraseOverlap.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-400 mb-1">Matching phrases:</p>
                      <div className="flex flex-wrap gap-1">
                        {validation.phraseOverlap.map((phrase, i) => (
                          <span key={i} className="px-2 py-1 bg-green-900/30 text-green-300 text-xs rounded">
                            {phrase}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
