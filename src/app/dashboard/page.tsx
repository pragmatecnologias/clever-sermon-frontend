'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ArrowRight, FileText, LogOut, Plus, Search, Trash2 } from 'lucide-react';

type WorkspaceSummary = {
  id: string;
  title: string;
  mainPassage?: string;
  theme?: string;
  seriesTitle?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

type WorkspaceStateSummary = {
  progress?: {
    themeConfigured: boolean;
    passageExplored: boolean;
    studyGenerated: boolean;
    outlineCreated: boolean;
    manuscriptWritten: boolean;
    refineCompleted: boolean;
    deliverPrepared: boolean;
  };
  activePhase?: string;
  activeSection?: string;
  artifacts?: Record<string, number>;
};

const PHASE_SEQUENCE = ['THEME', 'PASSAGE', 'STUDY', 'OUTLINE', 'WRITE', 'REFINE', 'DELIVER'] as const;
type WorkspaceFilter = 'active' | 'demo-test' | 'archived' | 'all';

const CANONICAL_DEMO_TITLE = 'Demo Sermon: John 3:16';
const PINNED_CANONICAL_DEMO_ID = (process.env.NEXT_PUBLIC_CANONICAL_DEMO_WORKSPACE_ID || process.env.NEXT_PUBLIC_CANONICAL_DEMO_ID || '').trim();
const isDemoOrTestWorkspace = (workspace: WorkspaceSummary) => /test|demo|validation|ux|probe/i.test(workspace.title);
const isPrimaryDemoWorkspace = (workspace: WorkspaceSummary) => String(workspace.title || '').trim().toLowerCase() === CANONICAL_DEMO_TITLE.toLowerCase();

const sortWorkspaceByLatestActivity = (left: WorkspaceSummary, right: WorkspaceSummary) => {
  const leftTime = new Date(right.updatedAt || right.createdAt || 0).getTime();
  const rightTime = new Date(left.updatedAt || left.createdAt || 0).getTime();
  return leftTime - rightTime;
};

const selectCanonicalDemoWorkspace = (workspaces: WorkspaceSummary[]) => {
  const canonicalCandidates = workspaces.filter((workspace) =>
    isPrimaryDemoWorkspace(workspace) &&
    workspace.status !== 'archived' &&
    workspace.status !== 'draft' &&
    workspace.status !== 'preparing',
  );
  const completedCanonicalCandidates = canonicalCandidates.filter((workspace) => workspace.status === 'completed');
  if (PINNED_CANONICAL_DEMO_ID) {
    const pinnedCompleted = completedCanonicalCandidates.find((workspace) => workspace.id === PINNED_CANONICAL_DEMO_ID);
    if (pinnedCompleted) {
      return pinnedCompleted;
    }
  }
  const orderedCompleted = [...completedCanonicalCandidates].sort(sortWorkspaceByLatestActivity);
  if (orderedCompleted[0]) {
    return orderedCompleted[0];
  }
  return null;
};

const getWorkspaceTone = (workspace: WorkspaceSummary) => {
  if (workspace.status === 'archived') return 'archived';
  if (isDemoOrTestWorkspace(workspace)) return 'demo-test';
  return 'active';
};

const getWorkspaceToneLabel = (workspace: WorkspaceSummary) => {
  const tone = getWorkspaceTone(workspace);
  if (tone === 'archived') return 'Archived';
  if (tone === 'demo-test') return 'Demo/Test';
  return 'Active';
};

const nextStepLabelForWorkspace = (state?: WorkspaceStateSummary | null) => {
  if (!state?.progress) return 'Open to continue';
  if (!state.progress.themeConfigured) return 'Setup';
  if (!state.progress.passageExplored) return 'Scripture';
  if (!state.progress.studyGenerated) return 'Study';
  if (!state.progress.outlineCreated) return 'Outline';
  if (!state.progress.manuscriptWritten) return 'Manuscript';
  if (!state.progress.refineCompleted) return 'Review';
  if (!state.progress.deliverPrepared) return 'Media & Export';
  return 'Ready';
};

const progressPercent = (state?: WorkspaceStateSummary | null) => {
  const progress = state?.progress;
  if (!progress) return 0;
  const flags = [
    progress.themeConfigured,
    progress.passageExplored,
    progress.studyGenerated,
    progress.outlineCreated,
    progress.manuscriptWritten,
    progress.refineCompleted,
    progress.deliverPrepared,
  ];
  return Math.round((flags.filter(Boolean).length / flags.length) * 100);
};

export default function Dashboard() {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [workspaceStates, setWorkspaceStates] = useState<Record<string, WorkspaceStateSummary>>({});
  const [workspaceStateStatus, setWorkspaceStateStatus] = useState<Record<string, 'loading' | 'loaded' | 'failed'>>({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [workspaceFilter, setWorkspaceFilter] = useState<WorkspaceFilter>('all');
  const [cleanupBusyId, setCleanupBusyId] = useState('');
  const [actionError, setActionError] = useState('');
  const [demoBusy, setDemoBusy] = useState(false);

  const fetchWorkspaces = useCallback(async (token: string) => {
    try {
      const response = await axios.get(`${apiUrl}/workspaces`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const items = (Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.items)
          ? response.data.items
          : Array.isArray(response.data?.workspaces)
            ? response.data.workspaces
            : Array.isArray(response.data?.data)
              ? response.data.data
              : []) as WorkspaceSummary[];
      const sorted = [...items].sort((a, b) => {
        const left = new Date(b.updatedAt || b.createdAt || 0).getTime();
        const right = new Date(a.updatedAt || a.createdAt || 0).getTime();
        return left - right;
      });
      const recent = sorted.slice(0, 8);
      const primaryDemo = selectCanonicalDemoWorkspace(sorted);
      const demoAwareWorkspaces = primaryDemo && !sorted.some((workspace) => workspace.id === primaryDemo.id)
        ? [...sorted, primaryDemo]
        : sorted;
      setWorkspaces(demoAwareWorkspaces);
      const stateTargets = primaryDemo && !recent.some((workspace) => workspace.id === primaryDemo.id)
        ? [...recent, primaryDemo]
        : recent;
      const stateEntries = await Promise.all(
        stateTargets.map(async (workspace) => {
          try {
            const stateResponse = await axios.get(`${apiUrl}/workspaces/${workspace.id}/state`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            return [workspace.id, stateResponse.data as WorkspaceStateSummary] as const;
          } catch {
            return [workspace.id, null] as const;
          }
        }),
      );
      const loadedStates = Object.fromEntries(stateEntries.filter(([, value]) => Boolean(value))) as Record<string, WorkspaceStateSummary>;
      const loadedStatus = Object.fromEntries(
        stateEntries.map(([id, value]) => [id, value ? 'loaded' : 'failed'] as const),
      ) as Record<string, 'loading' | 'loaded' | 'failed'>;
      setWorkspaceStates(loadedStates);
      setWorkspaceStateStatus((current) => ({ ...current, ...loadedStatus }));
    } catch (error) {
      console.error('Failed to fetch workspaces', error);
      setActionError('Unable to load workspaces.');
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      router.push('/login');
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }

    void fetchWorkspaces(token);
  }, [fetchWorkspaces, router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const createWorkspace = () => {
    router.push('/workspace/new');
  };

  const demoWorkspace = useMemo(
    () => selectCanonicalDemoWorkspace(workspaces),
    [workspaces],
  );
  const demoWorkspaceState = demoWorkspace ? workspaceStates[demoWorkspace.id] : null;
  const demoWorkspaceStateStatus = demoWorkspace ? workspaceStateStatus[demoWorkspace.id] : undefined;
  const demoProgress = progressPercent(demoWorkspaceState);
  const demoReady = Boolean(demoWorkspace && demoProgress === 100);
  const demoButtonLabel = demoBusy
    ? 'Preparing demo sermon...'
    : demoWorkspace
      ? demoWorkspaceStateStatus === 'loading'
        ? 'Loading demo sermon...'
        : 'Open demo sermon'
        : 'Prepare demo sermon';

  const waitForDemoCompletion = useCallback(async (workspaceId: string, token: string) => {
    const deadline = Date.now() + 15 * 60 * 1000;
    while (Date.now() < deadline) {
      try {
        const stateResponse = await axios.get(`${apiUrl}/workspaces/${workspaceId}/state`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const state = stateResponse.data as WorkspaceStateSummary;
        if (progressPercent(state) === 100) {
          await fetchWorkspaces(token);
          return true;
        }
      } catch (error) {
        console.error('Failed to poll demo workspace state', error);
      }
      await new Promise((resolve) => setTimeout(resolve, 4000));
    }
    return false;
  }, [apiUrl, fetchWorkspaces]);

  const createDemoWorkspace = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    if (demoReady && demoWorkspace) {
      router.push(`/workspace/${demoWorkspace.id}`);
      return;
    }
    setDemoBusy(true);
    setActionError('');
    try {
      const response = await axios.post(
        `${apiUrl}/workspaces/demo-sermon/prepare`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const workspaceId = response.data?.workspaceId || response.data?.workspace?.id || response.data?.id;
      if (!workspaceId) throw new Error('Demo workspace did not return an id.');
      const prepared = Boolean(response.data?.prepared);
      if (!prepared) {
        const ready = await waitForDemoCompletion(workspaceId, token);
        if (!ready) {
          throw new Error('Demo sermon is still preparing. Please try again in a moment.');
        }
      } else {
        await fetchWorkspaces(token);
      }
      router.push(`/workspace/${workspaceId}`);
    } catch (error: any) {
      console.error('Demo workspace creation failed', error);
      setActionError(error?.response?.data?.message || error?.message || 'Unable to create demo workspace.');
    } finally {
      setDemoBusy(false);
    }
  };

  const filteredWorkspaces = useMemo(() => {
    const q = search.trim().toLowerCase();
    return workspaces.filter((workspace) => {
      const searchMatch =
        !q ||
        [workspace.title, workspace.mainPassage, workspace.theme, workspace.seriesTitle, workspace.status].some((value) =>
          String(value || '').toLowerCase().includes(q),
        );
      const tone = getWorkspaceTone(workspace);
      const filterMatch =
        workspaceFilter === 'all'
          ? true
          : workspaceFilter === 'active'
            ? tone === 'active'
            : workspaceFilter === 'demo-test'
              ? tone === 'demo-test'
              : tone === 'archived';
      return searchMatch && filterMatch;
    });
  }, [search, workspaces, workspaceFilter]);

  const recentWorkspaces = filteredWorkspaces.slice(0, 6);
  const lastWorkspace = workspaces.find((workspace) => workspace.status !== 'archived') || workspaces[0] || null;
  const cleanupWorkspaces = workspaces.filter((workspace) => getWorkspaceTone(workspace) === 'demo-test');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || loading || recentWorkspaces.length === 0) {
      return;
    }

    const missingStates = recentWorkspaces.filter((workspace) => !workspaceStates[workspace.id] && workspaceStateStatus[workspace.id] !== 'loading');
    if (!missingStates.length) {
      return;
    }

    let cancelled = false;
    setWorkspaceStateStatus((current) => ({
      ...current,
      ...Object.fromEntries(missingStates.map((workspace) => [workspace.id, 'loading'] as const)),
    }));

    void Promise.all(
      missingStates.map(async (workspace) => {
        try {
          const response = await axios.get(`${apiUrl}/workspaces/${workspace.id}/state`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          return [workspace.id, response.data as WorkspaceStateSummary] as const;
        } catch {
          return [workspace.id, null] as const;
        }
      }),
    ).then((entries) => {
      if (cancelled) return;
      const loadedStates = Object.fromEntries(entries.filter(([, value]) => Boolean(value))) as Record<string, WorkspaceStateSummary>;
      const nextStatus = Object.fromEntries(
        entries.map(([id, value]) => [id, value ? 'loaded' : 'failed'] as const),
      ) as Record<string, 'loading' | 'loaded' | 'failed'>;
      setWorkspaceStates((current) => ({ ...current, ...loadedStates }));
      setWorkspaceStateStatus((current) => ({ ...current, ...nextStatus }));
    });

    return () => {
      cancelled = true;
    };
  }, [apiUrl, loading, recentWorkspaces, workspaceStates, workspaceStateStatus]);

  return (
    <div className="min-h-screen">
      <nav className="border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-400">Clever Sermon</p>
            <h1 className="text-2xl font-bold text-white">Mission Control</h1>
            <p className="mt-1 text-sm text-gray-300">Start here. Continue a sermon, create a new one, or open the complete John 3:16 demo sermon.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-cyan-200/80 text-sm">
              {user?.firstName} {user?.lastName}
            </span>
            <button onClick={() => router.push('/theology-map')} className="cyber-outline rounded-full px-4 py-2 text-xs">
              Theology Map
            </button>
            <button onClick={() => router.push('/sermon-dna')} className="cyber-outline rounded-full px-4 py-2 text-xs">
              Sermon DNA
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-xs text-gray-100/80 hover:text-white">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="cyber-panel rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-purple-300">Guided Journey</p>
              <h2 className="text-3xl font-bold text-white">Prepare a sermon in clear steps</h2>
              <p className="max-w-3xl text-gray-200/80">
                Create Workspace → Scripture → Deep Study → Sermon Core → Outline → Manuscript → Review → Media & Export.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={createDemoWorkspace} className="cyber-outline rounded-full px-5 py-3 text-sm" disabled={demoBusy}>
                {demoButtonLabel}
              </button>
              <button onClick={createWorkspace} className="cyber-button rounded-full px-5 py-3 text-sm">
                <Plus className="mr-2 inline-block h-4 w-4" />
                Create Workspace
              </button>
            </div>
          </div>

          {actionError ? <p className="mt-4 text-sm text-red-300">{actionError}</p> : null}

          <div className="mt-6 grid gap-3 md:grid-cols-4 xl:grid-cols-8">
            {[
              ['Create Workspace', 'Define context', 'Passage, audience, language'],
              ['Scripture', 'Read the text', 'Snapshots and verse context'],
              ['Deep Study', 'Explore support', 'Words, references, EGW'],
              ['Sermon Core', 'Clarify the message', 'Big idea, tension, invitation'],
              ['Outline', 'Shape the sermon', 'Points, support, applications'],
              ['Manuscript', 'Draft preaching text', 'Transitions, cues, key lines'],
              ['Review', 'Check balance', 'Support, theology, precision'],
              ['Media & Export', 'Prepare delivery', 'Slides, PDFs, assets'],
            ].map(([label, title, detail]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">{label}</p>
                <p className="mt-2 text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-xs text-gray-400">{detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="cyber-panel rounded-2xl p-6 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Continue</p>
                <h3 className="text-2xl font-semibold text-white">Continue last sermon</h3>
              </div>
              {lastWorkspace ? (
                <button onClick={() => router.push(`/workspace/${lastWorkspace.id}`)} className="cyber-button rounded-full px-4 py-2 text-sm">
                  Open latest
                </button>
              ) : null}
            </div>
            {lastWorkspace ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-lg font-semibold text-white">{lastWorkspace.title}</p>
                <p className="text-sm text-gray-300">{lastWorkspace.mainPassage || 'No passage set'}</p>
                <p className="mt-2 text-sm text-gray-300">{lastWorkspace.theme || 'No theme yet'}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="cyber-tag">
                    {workspaceStates[lastWorkspace.id]
                      ? `Continue at ${nextStepLabelForWorkspace(workspaceStates[lastWorkspace.id])}`
                      : workspaceStateStatus[lastWorkspace.id] === 'loading'
                        ? 'Progress loading…'
                        : 'Open to continue'}
                  </span>
                  <span className="cyber-tag">
                    {workspaceStates[lastWorkspace.id]
                      ? `${progressPercent(workspaceStates[lastWorkspace.id])}% complete`
                      : workspaceStateStatus[lastWorkspace.id] === 'loading'
                        ? 'Progress loading…'
                        : 'Open to continue'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-black/15 p-4 text-sm text-gray-300">
                No workspace yet. Create one or open the complete demo sermon to begin.
              </div>
            )}
          </div>

            <div className="cyber-panel rounded-2xl p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-purple-300">Search</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Find a workspace</h3>
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <Search className="h-4 w-4 text-cyan-300" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full bg-transparent text-sm text-gray-100 outline-none"
                placeholder="Search title, passage, theme..."
              />
              </div>
              <p className="mt-3 text-xs text-gray-400">Search helps pastors reopen recent work quickly, especially when many demo/test workspaces exist.</p>
              <div className="mt-4">
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/80">Filter</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    ['active', 'Active'],
                    ['demo-test', 'Demo/Test'],
                    ['archived', 'Archived'],
                    ['all', 'All'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setWorkspaceFilter(value as WorkspaceFilter)}
                      className={`rounded-full border px-3 py-2 text-xs transition ${
                        workspaceFilter === value
                          ? 'border-cyan-300/60 bg-cyan-500/15 text-cyan-100'
                          : 'border-white/10 bg-black/20 text-gray-200 hover:bg-white/5'
                      }`}
                      aria-pressed={workspaceFilter === value}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.45fr_0.9fr]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Recent</p>
                <h3 className="text-2xl font-semibold text-white">Recent workspaces</h3>
              </div>
              <span className="text-xs text-gray-400">{recentWorkspaces.length} shown</span>
            </div>

            {loading ? (
              <div className="cyber-panel rounded-2xl p-8 text-center">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-cyan-400" />
              </div>
            ) : recentWorkspaces.length === 0 ? (
              <div className="cyber-panel rounded-2xl p-8 text-center">
                <FileText className="mx-auto mb-4 h-16 w-16 text-cyan-300" />
                <h3 className="mb-2 text-xl font-semibold text-white">No workspaces found</h3>
                <p className="mb-6 text-gray-200/80">Create your first sermon workspace or open the complete demo sermon example.</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button onClick={createWorkspace} className="cyber-button rounded-full px-6 py-3">
                    Create Workspace
                  </button>
                  <button onClick={createDemoWorkspace} className="cyber-outline rounded-full px-6 py-3">
                    {demoButtonLabel}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {recentWorkspaces.map((workspace) => {
                  const state = workspaceStates[workspace.id];
                  const status = workspaceStateStatus[workspace.id];
                  const progress = progressPercent(state);
                  return (
                    <div
                      key={workspace.id}
                      onClick={() => router.push(`/workspace/${workspace.id}`)}
                      className="cyber-panel cursor-pointer rounded-2xl p-5 transition hover:shadow-[0_0_20px_rgba(0,231,255,0.2)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-xl font-semibold text-white">{workspace.title}</h4>
                          <p className="mt-1 text-cyan-200/80">{workspace.mainPassage || 'No passage set'}</p>
                        </div>
                        <span className="cyber-tag">{getWorkspaceToneLabel(workspace)}</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-300">{workspace.theme || 'No theme yet'}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="cyber-tag">
                          {state
                            ? `Continue at ${nextStepLabelForWorkspace(state)}`
                            : status === 'loading'
                              ? 'Progress loading…'
                              : 'Open to continue'}
                        </span>
                        <span className="cyber-tag">
                          {state
                            ? `${progress}% complete`
                            : status === 'loading'
                              ? 'Progress loading…'
                              : 'Open to continue'}
                        </span>
                        <span className="cyber-tag">Updated {new Date(workspace.updatedAt || workspace.createdAt || Date.now()).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <button className="flex items-center gap-1 text-xs text-cyan-200/90" type="button">
                          Open workspace <ArrowRight className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            router.push(`/workspace/${workspace.id}?phase=THEME&section=workspace`);
                          }}
                          className="cyber-outline rounded-full px-3 py-2 text-xs"
                        >
                          Continue at
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="cyber-panel rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Cleanup</p>
                  <h3 className="text-2xl font-semibold text-white">Archive or remove test workspaces</h3>
                </div>
                <span className="text-xs text-gray-400">{cleanupWorkspaces.length} candidates</span>
              </div>
              <p className="mt-2 text-sm text-gray-300">
                Optional cleanup for old demo/test workspaces only. This keeps the dashboard useful without hiding the feature.
              </p>
              <div className="mt-4 space-y-3">
                {cleanupWorkspaces.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-black/15 p-4 text-sm text-gray-300">
                    No obvious test workspaces found.
                  </div>
                ) : (
                  cleanupWorkspaces.slice(0, 5).map((workspace) => (
                    <div key={workspace.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">{workspace.title}</p>
                          <p className="text-xs text-gray-400">{workspace.mainPassage || 'No passage set'}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100 disabled:opacity-50"
                            disabled={cleanupBusyId === workspace.id}
                            onClick={async () => {
                              const token = localStorage.getItem('token');
                              if (!token) return;
                              if (!window.confirm(`Archive test workspace "${workspace.title}"?`)) return;
                              setCleanupBusyId(workspace.id);
                              try {
                                await axios.patch(
                                  `${apiUrl}/workspaces/${workspace.id}`,
                                  { status: 'archived' },
                                  { headers: { Authorization: `Bearer ${token}` } },
                                );
                                setWorkspaces((current) =>
                                  current.map((item) => (item.id === workspace.id ? { ...item, status: 'archived' } : item)),
                                );
                              } catch (error) {
                                console.error(error);
                                setActionError('Unable to archive workspace.');
                              } finally {
                                setCleanupBusyId('');
                              }
                            }}
                          >
                            {cleanupBusyId === workspace.id ? 'Archiving...' : 'Archive'}
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-100 disabled:opacity-50"
                            disabled={cleanupBusyId === workspace.id}
                            onClick={async () => {
                              const token = localStorage.getItem('token');
                              if (!token) return;
                              if (!window.confirm(`Remove test workspace "${workspace.title}" permanently?`)) return;
                              setCleanupBusyId(workspace.id);
                              try {
                                await axios.delete(`${apiUrl}/workspaces/${workspace.id}`, {
                                  headers: { Authorization: `Bearer ${token}` },
                                });
                                setWorkspaces((current) => current.filter((item) => item.id !== workspace.id));
                                setWorkspaceStates((current) => {
                                  const next = { ...current };
                                  delete next[workspace.id];
                                  return next;
                                });
                              } catch (error) {
                                console.error(error);
                                setActionError('Unable to remove workspace.');
                              } finally {
                                setCleanupBusyId('');
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="cyber-panel rounded-2xl p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-purple-300">Why this matters</p>
              <p className="mt-2 text-sm text-gray-200/80">
                A new pastor should be able to start at the dashboard, choose a sermon, and understand the next step without decoding the app. This page now points directly into the real sermon workflow.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
