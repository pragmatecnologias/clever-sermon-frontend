'use client';

import React, { useState, useEffect } from 'react';
import { Network, Book } from 'lucide-react';

interface Connection {
  sourcePassage?: string;
  passage?: string;
  targetPassages?: string[];
  connectedPassages?: string[];
  connectionType?: string;
  theme?: string;
  description: string;
}

interface SanctuaryProphecyMapperProps {
  passage: string;
  mode: 'sanctuary' | 'prophecy';
}

export default function SanctuaryProphecyMapper({ passage, mode }: SanctuaryProphecyMapperProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (passage) {
      fetchConnections();
    }
  }, [passage, mode]);

  const fetchConnections = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const endpoint = mode === 'sanctuary' ? 'sanctuary-connections' : 'prophecy-connections';
      const url = `${process.env.NEXT_PUBLIC_API_URL}/scripture/${endpoint}?passage=${encodeURIComponent(passage)}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${mode} connections`);
      }

      const data = await response.json();
      setConnections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const getConnectionTypeColor = (type?: string) => {
    switch (type) {
      case 'type_antitype': return 'bg-purple-900/50 text-purple-300';
      case 'parallel': return 'bg-blue-900/50 text-blue-300';
      case 'fulfillment': return 'bg-green-900/50 text-green-300';
      case 'thematic': return 'bg-yellow-900/50 text-yellow-300';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Network className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">
          {mode === 'sanctuary' ? 'Sanctuary Connections' : 'Prophecy Connections'}
        </h3>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
        </div>
      ) : connections.length === 0 ? (
        <p className="text-gray-400 text-sm">No {mode} connections found for this passage</p>
      ) : (
        <div className="space-y-4">
          {connections.map((connection, index) => {
            const relatedPassages = connection.targetPassages || connection.connectedPassages || [];
            
            return (
              <div key={index} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Book className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-semibold text-blue-300">
                      {connection.sourcePassage || connection.passage}
                    </span>
                    {connection.connectionType && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getConnectionTypeColor(connection.connectionType)}`}>
                        {connection.connectionType.replace('_', ' ')}
                      </span>
                    )}
                    {connection.theme && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-900/50 text-blue-300">
                        {connection.theme}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{connection.description}</p>
                </div>

                {relatedPassages.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Connected passages:</p>
                    <div className="flex flex-wrap gap-2">
                      {relatedPassages.map((ref, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-800 text-blue-300 text-xs rounded border border-gray-700">
                          {ref}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
