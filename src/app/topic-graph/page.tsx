'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

type TopicNode = {
  id: string;
  topic?: string;
  title?: string;
  description?: string;
  relatedVerses?: string[];
  relatedThemes?: string[];
};

type TopicEdge = {
  id: string;
  sourceNodeId?: string;
  targetNodeId?: string;
  relationshipType?: string;
  strength?: string | number;
};

type Workspace = {
  id: string;
  title: string;
  mainPassage?: string;
  theme?: string;
};

function classifyTopicNode(node: TopicNode, context: { passage: string; theme: string; core: string }) {
  const text = [
    node.topic,
    node.title,
    node.description,
    ...(node.relatedVerses || []),
    ...(node.relatedThemes || []),
    context.passage,
    context.theme,
    context.core,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/(application|response|discipleship|obedience|practice|invitation|call to action|life change|pastoral)/.test(text)) {
    return 'application';
  }

  if (/(outline|structure|transition|movement|point|support|sequence|flow|organization)/.test(text)) {
    return 'outline';
  }

  if (/(big idea|sermon core|central truth|gospel|doctrine|theological|truth|center|theme|claim)/.test(text)) {
    return 'sermon core';
  }

  return 'passage';
}

export default function TopicGraphPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState('');
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [nodes, setNodes] = useState<TopicNode[]>([]);
  const [edges, setEdges] = useState<TopicEdge[]>([]);
  const [workspaceState, setWorkspaceState] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState('');
  const workspaceRequestId = useRef(0);
  const graphRequestId = useRef(0);

  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (!stored) {
      router.push('/login');
    } else {
      setToken(stored);
    }
  }, [router]);

  useEffect(() => {
    const seedTopic = searchParams.get('topic') || '';
    const seedWorkspaceId = searchParams.get('workspaceId') || '';
    if (seedTopic) setTopic(seedTopic);
    if (seedWorkspaceId) setSelectedWorkspaceId(seedWorkspaceId);
  }, [searchParams]);

  useEffect(() => {
    if (!token) return;

    const requestId = ++workspaceRequestId.current;
    const fetchWorkspaces = async () => {
      try {
        const response = await axios.get(`${apiUrl}/workspaces`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (workspaceRequestId.current !== requestId) return;
        const items = Array.isArray(response.data) ? response.data : [];
        setWorkspaces(items);
        const seedWorkspaceId = searchParams.get('workspaceId') || '';
        setSelectedWorkspaceId((current) => current || seedWorkspaceId || items[0]?.id || '');
        setWorkspaceError('');
      } catch (err) {
        console.error(err);
        if (workspaceRequestId.current !== requestId) return;
        setWorkspaceError('Unable to load sermon workspaces.');
      } finally {
        if (workspaceRequestId.current === requestId) setWorkspaceLoading(false);
      }
    };

    fetchWorkspaces();
  }, [apiUrl, searchParams, token]);

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === selectedWorkspaceId) || null,
    [selectedWorkspaceId, workspaces],
  );

  const sermonContext = useMemo(() => {
    const passage = selectedWorkspace?.mainPassage || '';
    const theme = selectedWorkspace?.theme || '';
    const title = selectedWorkspace?.title || '';
    const core =
      workspaceState?.workspace?.sermonCore?.bigIdea ||
      workspaceState?.workspace?.sermonCore?.centralTruth ||
      workspaceState?.workspace?.sermonCore?.mainIdea ||
      workspaceState?.workspace?.sermonCore?.summary ||
      '';
    return {
      passage,
      theme,
      title,
      core,
      seed: topic.trim() || passage || theme || title || core || 'current sermon workspace',
    };
  }, [selectedWorkspace, topic, workspaceState]);

  const runQuery = useCallback(
    async (mode: 'topics' | 'nodes' | 'edges') => {
      if (!token) return;

      const requestId = ++graphRequestId.current;
      setLoading(true);
      setError(null);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const params = sermonContext.seed ? { query: sermonContext.seed } : undefined;

        if (mode === 'edges') {
          const response = await axios.get(`${apiUrl}/topic-graph/edges`, { params, headers });
          if (graphRequestId.current !== requestId) return;
          setEdges(Array.isArray(response.data) ? response.data : []);
          setNodes([]);
        } else {
          const response = await axios.get(`${apiUrl}/topic-graph/nodes`, { params, headers });
          if (graphRequestId.current !== requestId) return;
          setNodes(Array.isArray(response.data) ? response.data : []);
          if (mode === 'topics') setEdges([]);
        }
      } catch (err: any) {
        if (graphRequestId.current !== requestId) return;
        setError(err.response?.data?.message || 'Failed to load topic graph results');
      } finally {
        if (graphRequestId.current === requestId) setLoading(false);
      }
    },
    [apiUrl, sermonContext.seed, token],
  );

  useEffect(() => {
    const tokenPresent = Boolean(token);
    if (!tokenPresent || !selectedWorkspaceId) return;
    void runQuery('nodes');
  }, [runQuery, selectedWorkspaceId, token]);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) || null,
    [nodes, selectedNodeId],
  );

  const selectedWorkspaceLabel = selectedWorkspace?.title || workspaceState?.workspace?.title || 'No workspace selected';
  const outlineCount = Array.isArray(workspaceState?.workspace?.outlines) ? workspaceState.workspace.outlines.length : 0;
  const manuscriptCount = Array.isArray(workspaceState?.workspace?.manuscripts) ? workspaceState.workspace.manuscripts.length : 0;
  const groupedNodes = useMemo(() => {
    const groups = {
      passage: [] as TopicNode[],
      'sermon core': [] as TopicNode[],
      outline: [] as TopicNode[],
      application: [] as TopicNode[],
    };

    for (const node of nodes) {
      groups[classifyTopicNode(node, sermonContext)]?.push(node);
    }

    return groups;
  }, [nodes, sermonContext]);

  const contextCards = [
    {
      label: 'Passage',
      value: sermonContext.passage || 'No passage selected',
      hint: 'The text that anchors the current sermon exploration.',
    },
    {
      label: 'Sermon Core',
      value: sermonContext.core || 'No sermon core yet',
      hint: 'The center this graph should strengthen.',
    },
    {
      label: 'Outline',
      value: outlineCount ? `${outlineCount} outline(s)` : 'No outline yet',
      hint: 'Topics that support structure and movement.',
    },
    {
      label: 'Manuscript',
      value: manuscriptCount ? `${manuscriptCount} manuscript(s)` : 'No manuscript yet',
      hint: 'Helpful when reviewing claims and applications.',
    },
  ];

  return (
    <div className="min-h-screen">
      <nav className="border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-400">Clever Sermon</p>
            <h1 className="text-2xl font-bold text-white">Topic Graph</h1>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="cyber-outline rounded-full px-4 py-2 text-xs"
            title="Back to dashboard"
          >
            Back to dashboard
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-6 rounded-2xl border border-white/10 bg-black/20 p-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white">Explore Topic Graph</h2>
            <p className="text-gray-200/80">
              This graph uses the current sermon workspace when available. It helps a pastor trace how a sermon theme connects to Scripture, doctrine, and related topics before writing or reviewing the sermon.
            </p>
            <p className="text-sm text-gray-300">Use this graph to explore sermon-connected ideas, not just to search keywords.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-gray-200/80">
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">Current Sermon Context</p>
              <p className="mt-2">
                Workspace: <span className="font-semibold text-white">{selectedWorkspaceLabel}</span>
              </p>
              <p className="mt-2">
                Uses the selected workspace title, main passage, sermon core, and theme to seed topic lookups.
              </p>
              <p className="mt-2 text-xs text-gray-400">
                Pastor use: review related claims, deepen study, and decide whether a topic should strengthen the outline, manuscript, or review.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <label className="mb-2 block text-xs uppercase tracking-widest cyber-muted">
                Workspace
              </label>
              <select
                value={selectedWorkspaceId}
                onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100"
              >
                {workspaceLoading ? <option value="">Loading workspaces...</option> : null}
                {!workspaceLoading && workspaces.length === 0 ? <option value="">No workspaces found</option> : null}
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.title}
                  </option>
                ))}
              </select>
              <button
                onClick={() => selectedWorkspaceId && router.push(`/workspace/${selectedWorkspaceId}`)}
                className="cyber-outline mt-3 rounded-xl px-4 py-2 text-xs"
                type="button"
                title="Open the selected workspace"
                disabled={!selectedWorkspaceId}
              >
                Open workspace
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {contextCards.map((card) => (
              <div key={card.label} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-gray-200/80">
                <p className="text-xs uppercase tracking-widest text-cyan-200/80">{card.label}</p>
                <p className="mt-2 text-white">{card.value}</p>
                <p className="mt-2 text-xs text-gray-400">{card.hint}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-gray-200/80">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">How to read this graph</p>
            <p className="mt-2">
              Start with nodes closest to the passage, then move to sermon core, outline, and application. The graph is meant to help you decide what should shape the sermon and what should stay in the notes.
            </p>
          </div>

          {workspaceLoading ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-black/15 p-4 text-sm text-gray-300">
              Loading sermon workspaces...
            </div>
          ) : null}

          {workspaceError ? (
            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
              {workspaceError}
            </div>
          ) : null}

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest cyber-muted">
                Sermon topic seed
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={sermonContext.passage || 'Use passage, theme, or a word'}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-gray-100/90"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => runQuery('topics')}
                disabled={loading}
                className="cyber-button rounded-xl px-4 py-3 disabled:opacity-50"
              >
                {loading ? 'Exploring...' : 'Explore sermon topics'}
              </button>
              <button
                onClick={() => runQuery('nodes')}
                disabled={loading}
                className="cyber-outline rounded-xl px-4 py-3 disabled:opacity-50"
              >
                Show nodes
              </button>
              <button
                onClick={() => runQuery('edges')}
                disabled={loading}
                className="cyber-outline rounded-xl px-4 py-3 disabled:opacity-50"
              >
                Show links
              </button>
              <button
                onClick={() => selectedWorkspaceId && router.push(`/workspace/${selectedWorkspaceId}?phase=OUTLINE&section=outlines`)}
                className="cyber-outline rounded-xl px-4 py-3 disabled:opacity-50"
                disabled={!selectedWorkspaceId}
                title="Send this sermon context to the outline workspace"
              >
                Use in sermon
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Recommended next step: use the workspace passage first, then refine with a topic seed if you want a narrower map.
            </p>
          </div>

          {error ? <p className="text-red-400">{error}</p> : null}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-5 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Topic Nodes</h3>
                <span className="text-xs text-gray-400">{nodes.length} node(s)</span>
              </div>

              {loading && nodes.length === 0 ? (
                <p className="text-sm text-gray-300">Loading topic connections from the selected sermon context...</p>
              ) : nodes.length === 0 ? (
                <p className="text-sm text-gray-300">
                  No topic nodes yet. Load a sermon passage, generate study notes, or widen the search term. This surface becomes more useful when it is anchored to the selected sermon.
                </p>
              ) : (
                (['passage', 'sermon core', 'outline', 'application'] as const).map((group) => {
                  const label =
                    group === 'passage'
                      ? 'Directly related to passage'
                      : group === 'sermon core'
                        ? 'Related to sermon core'
                        : group === 'outline'
                          ? 'Useful for outline'
                          : 'Useful for application';
                  const hint =
                    group === 'passage'
                      ? 'Close textual links that keep the sermon anchored.'
                      : group === 'sermon core'
                        ? 'Themes that strengthen the big idea.'
                        : group === 'outline'
                          ? 'Topics that help organize the sermon flow.'
                          : 'Topics that sharpen response and review.';
                  const items = groupedNodes[group];

                  return (
                    <section key={group} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h4 className="text-base font-semibold text-white">{label}</h4>
                          <p className="mt-1 text-sm text-gray-300">{hint}</p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200">
                          {items.length}
                        </span>
                      </div>
                      <div className="mt-4 space-y-3">
                        {items.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-gray-300">
                            No nodes in this group yet.
                          </div>
                        ) : (
                          items.map((node, idx) => (
                            <button
                              key={node.id || idx}
                              type="button"
                              className={`w-full rounded-2xl border p-4 text-left hover:bg-white/5 ${
                                selectedNodeId === node.id ? 'border-cyan-400/50 bg-cyan-500/10' : 'border-white/10 bg-black/30'
                              }`}
                              title="Open topic detail"
                              onClick={() => setSelectedNodeId(String(node.id || ''))}
                            >
                              <p className="font-medium text-cyan-100">{node.topic || node.title || 'Untitled topic'}</p>
                              <p className="mt-1 text-sm text-gray-300">{node.description || 'No description available.'}</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {(node.relatedVerses || []).slice(0, 4).map((verse) => (
                                  <span key={verse} className="cyber-tag">
                                    {verse}
                                  </span>
                                ))}
                                {(node.relatedThemes || []).slice(0, 4).map((theme) => (
                                  <span key={theme} className="cyber-tag">
                                    {theme}
                                  </span>
                                ))}
                              </div>
                              <p className="mt-3 text-xs text-cyan-200/80">
                                {group === 'passage'
                                  ? 'Use this in Deep Study.'
                                  : group === 'sermon core'
                                    ? 'Consider this for the sermon big idea.'
                                    : group === 'outline'
                                      ? 'Consider this for the outline.'
                                      : 'Review this before you finalize applications.'}
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                    </section>
                  );
                })
              )}
            </div>

            <div className="space-y-5 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Topic Edges</h3>
                <span className="text-xs text-gray-400">{edges.length} edge(s)</span>
              </div>
              {loading && edges.length === 0 ? (
                <p className="text-sm text-gray-300">Loading connection web...</p>
              ) : edges.length === 0 ? (
                <p className="text-sm text-gray-300">
                  No edges yet. A passage-based search or deeper study data usually makes the connection web more useful.
                </p>
              ) : (
                <div className="space-y-3">
                  {edges.map((edge, idx) => (
                    <div key={edge.id || idx} className="rounded-xl border border-white/10 bg-black/30 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-cyan-100">{edge.relationshipType || 'relationship'}</p>
                        <span className="text-xs text-gray-400">{edge.strength ?? 'n/a'}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-300">
                        {edge.sourceNodeId || 'source'} → {edge.targetNodeId || 'target'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Selected Topic Detail</h3>
              <span className="text-xs text-gray-400">{selectedNode ? 'Ready for review' : 'Choose a node'}</span>
            </div>
            {selectedNode ? (
              <div className="space-y-3 text-sm text-gray-200/85">
                <p className="font-medium text-cyan-100">{selectedNode.topic || selectedNode.title || 'Untitled topic'}</p>
                <p>{selectedNode.description || 'No description available.'}</p>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">Why it matters</p>
                    <p className="mt-2 text-gray-200/85">
                      {selectedNode.relatedVerses?.length
                        ? 'It helps anchor the sermon to a concrete theological thread.'
                        : 'It marks a topic worth deeper study before you build the sermon.'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">Where it fits</p>
                    <p className="mt-2 text-gray-200/85">
                      {classifyTopicNode(selectedNode, sermonContext) === 'application'
                        ? 'Applications and review'
                        : classifyTopicNode(selectedNode, sermonContext) === 'outline'
                          ? 'Outline and transitions'
                          : classifyTopicNode(selectedNode, sermonContext) === 'sermon core'
                            ? 'Sermon core and doctrinal center'
                            : 'Deep Study and Scripture'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">Best next action</p>
                    <p className="mt-2 text-gray-200/85">
                      {selectedWorkspaceId ? 'Open the workspace outline or use this topic to refine notes.' : 'Select a workspace first.'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTopic(selectedNode.topic || selectedNode.title || '');
                      setSelectedNodeId(selectedNode.id);
                    }}
                    className="cyber-button rounded-full px-4 py-2 text-xs"
                    title="Use this topic as the next sermon graph seed"
                  >
                    Use in sermon
                  </button>
                  <button
                    type="button"
                    onClick={() => selectedWorkspaceId && router.push(`/workspace/${selectedWorkspaceId}?phase=OUTLINE&section=outlines`)}
                    className="cyber-outline rounded-full px-4 py-2 text-xs"
                    disabled={!selectedWorkspaceId}
                    title="Open the outline workspace with this sermon context"
                  >
                    Send to outline
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-300">Select a node to see why it matters to this sermon.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
