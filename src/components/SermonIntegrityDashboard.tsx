'use client';

import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle2, Info, TrendingUp } from 'lucide-react';

interface IntegrityIssue {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  affectedItem?: string;
}

interface IntegrityReport {
  overallScore: number;
  balanced: boolean;
  issues: IntegrityIssue[];
  strengths: string[];
  recommendations: string[];
}

interface SermonIntegrityDashboardProps {
  workspaceId: string;
}

export default function SermonIntegrityDashboard({ workspaceId }: SermonIntegrityDashboardProps) {
  const [report, setReport] = useState<IntegrityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkIntegrity = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workspaces/${workspaceId}/integrity-check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check sermon integrity');
      }

      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Integrity check failed');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreRing = (score: number) => {
    if (score >= 85) return 'stroke-green-400';
    if (score >= 70) return 'stroke-yellow-400';
    return 'stroke-red-400';
  };

  const getSeverityIcon = (severity: IntegrityIssue['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Sermon Integrity</h3>
        </div>
        <button
          onClick={checkIntegrity}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
        >
          {loading ? 'Checking...' : 'Run Check'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {!report && !loading && (
        <p className="text-gray-400 text-sm">Click "Run Check" to analyze sermon integrity</p>
      )}

      {report && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-700"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - report.overallScore / 100)}`}
                  className={getScoreRing(report.overallScore)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-bold ${getScoreColor(report.overallScore)}`}>
                  {report.overallScore}
                </span>
              </div>
            </div>
            
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-white mb-1">
                {report.balanced ? 'Well Balanced' : 'Needs Attention'}
              </h4>
              <p className="text-sm text-gray-400">
                {report.issues.length} issues found • {report.strengths.length} strengths identified
              </p>
            </div>
          </div>

          {/* Strengths */}
          {report.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Strengths
              </h4>
              <ul className="space-y-1">
                {report.strengths.map((strength, index) => (
                  <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Issues */}
          {report.issues.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Issues ({report.issues.length})
              </h4>
              <div className="space-y-2">
                {report.issues.map((issue, index) => (
                  <div key={index} className="bg-gray-900/50 rounded p-3 border border-gray-700">
                    <div className="flex items-start gap-2">
                      {getSeverityIcon(issue.severity)}
                      <div className="flex-1">
                        <p className="text-sm text-gray-300">{issue.message}</p>
                        {issue.affectedItem && (
                          <p className="text-xs text-gray-500 mt-1">Affects: {issue.affectedItem.substring(0, 50)}...</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Recommendations
              </h4>
              <ul className="space-y-1">
                {report.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-blue-400 mt-1">→</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
