'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

type SermonDnaAnalysis = {
  id: string;
  summary: string;
  themes?: string[];
  scores?: Record<string, number | string>;
  createdAt: string;
};

export default function SermonDnaPage() {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [workspaceState, setWorkspaceState] = useState<any | null>(null);
  const [analyses, setAnalyses] = useState<SermonDnaAnalysis[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const workspaceRequestId = useRef(0);
  const analysisRequestId = useRef(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const requestId = ++workspaceRequestId.current;
    const fetchData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`${apiUrl}/workspaces`, config);
        if (workspaceRequestId.current !== requestId) return;
        const items = Array.isArray(response.data) ? response.data : [];
        setWorkspaces(items);
        setSelectedWorkspace((current) => current || items[0]?.id || '');
      } catch (err) {
        console.error(err);
        setError('Unable to load workspaces.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiUrl, router]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !selectedWorkspace) return;

    const requestId = ++analysisRequestId.current;
    const fetchAnalyses = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [analysisResponse, stateResponse] = await Promise.all([
          axios.get(`${apiUrl}/sermon-dna/workspace/${selectedWorkspace}`, config),
          axios.get(`${apiUrl}/workspaces/${selectedWorkspace}/state`, config),
        ]);
        if (analysisRequestId.current !== requestId) return;
        setAnalyses(Array.isArray(analysisResponse.data) ? analysisResponse.data : []);
        setWorkspaceState(stateResponse.data);
        setError('');
      } catch (err) {
        console.error(err);
        setError('Unable to load DNA analysis.');
      }
    };

    fetchAnalyses();
  }, [apiUrl, selectedWorkspace]);

  const handleAnalyze = async () => {
    const token = localStorage.getItem('token');
    if (!token || !selectedWorkspace) return;

    const requestId = ++analysisRequestId.current;
    setActionLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${apiUrl}/sermon-dna/analyze`, { workspaceId: selectedWorkspace }, config);
      const [analysisResponse, stateResponse] = await Promise.all([
        axios.get(`${apiUrl}/sermon-dna/workspace/${selectedWorkspace}`, config),
        axios.get(`${apiUrl}/workspaces/${selectedWorkspace}/state`, config),
      ]);
      if (analysisRequestId.current !== requestId) return;
      setAnalyses(Array.isArray(analysisResponse.data) ? analysisResponse.data : []);
      setWorkspaceState(stateResponse.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('DNA analysis failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const selectedWorkspaceMeta = useMemo(
    () => workspaces.find((workspace) => workspace.id === selectedWorkspace) || null,
    [selectedWorkspace, workspaces],
  );

  const persistedAnalyses = useMemo(
    () => (Array.isArray(workspaceState?.workspace?.dnaAnalyses) ? (workspaceState.workspace.dnaAnalyses as SermonDnaAnalysis[]) : analyses),
    [analyses, workspaceState],
  );
  const latestAnalysis = persistedAnalyses[0] || null;
  const hasOutline = Boolean(workspaceState?.workspace?.outlines?.length);
  const hasManuscript = Boolean(workspaceState?.workspace?.manuscripts?.length);
  const outlineCount = workspaceState?.workspace?.outlines?.length || 0;
  const manuscriptCount = workspaceState?.workspace?.manuscripts?.length || 0;
  const wordCount = String(workspaceState?.workspace?.manuscripts?.[0]?.content?.text || '')
    .split(/\s+/)
    .filter(Boolean).length;

  const scoreCards = latestAnalysis
    ? [
        { label: 'Structure', value: Number(latestAnalysis.scores?.structure || 0), hint: 'How well the sermon flows from the outline.' },
        { label: 'Clarity', value: Number(latestAnalysis.scores?.clarity || 0), hint: 'How clearly the main idea sounds in preaching.' },
        {
          label: 'Tension',
          value: Math.max(4, Math.min(10, 10 - Math.abs(Number(latestAnalysis.scores?.structure || 7) - Number(latestAnalysis.scores?.clarity || 7)))),
          hint: 'How strongly the sermon moves toward resolution.',
        },
        { label: 'Application', value: Number(latestAnalysis.scores?.applicationDepth || 0), hint: 'How directly the sermon presses toward response.' },
      ]
    : [];

  return (
    <div className="min-h-screen">
      <nav className="border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-400">Clever Sermon</p>
            <h1 className="text-2xl font-bold text-white">Sermon DNA Lab</h1>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="cyber-outline rounded-full px-4 py-2 text-xs"
          >
            Back to dashboard
          </button>
        </div>
      </nav>

      <div className="container mx-auto space-y-8 px-4 py-10">
        <div className="cyber-panel rounded-2xl p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-purple-300">Selection</p>
          <h2 className="mt-2 text-3xl font-bold">Pick a Workspace</h2>
          <p className="mt-2 text-gray-200/80">
            Sermon DNA analyzes the current sermon workspace, especially the manuscript and outline, to show tone, structure, and spiritual emphasis.
          </p>
          <p className="mt-2 text-xs text-gray-400">
            Best after manuscript generation. If no manuscript exists yet, generate one first so the analysis has something real to measure.
          </p>
          <div className="mt-6 flex flex-col gap-4 md:flex-row">
            <select
              value={selectedWorkspace}
              onChange={(event) => setSelectedWorkspace(event.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100"
            >
              {workspaces.length === 0 ? <option value="">No workspaces found</option> : null}
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.title}
                </option>
              ))}
            </select>
            <button
              onClick={handleAnalyze}
              className="cyber-button rounded-full px-6 py-3 disabled:opacity-60"
              disabled={actionLoading || !selectedWorkspace || !hasManuscript}
              title={!hasManuscript ? 'Generate or write a manuscript first' : 'Run DNA analysis for the selected workspace'}
            >
              {actionLoading ? 'Analyzing...' : 'Run Analysis'}
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-gray-200/85">
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">Outline</p>
              <p className="mt-2">{outlineCount} outline(s)</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-gray-200/85">
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">Manuscript</p>
              <p className="mt-2">{manuscriptCount} manuscript(s)</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-gray-200/85">
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">Words</p>
              <p className="mt-2">{wordCount} words</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-gray-200/85">
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">Workspace</p>
              <p className="mt-2">{selectedWorkspaceMeta?.title || 'No workspace selected'}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-cyan-400" />
          </div>
        ) : error ? (
          <div className="cyber-panel rounded-2xl p-6 text-center">
            <p className="text-red-300">{error}</p>
            {!hasManuscript ? (
              <p className="mt-2 text-sm text-gray-300">Generate or write a manuscript first so Sermon DNA has something real to analyze.</p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-6">
            {!hasManuscript ? (
              <div className="cyber-panel rounded-2xl border border-dashed border-white/15 p-6">
                <p className="text-gray-200/80">
                  Generate or write a manuscript first so Sermon DNA can analyze the current sermon, outline, and preaching shape.
                </p>
              </div>
            ) : persistedAnalyses.length === 0 ? (
              <div className="cyber-panel rounded-2xl p-6">
                <p className="text-gray-200/80">No DNA analysis yet. Run analysis to generate a sermon profile from the selected workspace.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {scoreCards.map((card) => (
                    <div key={card.label} className="cyber-panel rounded-2xl p-5">
                      <p className="text-xs uppercase tracking-widest cyber-muted">{card.label}</p>
                      <p className="mt-2 text-3xl font-bold text-white">{card.value}/10</p>
                      <p className="mt-2 text-sm text-gray-200/80">{card.hint}</p>
                    </div>
                  ))}
                </div>

                {persistedAnalyses.map((analysis) => (
                  <div key={analysis.id} className="cyber-panel rounded-2xl p-6">
                    <p className="text-gray-100/80">{analysis.summary}</p>
                    {analysis.themes?.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {analysis.themes.map((theme: string) => (
                          <span
                            key={theme}
                            className="rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[10px] uppercase tracking-widest text-cyan-200"
                          >
                            {theme}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-6 space-y-3">
                      {analysis.scores &&
                        Object.entries(analysis.scores).map(([key, value]) => (
                          <div key={key}>
                            <div className="mb-1 flex justify-between text-xs uppercase tracking-widest cyber-muted">
                              <span>{String(key)}</span>
                              <span>{Number(value)}/10</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-2 rounded-full bg-cyan-400"
                                style={{ width: `${Math.min(100, Number(value) * 10)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-gray-200/80">
                      <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">Review Suggestions</p>
                      <p className="mt-2">
                        {hasOutline
                          ? 'Use this with the outline to tighten transitions, sharpen the theological center, and review whether the applications land clearly.'
                          : 'Create an outline first so Sermon DNA can compare the sermon shape to the preaching structure.'}
                      </p>
                    </div>
                    <p className="mt-4 text-xs cyber-muted">{new Date(analysis.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
