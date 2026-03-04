'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Filter } from 'lucide-react';

interface ThemeVerse {
  reference: string;
  snippet: string;
  role: 'foundation' | 'development' | 'fulfillment' | 'application';
}

interface ThemeThread {
  theme: string;
  description: string;
  category: string;
  verses: ThemeVerse[];
}

interface CanonicalThemeExplorerProps {
  passage?: string;
}

export default function CanonicalThemeExplorer({ passage }: CanonicalThemeExplorerProps) {
  const [themes, setThemes] = useState<ThemeThread[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = ['all', 'covenant', 'sanctuary', 'kingdom', 'sacrifice', 'sabbath', 'remnant', 'prophecy', 'gospel'];

  useEffect(() => {
    fetchThemes();
  }, [passage]);

  const fetchThemes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const url = passage 
        ? `${process.env.NEXT_PUBLIC_API_URL}/scripture/canonical-themes?reference=${encodeURIComponent(passage)}`
        : `${process.env.NEXT_PUBLIC_API_URL}/scripture/canonical-themes`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch themes');
      }

      const data = await response.json();
      setThemes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load themes');
    } finally {
      setLoading(false);
    }
  };

  const filteredThemes = selectedCategory === 'all' 
    ? themes 
    : themes.filter(t => t.category === selectedCategory);

  const getRoleBadgeColor = (role: ThemeVerse['role']) => {
    switch (role) {
      case 'foundation': return 'bg-blue-900/50 text-blue-300';
      case 'development': return 'bg-purple-900/50 text-purple-300';
      case 'fulfillment': return 'bg-green-900/50 text-green-300';
      case 'application': return 'bg-yellow-900/50 text-yellow-300';
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Canonical Themes</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-gray-700 text-white text-sm rounded px-3 py-1 border border-gray-600"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
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
      ) : filteredThemes.length === 0 ? (
        <p className="text-gray-400 text-sm">No themes found</p>
      ) : (
        <div className="space-y-4">
          {filteredThemes.map((theme, index) => (
            <div key={index} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <div className="mb-3">
                <h4 className="text-base font-semibold text-blue-300 mb-1">{theme.theme}</h4>
                <p className="text-sm text-gray-400">{theme.description}</p>
              </div>

              <div className="space-y-2">
                {theme.verses.map((verse, vIndex) => (
                  <div key={vIndex} className="flex items-start gap-2 text-sm">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(verse.role)}`}>
                      {verse.role}
                    </span>
                    <div className="flex-1">
                      <span className="text-blue-300 font-medium">{verse.reference}</span>
                      <span className="text-gray-400"> — {verse.snippet}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
