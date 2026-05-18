'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

type Workspace = {
  id: string;
  title: string;
  mainPassage?: string;
  theme?: string;
};

type GraphNode = {
  id: string;
  topic?: string;
  title?: string;
  description?: string;
  relatedVerses?: string[];
};

type GraphEdge = {
  id: string;
  sourceNodeId?: string;
  targetNodeId?: string;
  relationshipType?: string;
  strength?: string | number;
};

function trimText(value: unknown, fallback = '—') {
  const text = String(value || '').trim();
  return text || fallback;
}

export default function TheologyMapPage() {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [workspaceState, setWorkspaceState] = useState<any | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [graphLoading, setGraphLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState('');
  const [graphError, setGraphError] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState('');
  const workspaceRequestId = useRef(0);
  const graphRequestId = useRef(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const requestId = ++workspaceRequestId.current;
    const fetchWorkspaces = async () => {
      try {
        const response = await axios.get(`${apiUrl}/workspaces`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (workspaceRequestId.current !== requestId) return;
        const items = Array.isArray(response.data) ? response.data : [];
        setWorkspaces(items);
        setSelectedWorkspaceId((current) => current || items[0]?.id || '');
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
  }, [apiUrl, router]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !selectedWorkspaceId) return;

    const requestId = ++graphRequestId.current;
    const fetchData = async () => {
      setGraphLoading(true);
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const stateRes = await axios.get(`${apiUrl}/workspaces/${selectedWorkspaceId}/state`, config);
        if (graphRequestId.current !== requestId) return;
        setWorkspaceState(stateRes.data);

        const context =
          stateRes.data?.workspace?.mainPassage ||
          stateRes.data?.workspace?.theme ||
          stateRes.data?.workspace?.sermonCore?.bigIdea ||
          stateRes.data?.workspace?.title ||
          '';
        const queryConfig = {
          ...config,
          params: context ? { query: context } : undefined,
        };
        const [nodeRes, edgeRes] = await Promise.all([
          axios.get(`${apiUrl}/topic-graph/nodes`, queryConfig),
          axios.get(`${apiUrl}/topic-graph/edges`, queryConfig),
        ]);
        if (graphRequestId.current !== requestId) return;
        setNodes(Array.isArray(nodeRes.data) ? nodeRes.data : []);
        setEdges(Array.isArray(edgeRes.data) ? edgeRes.data : []);
        setGraphError('');
      } catch (err) {
        console.error(err);
        if (graphRequestId.current !== requestId) return;
        setGraphError('Unable to load theology map.');
      } finally {
        if (graphRequestId.current === requestId) setGraphLoading(false);
      }
    };

    fetchData();
  }, [apiUrl, selectedWorkspaceId]);

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === selectedWorkspaceId) || null,
    [selectedWorkspaceId, workspaces],
  );

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) || null,
    [nodes, selectedNodeId],
  );

  const workspace = workspaceState?.workspace || {};
  const sermonCoreText =
    workspace.sermonCore?.bigIdea ||
    workspace.sermonCore?.centralTruth ||
    workspace.sermonCore?.mainIdea ||
    workspace.sermonCore?.summary ||
    'No sermon core yet';
  const outlineCount = Array.isArray(workspace.outlines) ? workspace.outlines.length : 0;
  const manuscriptCount = Array.isArray(workspace.manuscripts) ? workspace.manuscripts.length : 0;
  const relatedDoctrines = nodes
    .map((node) => node.topic || node.title || '')
    .filter(Boolean)
    .slice(0, 4);
  const selectedWorkspaceLabel = selectedWorkspace?.title || workspace.title || 'No workspace selected';

  const nodeRows = [
    {
      label: 'Passage',
      value: trimText(workspace.mainPassage || selectedWorkspace?.mainPassage, 'No passage selected'),
      hint: 'The sermon text that anchors the map.',
    },
    {
      label: 'Sermon Core',
      value: trimText(sermonCoreText, 'No sermon core yet'),
      hint: 'The current big idea or central truth.',
    },
    {
      label: 'Outline',
      value: outlineCount ? `${outlineCount} outline(s)` : 'No outline yet',
      hint: 'Adds structure to theological relationships.',
    },
    {
      label: 'Related Doctrines',
      value: relatedDoctrines.length ? relatedDoctrines.join(' · ') : graphLoading ? 'Loading doctrinal links...' : 'Generate study data to surface doctrines.',
      hint: 'Topics surfaced from the selected workspace.',
    },
  ];

  return (
    <div className="min-h-screen">
      <nav className="border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-400">Clever Sermon</p>
            <h1 className="text-2xl font-bold text-white">Theology Map</h1>
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

      <div className="container mx-auto space-y-8 px-4 py-10">
        <div className="cyber-panel space-y-5 rounded-2xl p-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-purple-300">Overview</p>
            <h2 className="text-3xl font-bold">Concept Lattice</h2>
            <p className="max-w-4xl text-gray-200/80">Use this map to see how your sermon connects to larger theological themes.</p>
            <p className="max-w-4xl text-sm text-gray-300/90">
              It reads the selected workspace passage, sermon core, outline, and manuscript context.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">Workspace Context</p>
              <p className="mt-2 text-sm text-gray-200/90">
                Current workspace: <span className="font-semibold text-white">{selectedWorkspaceLabel}</span>
              </p>
              <p className="mt-2 text-sm text-gray-200/80">
                Use this map after Scripture and Deep Study. The more complete the outline or manuscript, the better the theological connections become.
              </p>
              <p className="mt-2 text-xs text-gray-400">
                Pastor use: check whether your sermon center is well supported before moving into visual exploration or export.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <label className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">Current workspace</label>
              <select
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-gray-100"
                value={selectedWorkspaceId}
                onChange={(event) => setSelectedWorkspaceId(event.target.value)}
              >
                {workspaceLoading ? <option value="">Loading workspaces...</option> : null}
                {!workspaceLoading && workspaces.length === 0 ? <option value="">No workspaces found</option> : null}
                {workspaces.map((workspaceItem) => (
                  <option key={workspaceItem.id} value={workspaceItem.id}>
                    {workspaceItem.title}
                  </option>
                ))}
              </select>
              <button
                onClick={() => selectedWorkspaceId && router.push(`/workspace/${selectedWorkspaceId}`)}
                className="cyber-outline mt-3 rounded-full px-4 py-2 text-xs"
                type="button"
                title="Open the selected workspace"
                disabled={!selectedWorkspaceId}
              >
                Open workspace
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {nodeRows.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-gray-200/90">
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">{item.label}</p>
                <p className="mt-2 text-white">{item.value}</p>
                <p className="mt-2 text-xs text-gray-400">{item.hint}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-gray-200/85">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">Sermon Guidance</p>
            <p className="mt-2">
              If the graph has not finished loading, the context above still gives you the passage, sermon center, outline state, and doctrinal surface.
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
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="cyber-panel rounded-2xl p-6 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Nodes</p>
                <p className="mt-1 text-sm text-gray-300">
                  Grouped by how each topic helps the sermon: passage, sermon core, outline, or application.
                </p>
              </div>
              {graphLoading ? <span className="text-xs text-gray-400">Building graph...</span> : null}
            </div>

            {graphError ? (
              <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
                {graphError}
              </div>
            ) : null}

            <div className="mt-4 space-y-5">
              {graphLoading && nodes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-gray-200/80">
                  Building theology relationships from the selected workspace...
                </div>
              ) : nodes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-gray-200/80">
                  No theology nodes yet. Add a passage, generate a study report, or build an outline to create richer relationships.
                </div>
              ) : (
                ['direct passage', 'sermon core', 'outline', 'application'].map((group) => {
                  const groupedNodes = nodes.filter((node) => classifyNode(node, workspace, sermonCoreText) === group);
                  const groupLabel =
                    group === 'direct passage'
                      ? 'Directly related to passage'
                      : group === 'sermon core'
                        ? 'Related to sermon core'
                        : group === 'outline'
                          ? 'Useful for outline'
                          : 'Useful for application';
                  const groupHint =
                    group === 'direct passage'
                      ? 'Ideas that stay close to the text and its immediate theological flow.'
                      : group === 'sermon core'
                        ? 'Themes that strengthen the sermon center and main claim.'
                        : group === 'outline'
                          ? 'Topics that help organize movement, support, or transitions.'
                          : 'Topics that sharpen response, practice, and listener action.';

                  return (
                    <section key={group} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{groupLabel}</h3>
                          <p className="mt-1 text-sm text-gray-300">{groupHint}</p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200">
                          {groupedNodes.length}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        {groupedNodes.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-gray-300">
                            No nodes in this group yet.
                          </div>
                        ) : (
                          groupedNodes.map((node) => (
                            <button
                              key={node.id}
                              type="button"
                              onClick={() => setSelectedNodeId(node.id)}
                              className={`rounded-2xl border p-4 text-left transition-colors hover:bg-white/5 ${
                                selectedNodeId === node.id ? 'border-cyan-400/50 bg-cyan-500/10' : 'border-white/10 bg-black/30'
                              }`}
                              title="Select node for sermon context"
                            >
                              <p className="text-lg font-semibold text-white">{node.topic || node.title || 'Untitled topic'}</p>
                              <p className="mt-2 text-sm text-gray-200/80">{node.description || 'No description yet.'}</p>
                              {node.relatedVerses?.length ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {node.relatedVerses.slice(0, 4).map((verse: string) => (
                                    <span key={verse} className="cyber-tag">
                                      {verse}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                              <p className="mt-3 text-xs text-cyan-200/80">
                                {group === 'direct passage'
                                  ? 'Use this while checking the passage and study report.'
                                  : group === 'sermon core'
                                    ? 'Use this to sharpen the sermon center.'
                                    : group === 'outline'
                                      ? 'Use this when shaping movement and transitions.'
                                      : 'Use this when building applications or review claims.'}
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
          </div>

          <div className="cyber-panel rounded-2xl p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-purple-300">Edges</p>
            <div className="mt-4 space-y-3">
              {graphLoading && edges.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-gray-200/80">
                  Building connection lines for the selected sermon context...
                </div>
              ) : edges.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-gray-200/80">
                  No edges yet. The map becomes more useful once the workspace has study data or a selected outline.
                </div>
              ) : (
                edges.map((edge) => (
                  <div key={edge.id} className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <p className="text-sm text-cyan-200/80">{edge.relationshipType || 'relationship'}</p>
                    <p className="mt-2 text-sm text-gray-200/80">
                      {edge.sourceNodeId} → {edge.targetNodeId}
                    </p>
                    <p className="mt-2 text-xs text-gray-400">Strength: {edge.strength ?? 'n/a'}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="cyber-panel rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">Selected Doctrine Detail</h3>
            <span className="text-xs text-gray-400">{selectedNode ? 'Ready for review' : 'Choose a node'}</span>
          </div>
          {selectedNode ? (
            <div className="mt-4 space-y-3 text-sm text-gray-200/85">
              <p className="font-medium text-cyan-100">{selectedNode.topic || selectedNode.title || 'Untitled topic'}</p>
              <p>{selectedNode.description || 'No description available.'}</p>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">Why it matters</p>
                  <p className="mt-2 text-gray-200/85">
                    {selectedNode.relatedVerses?.length
                      ? 'It anchors the sermon to a concrete theological thread from the text.'
                      : 'It helps identify a doctrinal angle that may need deeper study.'}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">Where it fits</p>
                  <p className="mt-2 text-gray-200/85">
                    {classifyNode(selectedNode, workspace, sermonCoreText) === 'application'
                      ? 'Best used in applications and review.'
                      : classifyNode(selectedNode, workspace, sermonCoreText) === 'outline'
                        ? 'Best used when organizing the sermon outline.'
                        : classifyNode(selectedNode, workspace, sermonCoreText) === 'sermon core'
                          ? 'Best used to strengthen the sermon big idea.'
                          : 'Best used in Scripture and Deep Study.'}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">Best next action</p>
                  <p className="mt-2 text-gray-200/85">
                    {selectedWorkspaceId ? 'Open the workspace to add this topic to your next sermon phase.' : 'Select a workspace first.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const topicSeed = encodeURIComponent(selectedNode.topic || selectedNode.title || '');
                    const workspaceSeed = selectedWorkspaceId ? `workspaceId=${encodeURIComponent(selectedWorkspaceId)}` : '';
                    const topicParam = topicSeed ? `topic=${topicSeed}` : '';
                    const query = [workspaceSeed, topicParam].filter(Boolean).join('&');
                    router.push(`/topic-graph${query ? `?${query}` : ''}`);
                  }}
                  className="cyber-button rounded-full px-4 py-2 text-xs"
                  title="Send this topic to Topic Graph"
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
                <button
                  type="button"
                  onClick={() => selectedWorkspaceId && router.push(`/workspace/${selectedWorkspaceId}?phase=REFINE&section=citations`)}
                  className="cyber-outline rounded-full px-4 py-2 text-xs"
                  disabled={!selectedWorkspaceId}
                  title="Open the review area with this sermon context"
                >
                  Send to review
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-300">Select a node to see why it matters to this sermon.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function classifyNode(node: GraphNode, workspace: any, sermonCoreText: string) {
  const text = [
    node.topic,
    node.title,
    node.description,
    ...(node.relatedVerses || []),
    workspace?.mainPassage,
    workspace?.theme,
    sermonCoreText,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/(application|response|discipleship|obedience|practice|invitation|call to action|life change)/.test(text)) {
    return 'application';
  }

  if (/(outline|structure|transition|movement|point|support|sequence|flow)/.test(text)) {
    return 'outline';
  }

  if (/(big idea|sermon core|central truth|gospel|doctrine|theological|truth|center|theme)/.test(text)) {
    return 'sermon core';
  }

  return 'direct passage';
}
