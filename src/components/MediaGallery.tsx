'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Image as ImageIcon, FileText, Music, Mic, Video, Download, Trash2, Loader2, Share2, Play, Pause } from 'lucide-react'
import { slidesApi } from '@/lib/slides-api'
import { createWorkspaceApiClient } from '@/lib/api/openapi-client'
import {
  getDeckIdentity,
  groupDecksForWorkspace,
} from '@/lib/deck-identity'

interface MediaItem {
  id: string
  type: 'image' | 'slide' | 'audio' | 'music' | 'video' | 'social'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  filePath?: string
  createdAt: string
  errorMessage?: string
  label?: string
  dimensions?: string
  selectedTrackId?: string
  tracksCount?: number
  progressCurrent?: number
  progressTotal?: number
  progressPercent?: number
  progressLabel?: string
}

function InlineAudioPlayer({ audioId, token }: { audioId: string; token: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [audioSrc, setAudioSrc] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let mounted = true
    let objectUrl: string | null = null

    const load = async () => {
      try {
        setIsLoading(true)
        setHasError(false)
        const blob = await slidesApi.getAudioBlob(audioId, token)
        if (!mounted) return
        objectUrl = URL.createObjectURL(blob)
        setAudioSrc(objectUrl)
      } catch (error) {
        if (!mounted) return
        console.error('Failed to load audio preview:', error)
        setAudioSrc('')
        setHasError(true)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    void load()
    return () => {
      mounted = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [audioId, token])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioSrc) return

    const handleLoaded = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
      setHasError(false)
    }
    const handleTime = () => setCurrentTime(audio.currentTime || 0)
    const handleEnded = () => setIsPlaying(false)
    const handleError = () => {
      setIsPlaying(false)
      setHasError(true)
    }

    audio.addEventListener('loadedmetadata', handleLoaded)
    audio.addEventListener('timeupdate', handleTime)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoaded)
      audio.removeEventListener('timeupdate', handleTime)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
  }, [audioSrc])

  const togglePlayback = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
      return
    }

    try {
      setHasError(false)
      await audio.play()
      setIsPlaying(true)
    } catch (error) {
      console.error('Failed to play audio preview:', error)
      setIsPlaying(false)
      setHasError(true)
    }
  }

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    const nextTime = Number(event.target.value || 0)
    audio.currentTime = nextTime
    setCurrentTime(nextTime)
  }

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  return (
    <div className="mb-3 rounded-lg border border-white/10 bg-black/30 p-3">
      <audio ref={audioRef} src={audioSrc || undefined} preload="metadata" />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            void togglePlayback()
          }}
          disabled={!audioSrc || isLoading}
          className="rounded-md border border-white/15 px-2.5 py-1.5 text-xs text-gray-100 hover:bg-white/10 flex items-center gap-1"
        >
          {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <div className="text-[11px] text-gray-300 min-w-[74px] text-right">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={Math.max(0, duration)}
        step={0.1}
        value={Math.min(currentTime, duration || 0)}
        onClick={(event) => event.stopPropagation()}
        onChange={handleSeek}
        disabled={!audioSrc || isLoading}
        className="mt-2 w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
      />
      {isLoading ? <p className="mt-1 text-[11px] text-gray-400">Loading audio preview…</p> : null}
      {hasError ? <p className="mt-1 text-[11px] text-red-300">Could not load audio preview.</p> : null}
    </div>
  )
}

interface MusicTrackOption {
  trackId: string
  title?: string
  durationSeconds?: number
  previewUrl?: string
}

function formatSocialToken(value?: string): string {
  if (!value) return ''
  return value
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ')
}

function parseSunoProgress(errorMessage?: string): {
  progressCurrent?: number
  progressTotal?: number
  progressPercent?: number
  progressLabel?: string
} {
  const raw = String(errorMessage || '').trim()
  if (!raw) return {}

  const statusMatch = raw.match(/\[Suno\s+([A-Z_]+)\]/i)
  const ratioMatch = raw.match(/\((\d+)\s*\/\s*(\d+)\)/)
  const attemptMatch = raw.match(/\(attempt\s+(\d+)\)/i)

  let progressCurrent: number | undefined
  let progressTotal: number | undefined
  if (ratioMatch) {
    progressCurrent = Number(ratioMatch[1])
    progressTotal = Number(ratioMatch[2])
  } else if (attemptMatch) {
    progressCurrent = Number(attemptMatch[1])
    progressTotal = 75
  }

  const progressPercent =
    typeof progressCurrent === 'number' && typeof progressTotal === 'number' && progressTotal > 0
      ? Math.max(0, Math.min(100, Math.round((progressCurrent / progressTotal) * 100)))
      : undefined

  const progressLabel = statusMatch ? `Suno ${statusMatch[1].replace(/_/g, ' ')}` : undefined

  return {
    progressCurrent,
    progressTotal,
    progressPercent,
    progressLabel,
  }
}

function formatEtaFromProgress(current?: number, total?: number): string | null {
  if (typeof current !== 'number' || typeof total !== 'number') return null
  if (total <= 0 || current >= total) return null
  const remainingAttempts = Math.max(0, total - current)
  const estimatedSeconds = remainingAttempts * 4
  if (estimatedSeconds <= 0) return null
  const minutes = Math.floor(estimatedSeconds / 60)
  const seconds = estimatedSeconds % 60
  if (minutes <= 0) return `~${seconds}s remaining`
  return `~${minutes}m ${seconds}s remaining`
}

interface MediaGalleryProps {
  workspace?: any
  workspaceId: string
  token: string
  filter?: 'all' | 'image' | 'slide' | 'audio' | 'music' | 'video' | 'social'
  onFilterChange?: (filter: 'all' | 'image' | 'slide' | 'audio' | 'music' | 'video' | 'social') => void
  optimisticItems?: Array<Pick<MediaItem, 'id' | 'type' | 'status' | 'createdAt'>>
  onMediaDeleted?: (payload: { id: string; type: MediaItem['type'] }) => void
  showOptionalTypes?: boolean
}

type DeckIntentGroup = 'sermon_presentation' | 'social_summary' | 'legacy'

export default function MediaGallery({ workspace, workspaceId, token, filter, onFilterChange, optimisticItems = [], onMediaDeleted, showOptionalTypes = false }: MediaGalleryProps) {
  const [internalFilter, setInternalFilter] = useState<'all' | 'image' | 'slide' | 'audio' | 'music' | 'video' | 'social'>('all')
  const [media, setMedia] = useState<MediaItem[]>([])
  const [decks, setDecks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({})

  const activeFilter = filter ?? internalFilter
  const setActiveFilter = (next: 'all' | 'image' | 'slide' | 'audio' | 'music' | 'video' | 'social') => {
    if (onFilterChange) {
      onFilterChange(next)
      return
    }
    setInternalFilter(next)
  }

  const mergedMedia = useMemo(() => {
    const byId = new Map(media.map((item) => [item.id, item]))
    for (const item of optimisticItems) {
      if (!byId.has(item.id)) {
        byId.set(item.id, {
          ...item,
          status: item.status as MediaItem['status'],
          createdAt: item.createdAt,
        } as MediaItem)
      }
    }
    return Array.from(byId.values()).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  }, [media, optimisticItems])

  const workspaceDecks = useMemo(
    () =>
      decks.filter((deck) => {
        const deckWorkspaceId =
          String(deck?.sermon?.workspaceId || deck?.sermon?.workspace?.id || deck?.workspaceId || deck?.workspace?.id || '').trim()
        return Boolean(workspaceId) && deckWorkspaceId === String(workspaceId)
      }),
    [decks, workspaceId],
  )

  const deckLibrary = useMemo(() => groupDecksForWorkspace(workspaceDecks, workspace), [workspaceDecks, workspace])

  const visibleMediaItems = showOptionalTypes
    ? mergedMedia
    : mergedMedia.filter((item) => item.type !== 'music' && item.type !== 'social')

  const filteredMediaItems = activeFilter === 'all'
    ? visibleMediaItems
    : visibleMediaItems.filter((item) => item.type === activeFilter)

  const showDeckSections = activeFilter === 'all' || activeFilter === 'slide'
  const hasDecks = workspaceDecks.length > 0

  const filters = [
    { value: 'all', label: 'All', icon: null },
    { value: 'image', label: 'Images', icon: ImageIcon },
    { value: 'slide', label: 'Slides', icon: FileText },
    { value: 'audio', label: 'Audio', icon: Mic },
    { value: 'video', label: 'Video', icon: Video },
    ...(showOptionalTypes
      ? [
          { value: 'music', label: 'Music', icon: Music },
          { value: 'social', label: 'Social', icon: Share2 },
        ]
      : []),
  ] as const

  const getStatusColor = (status: string) => {
    switch (String(status || '').toLowerCase()) {
      case 'ready':
      case 'completed': return 'bg-green-500/20 text-green-200 border-green-400/40'
      case 'generating':
      case 'processing': return 'bg-blue-500/20 text-blue-200 border-blue-400/40'
      case 'pending': return 'bg-yellow-500/20 text-yellow-200 border-yellow-400/40'
      case 'failed': return 'bg-red-500/20 text-red-200 border-red-400/40'
      default: return 'bg-gray-500/20 text-gray-200 border-gray-400/40'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-5 h-5" />
      case 'slide': return <FileText className="w-5 h-5" />
      case 'audio': return <Mic className="w-5 h-5" />
      case 'music': return <Music className="w-5 h-5" />
      case 'video': return <Video className="w-5 h-5" />
      case 'social': return <Share2 className="w-5 h-5" />
      default: return null
    }
  }

  const loadMediaLibrary = useCallback(async (options?: { silent?: boolean }) => {
    const silent = Boolean(options?.silent)
    try {
      if (!silent) {
        setLoading(true)
      }
      const [decksResult, imagesResult, audioResult, musicResult, videoResult, socialResult] = await Promise.allSettled([
        slidesApi.getDecks(token),
        slidesApi.listImages(workspaceId, token),
        slidesApi.listAudio(workspaceId, token),
        slidesApi.listMusic(workspaceId, token),
        slidesApi.listVideo(workspaceId, token),
        slidesApi.listSocial(workspaceId, token),
      ])

      const decksData = decksResult.status === 'fulfilled' ? decksResult.value : []
      setDecks(Array.isArray(decksData) ? decksData : [])

      const mappedMedia: MediaItem[] = []

      if (imagesResult.status === 'fulfilled' && Array.isArray(imagesResult.value)) {
        mappedMedia.push(
          ...imagesResult.value.map((item: any) => ({
            id: item.id,
            type: 'image' as const,
            status: (String(item.status || '').toLowerCase() === 'ready' ? 'completed' : String(item.status || '').toLowerCase()) as MediaItem['status'],
            filePath: item.filePath,
            createdAt: item.createdAt,
            errorMessage: item.errorMessage,
          }))
        )
      }

      if (audioResult.status === 'fulfilled' && Array.isArray(audioResult.value)) {
        mappedMedia.push(
          ...audioResult.value.map((item: any) => ({
            id: item.id,
            type: 'audio' as const,
            status: (String(item.status || '').toLowerCase() === 'ready' ? 'completed' : String(item.status || '').toLowerCase()) as MediaItem['status'],
            filePath: item.filePath,
            createdAt: item.createdAt,
            errorMessage: item.errorMessage,
          }))
        )
      }

      if (musicResult.status === 'fulfilled' && Array.isArray(musicResult.value)) {
        mappedMedia.push(
          ...musicResult.value.map((item: any) => {
            const progress = parseSunoProgress(item.errorMessage)
            return {
              id: item.id,
              type: 'music' as const,
              status: (String(item.status || '').toLowerCase() === 'ready' ? 'completed' : String(item.status || '').toLowerCase()) as MediaItem['status'],
              filePath: item.filePath,
              createdAt: item.createdAt,
              errorMessage: item.errorMessage,
              selectedTrackId: item.selectedTrackId,
              tracksCount: Array.isArray(item.tracks) ? item.tracks.length : 0,
              progressCurrent: progress.progressCurrent,
              progressTotal: progress.progressTotal,
              progressPercent: progress.progressPercent,
              progressLabel: progress.progressLabel,
            }
          })
        )
      }

      if (videoResult.status === 'fulfilled' && Array.isArray(videoResult.value)) {
        mappedMedia.push(
          ...videoResult.value.map((item: any) => ({
            id: item.id,
            type: 'video' as const,
            status: (String(item.status || '').toLowerCase() === 'ready' ? 'completed' : String(item.status || '').toLowerCase()) as MediaItem['status'],
            filePath: item.filePath,
            createdAt: item.createdAt,
            errorMessage: item.errorMessage,
          }))
        )
      }

      if (socialResult.status === 'fulfilled' && Array.isArray(socialResult.value)) {
        mappedMedia.push(
          ...socialResult.value.map((item: any) => ({
            id: item.id,
            type: 'social' as const,
            status: (String(item.status || '').toLowerCase() === 'ready' ? 'completed' : String(item.status || '').toLowerCase()) as MediaItem['status'],
            filePath: item.filePath,
            createdAt: item.createdAt,
            errorMessage: item.errorMessage,
            label: [item.platform, item.variant, item.overlayData?.layoutVariant].filter(Boolean).join(' • ') || item.type,
            dimensions:
              item.width && item.height
                ? `${item.width}x${item.height} ${String(item.format || 'png').toUpperCase()}`
                : undefined,
          }))
        )
      }

      mappedMedia.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      setMedia(mappedMedia)
    } catch (err) {
      console.error('Failed to load media library:', err)
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [workspaceId, token])

  useEffect(() => {
    void loadMediaLibrary()
  }, [loadMediaLibrary])

  const hasInFlightItems = useMemo(() => {
    const hasPendingDeck = workspaceDecks.some((deck) =>
      ['pending', 'processing', 'generating'].includes(String(deck?.status || '').toLowerCase()),
    )
    const hasPendingMedia = mergedMedia.some((item) =>
      ['pending', 'processing', 'generating'].includes(String(item?.status || '').toLowerCase()),
    )
    return hasPendingDeck || hasPendingMedia
  }, [workspaceDecks, mergedMedia])

  useEffect(() => {
    if (!hasInFlightItems) return

    const interval = setInterval(() => {
      void loadMediaLibrary({ silent: true })
    }, 2500)

    return () => clearInterval(interval)
  }, [hasInFlightItems, loadMediaLibrary])

  const triggerDownload = async (item: MediaItem) => {
    try {
      if (item.type === 'image') {
        const blob = await slidesApi.getImageBlob(item.id, token)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `generated-image-${item.id}.png`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
        return
      }
      if (item.type === 'social') {
        const blob = await slidesApi.getSocialBlob(item.id, token)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `social-${item.id}.png`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
        return
      }

      const url =
        item.type === 'audio'
          ? slidesApi.getAudioDownloadUrl(item.id, token)
          : item.type === 'music'
            ? slidesApi.getMusicDownloadUrl(item.id, token)
            : item.type === 'video'
              ? slidesApi.getVideoDownloadUrl(item.id, token)
              : ''

      if (!url) return
      const a = document.createElement('a')
      a.href = url
      a.target = '_blank'
      a.rel = 'noreferrer'
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (error) {
      console.error('Failed to download media item:', error)
    }
  }

  const openBlobInNewTab = (blob: Blob) => {
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener,noreferrer')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  const openAssetInNewTab = async (item: MediaItem) => {
    try {
      if (item.type === 'image') {
        const blob = await slidesApi.getImageBlob(item.id, token)
        openBlobInNewTab(blob)
        return
      }
              if (item.type === 'music') {
                const blob = await slidesApi.getMusicBlob(item.id, token)
                openBlobInNewTab(blob)
                return
              }
              if (item.type === 'social') {
                const blob = await slidesApi.getSocialBlob(item.id, token)
                openBlobInNewTab(blob)
                return
              }
              if (item.type === 'video') {
                const blob = await slidesApi.getVideoBlob(item.id, token)
                openBlobInNewTab(blob)
        return
      }
    } catch (error) {
      console.error('Failed to open asset in new tab:', error)
    }
  }

  const deleteMediaItem = async (item: MediaItem) => {
    try {
      setDeletingIds((prev) => ({ ...prev, [item.id]: true }))
      if (item.type === 'image') {
        await slidesApi.deleteImage(item.id, token)
      } else if (item.type === 'audio') {
        await slidesApi.deleteAudio(item.id, token)
      } else if (item.type === 'music') {
        await slidesApi.deleteMusic(item.id, token)
      } else if (item.type === 'video') {
        await slidesApi.deleteVideo(item.id, token)
      } else if (item.type === 'social') {
        await slidesApi.deleteSocial(item.id, token)
      } else {
        return
      }
      setMedia((prev) => prev.filter((entry) => entry.id !== item.id))
      onMediaDeleted?.({ id: item.id, type: item.type })
      await loadMediaLibrary()
    } catch (error) {
      console.error('Failed to delete media item:', error)
    } finally {
      setDeletingIds((prev) => {
        const next = { ...prev }
        delete next[item.id]
        return next
      })
    }
  }

  const deleteDeckItem = async (deckId: string) => {
    try {
      const confirmed = window.confirm('Delete this deck permanently? This cannot be undone.')
      if (!confirmed) return
      setDeletingIds((prev) => ({ ...prev, [deckId]: true }))
      await slidesApi.deleteDeck(deckId, token)
      setDecks((prev) => prev.filter((entry) => entry.id !== deckId))
      onMediaDeleted?.({ id: deckId, type: 'slide' })
      await loadMediaLibrary()
    } catch (error) {
      console.error('Failed to delete deck:', error)
    } finally {
      setDeletingIds((prev) => {
        const next = { ...prev }
        delete next[deckId]
        return next
      })
    }
  }

  const updateWorkspaceMediaPack = useCallback(
    async (patch: Record<string, unknown>) => {
      const client = createWorkspaceApiClient({ token })
      const currentMediaPack = (workspace?.metadata?.mediaPack || {}) as Record<string, unknown>
      const currentDeliverables = (workspace?.metadata?.deliverables || {}) as Record<string, unknown>
      await client.updateWorkspace(String(workspaceId), {
        metadata: {
          ...(workspace?.metadata || {}),
          mediaPack: {
            ...currentMediaPack,
            ...patch,
          },
          deliverables: {
            ...currentDeliverables,
            hasSlides: true,
          },
        },
      })
    },
    [token, workspace, workspaceId],
  )

  const setDeckAsActive = async (deck: any) => {
    if (!deck?.id) return
    const identity = getDeckIdentity(deck, workspace)
    const deckIntent = identity.intent || (identity.slideCount <= 5 ? 'social_summary' : 'sermon_presentation')
    const currentMediaPack = (workspace?.metadata?.mediaPack || {}) as Record<string, unknown>
    const latestDeckByIntent = {
      ...(currentMediaPack.latestDeckByIntent || {}),
      [deckIntent || 'sermon_presentation']: deck.id,
    } as Record<string, string | null>
    const archivedDeckIds = Array.isArray(currentMediaPack.archivedDeckIds)
      ? currentMediaPack.archivedDeckIds
      : []

    const nextPatch: Record<string, unknown> = {
      latestDeckByIntent,
      archivedDeckIds: Array.from(
        new Set(
          archivedDeckIds
            .map((id: unknown) => String(id))
            .filter(Boolean)
            .filter((id: string) => id !== String(deck.id)),
        ),
      ),
    }

    if (deckIntent === 'social_summary') {
      nextPatch.activeSocialDeckId = deck.id
    } else {
      nextPatch.activeSermonDeckId = deck.id
    }

    await updateWorkspaceMediaPack(nextPatch)
    await loadMediaLibrary({ silent: true })
  }

  const archiveDeck = async (deck: any) => {
    if (!deck?.id) return
    const currentMediaPack = (workspace?.metadata?.mediaPack || {}) as Record<string, unknown>
    const archivedDeckIdList = Array.isArray(currentMediaPack.archivedDeckIds)
      ? currentMediaPack.archivedDeckIds
      : []
    const currentlyArchived = new Set(
      archivedDeckIdList.map((id: unknown) => String(id)).filter(Boolean),
    )
    const isAlreadyArchived = currentlyArchived.has(String(deck.id))
    const confirmed = window.confirm(
      isAlreadyArchived
        ? 'Unarchive this deck? It will return to the main library sections.'
        : 'Archive this deck? It will stay in history but move out of the active deck sections.',
    )
    if (!confirmed) return
    if (isAlreadyArchived) {
      currentlyArchived.delete(String(deck.id))
    } else {
      currentlyArchived.add(String(deck.id))
    }
    const nextArchivedDeckIds = Array.from(currentlyArchived)
    const nextPatch: Record<string, unknown> = { archivedDeckIds: nextArchivedDeckIds }
    if (String(currentMediaPack.activeSermonDeckId || '') === String(deck.id)) {
      nextPatch.activeSermonDeckId = null
    }
    if (String(currentMediaPack.activeSocialDeckId || '') === String(deck.id)) {
      nextPatch.activeSocialDeckId = null
    }
    await updateWorkspaceMediaPack(nextPatch)
    await loadMediaLibrary({ silent: true })
  }

  const previewDeck = async (deck: any) => {
    const slides = Array.isArray(deck?.slides) ? [...deck.slides] : []
    const firstSlide = slides.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))[0]
    if (!firstSlide?.id) return
    try {
      const blob = await slidesApi.getSlideImageBlob(firstSlide.id, token)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (error) {
      console.error('Failed to open deck preview:', error)
    }
  }

  const deckSections = useMemo(
    () => [
      {
        key: 'sermon_presentation' as DeckIntentGroup,
        title: 'Sermon Presentation Decks',
        description: 'Best for worship services and Bible study presentations. Expected: 8-14 slides.',
        items: deckLibrary.grouped.sermon_presentation,
      },
      {
        key: 'social_summary' as DeckIntentGroup,
        title: 'Social Summary Decks',
        description: 'Best for social sharing and short announcements. Expected: 3-5 slides.',
        items: deckLibrary.grouped.social_summary,
      },
      {
        key: 'legacy' as DeckIntentGroup,
        title: 'Legacy / Older Decks',
        description: 'Generated before deck modes. Still accessible, but not the primary sermon deck.',
        items: deckLibrary.grouped.legacy,
      },
    ],
    [deckLibrary],
  )

  const visibleDeckSections = deckSections.filter((section) => {
    if (!showDeckSections) return false
    if (activeFilter === 'slide' || activeFilter === 'all') return true
    return false
  })
  const hasVisibleDecks = visibleDeckSections.some((section) => section.items.length > 0)

  const renderDeckCard = (deck: any, identity: ReturnType<typeof getDeckIdentity>, sectionKey: DeckIntentGroup) => {
    const deckStatus = String(deck?.status || '').toLowerCase()
    const isDeletingDeck = Boolean(deletingIds[deck.id])
    const activeDeckId =
      sectionKey === 'social_summary'
        ? deckLibrary.activeSocialDeckId
        : deckLibrary.activeSermonDeckId
    const isActive = String(activeDeckId || '') === String(deck.id)
    const canExport = deckStatus === 'ready' || deckStatus === 'completed'
    const activeActionLabel =
      sectionKey === 'social_summary' || (sectionKey === 'legacy' && identity.slideCount <= 5)
        ? 'Set as Social Deck'
        : 'Set as Sermon Deck'
    return (
      <div
        key={deck.id}
        className={`border rounded-xl p-4 transition-all ${
          isActive ? 'border-cyan-300/60 bg-cyan-500/10' : 'border-white/10 bg-black/30 hover:bg-black/40'
        }`}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <FileText className="w-5 h-5 text-cyan-200" />
              <span className="text-sm font-medium text-white">{deck.sermon?.title || deck.title || 'Untitled deck'}</span>
              {isActive ? (
                <span className="text-[10px] px-2 py-1 rounded-full border border-cyan-300/40 bg-cyan-500/15 text-cyan-100">
                  Active
                </span>
              ) : null}
              {identity.isArchived ? (
                <span className="text-[10px] px-2 py-1 rounded-full border border-white/20 bg-white/10 text-gray-200">
                  Archived
                </span>
              ) : null}
            </div>
            <p className="text-xs text-gray-400">
              {identity.intentLabel} · {identity.slideCount} slides · {identity.generatedAtLabel}
            </p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(deckStatus)}`}>
            {deckStatus || 'unknown'}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-[11px] px-2 py-1 rounded-full border border-white/20 bg-white/5 text-gray-200">
            {identity.qualityStatus}
          </span>
          <span className="text-[11px] px-2 py-1 rounded-full border border-cyan-400/30 bg-cyan-500/10 text-cyan-100">
            {identity.sourceWorkspaceTitle}
          </span>
          {identity.sourceOutlineId ? (
            <span className="text-[11px] px-2 py-1 rounded-full border border-white/20 bg-white/5 text-gray-300">
              Outline linked
            </span>
          ) : null}
          {identity.sourceManuscriptId ? (
            <span className="text-[11px] px-2 py-1 rounded-full border border-white/20 bg-white/5 text-gray-300">
              Manuscript linked
            </span>
          ) : null}
        </div>

        {identity.warnings.length ? (
          <div className="mb-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100 space-y-1">
            {identity.warnings.map((warning) => (
              <p key={`${deck.id}-${warning}`}>{warning}</p>
            ))}
          </div>
        ) : null}

        <DeckFirstSlidePreview deck={deck} token={token} />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              void previewDeck(deck)
            }}
            className="cyber-outline text-xs px-3 py-2 rounded-full flex items-center justify-center gap-2"
          >
            <Play className="w-3 h-3" />
            Preview
          </button>
          {canExport ? (
            <button
              onClick={() =>
                slidesApi.exportDeck(deck.id, 'pptx', token).catch((error) =>
                  console.error('Failed to export deck:', error),
                )
              }
              className="cyber-outline text-xs px-3 py-2 rounded-full flex items-center justify-center gap-2"
            >
              <Download className="w-3 h-3" />
              Export PPTX
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              void setDeckAsActive(deck)
            }}
            className="cyber-outline text-xs px-3 py-2 rounded-full flex items-center justify-center gap-2"
          >
            {activeActionLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              void archiveDeck(deck)
            }}
            className="cyber-outline text-xs px-3 py-2 rounded-full flex items-center justify-center gap-2 text-amber-200 border-amber-400/40 hover:bg-amber-500/10"
          >
            {identity.isArchived ? 'Unarchive' : 'Archive'}
          </button>
          <button
            type="button"
            onClick={() => {
              void deleteDeckItem(deck.id)
            }}
            disabled={isDeletingDeck}
            className="cyber-outline text-xs px-3 py-2 rounded-full text-red-300 border-red-400/40 hover:bg-red-500/10 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDeletingDeck ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filters.map((f) => {
          const Icon = f.icon
          return (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                activeFilter === f.value
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40'
                  : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
              }`}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {f.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-300" />
        </div>
      ) : (
        <div className="space-y-6">
          {hasVisibleDecks ? (
            visibleDeckSections.map((section) => (
              section.items.length > 0 ? (
                <section key={section.key} className="space-y-3">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-white">{section.title}</h4>
                      <p className="text-xs text-gray-400">{section.description}</p>
                    </div>
                    <span className="text-xs text-gray-400">{section.items.length} deck(s)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {section.items.map(({ deck, identity }) => renderDeckCard(deck, identity, section.key))}
                  </div>
                </section>
              ) : null
            ))
          ) : showDeckSections ? (
            <div className="text-center py-12 border border-white/10 rounded-xl bg-black/20">
              <p className="text-gray-400">
                No decks in this workspace yet. Generate a Sermon Presentation Deck or Social Summary Deck from the media panel above.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Legacy decks will appear here after generation and stay clearly labeled.
              </p>
            </div>
          ) : null}

          {activeFilter !== 'slide' ? (
            filteredMediaItems.length === 0 ? (
              <div className="text-center py-12 border border-white/10 rounded-xl bg-black/20">
                <p className="text-gray-400">
                  No {activeFilter !== 'all' ? activeFilter : ''} media generated yet. Create slides, images, audio, or video assets from the media panel above.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Use the generation panels below to create media. Optional music and social assets appear when the extras section is open.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMediaItems.map((mediaItem) => {
                  const canDeleteMedia =
                    mediaItem.type === 'audio' || mediaItem.status === 'completed' || mediaItem.status === 'failed'
                  return (
                    <div
                      key={mediaItem.id}
                      onClick={() => {
                        if (mediaItem.status === 'completed' && (mediaItem.type === 'image' || mediaItem.type === 'music' || mediaItem.type === 'video' || mediaItem.type === 'social')) {
                          openAssetInNewTab(mediaItem)
                        }
                      }}
                      className={`border border-white/10 rounded-xl p-4 bg-black/30 hover:bg-black/40 transition-all ${
                        mediaItem.status === 'completed' && (mediaItem.type === 'image' || mediaItem.type === 'music' || mediaItem.type === 'video' || mediaItem.type === 'social')
                          ? 'cursor-pointer'
                          : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(mediaItem.type)}
                          <span className="text-sm font-medium capitalize">
                            {mediaItem.type === 'social' ? 'Social Asset' : mediaItem.type}
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(mediaItem.status)}`}>
                          {mediaItem.status}
                        </span>
                      </div>

                      {mediaItem.type === 'social' ? (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {mediaItem.label?.split('•').map((part, idx) => {
                            const token = formatSocialToken(part.trim())
                            if (!token) return null
                            return (
                              <span
                                key={`${mediaItem.id}-social-tag-${idx}`}
                                className="text-[11px] px-2 py-1 rounded-full border border-cyan-400/40 bg-cyan-500/10 text-cyan-200"
                              >
                                {token}
                              </span>
                            )
                          })}
                          {mediaItem.dimensions ? (
                            <span className="text-[11px] px-2 py-1 rounded-full border border-white/20 bg-white/5 text-gray-300">
                              {mediaItem.dimensions}
                            </span>
                          ) : null}
                        </div>
                      ) : null}

                      {mediaItem.status === 'processing' && (
                        <div className="mb-3 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-gray-300">
                            <span>{mediaItem.progressLabel || 'Processing'}</span>
                            {typeof mediaItem.progressCurrent === 'number' && typeof mediaItem.progressTotal === 'number' ? (
                              <span>
                                {mediaItem.progressCurrent}/{mediaItem.progressTotal}
                                {typeof mediaItem.progressPercent === 'number' ? ` • ${mediaItem.progressPercent}%` : ''}
                              </span>
                            ) : null}
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                            {typeof mediaItem.progressPercent === 'number' ? (
                              <div
                                className="h-full rounded-full bg-cyan-300 transition-all duration-500"
                                style={{
                                  width: `${Math.max(6, Math.min(100, Number(mediaItem.progressPercent)))}%`,
                                }}
                              />
                            ) : (
                              <div className="media-indeterminate-bar h-full w-1/3 rounded-full bg-cyan-300" />
                            )}
                          </div>
                          {formatEtaFromProgress(mediaItem.progressCurrent, mediaItem.progressTotal) ? (
                            <p className="text-[11px] text-gray-400">
                              {formatEtaFromProgress(mediaItem.progressCurrent, mediaItem.progressTotal)}
                            </p>
                          ) : null}
                        </div>
                      )}

                      {mediaItem.status === 'failed' && mediaItem.errorMessage && (
                        <p className="text-xs text-red-300 mb-3">{mediaItem.errorMessage}</p>
                      )}

                      {mediaItem.type === 'music' && Number(mediaItem.tracksCount || 0) > 1 ? (
                        <p className="text-[11px] text-cyan-200 mb-2">
                          {mediaItem.tracksCount} tracks available
                        </p>
                      ) : null}

                      {mediaItem.type === 'music' && mediaItem.status === 'completed' ? (
                        <MusicTrackSelector
                          musicId={mediaItem.id}
                          token={token}
                          selectedTrackId={mediaItem.selectedTrackId}
                          onTrackSelected={loadMediaLibrary}
                        />
                      ) : null}

                      {mediaItem.type === 'audio' && mediaItem.status === 'completed' ? (
                        <InlineAudioPlayer audioId={mediaItem.id} token={token} />
                      ) : null}

                      {canDeleteMedia && (
                        <div className="flex gap-2 mt-3">
                          {mediaItem.status === 'completed' ? (
                            <button
                              onClick={(event) => {
                                event.stopPropagation()
                                triggerDownload(mediaItem)
                              }}
                              className="flex-1 cyber-outline text-xs px-3 py-2 rounded-full flex items-center justify-center gap-2"
                            >
                              <Download className="w-3 h-3" />
                              Download
                            </button>
                          ) : null}
                          <button
                            onClick={(event) => {
                              event.stopPropagation()
                              deleteMediaItem(mediaItem)
                            }}
                            disabled={Boolean(deletingIds[mediaItem.id])}
                            className="cyber-outline text-xs px-3 py-2 rounded-full text-red-300 border-red-400/40 hover:bg-red-500/10 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {deletingIds[mediaItem.id] ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      )}

                      {mediaItem.type === 'image' && mediaItem.status === 'completed' ? (
                        <GeneratedImagePreview imageId={mediaItem.id} token={token} />
                      ) : mediaItem.type === 'social' && mediaItem.status === 'completed' ? (
                        <GeneratedSocialPreview socialId={mediaItem.id} token={token} />
                      ) : null}

                      {mediaItem.label && mediaItem.type !== 'social' ? (
                        <p className="text-xs text-cyan-100/80 mt-2">{mediaItem.label}</p>
                      ) : null}
                      {mediaItem.dimensions && mediaItem.type !== 'social' ? (
                        <p className="text-[11px] text-gray-400 mt-1">{mediaItem.dimensions}</p>
                      ) : null}

                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(mediaItem.createdAt).toLocaleString()}
                      </p>
                    </div>
                  )
                })}
              </div>
            )
          ) : null}
        </div>
      )}

      <style jsx>{`
        @keyframes media-indeterminate-slide {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(320%);
          }
        }

        .media-indeterminate-bar {
          animation: media-indeterminate-slide 1.2s ease-in-out infinite;
          will-change: transform;
        }
      `}</style>
    </div>
  )
}

function MusicTrackSelector({
  musicId,
  token,
  selectedTrackId,
  onTrackSelected,
}: {
  musicId: string
  token: string
  selectedTrackId?: string
  onTrackSelected?: () => Promise<void> | void
}) {
  const [tracks, setTracks] = useState<MusicTrackOption[]>([])
  const [activeTrackId, setActiveTrackId] = useState<string>(selectedTrackId || '')
  const [loading, setLoading] = useState(false)
  const [selectingTrackId, setSelectingTrackId] = useState<string>('')
  const [playingTrackId, setPlayingTrackId] = useState<string>('')
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)

  const loadTracks = useCallback(async () => {
    try {
      setLoading(true)
      const music = await slidesApi.getMusic(musicId, token)
      const nextTracks = Array.isArray(music?.tracks) ? music.tracks : []
      const normalized = nextTracks
        .map((track: any) => ({
          trackId: String(track?.trackId || '').trim(),
          title: String(track?.title || '').trim() || undefined,
          durationSeconds: Number(track?.durationSeconds) || undefined,
          previewUrl: String(track?.streamAudioUrl || track?.audioUrl || '').trim() || undefined,
        }))
        .filter((track: MusicTrackOption) => Boolean(track.trackId))
      setTracks(normalized)
      setActiveTrackId(String(music?.selectedTrackId || selectedTrackId || normalized[0]?.trackId || ''))
    } catch (error) {
      console.error('Failed to load music tracks:', error)
    } finally {
      setLoading(false)
    }
  }, [musicId, token, selectedTrackId])

  useEffect(() => {
    loadTracks()
  }, [loadTracks])

  if (loading || tracks.length <= 1) return null

  const handleTogglePreview = async (track: MusicTrackOption) => {
    const previewUrl = String(track.previewUrl || '').trim()
    if (!previewUrl) return

    const current = previewAudioRef.current
    if (playingTrackId === track.trackId && current) {
      current.pause()
      current.currentTime = 0
      setPlayingTrackId('')
      return
    }

    if (current) {
      current.pause()
      current.currentTime = 0
    }

    const audio = new Audio(previewUrl)
    previewAudioRef.current = audio
    audio.onended = () => {
      setPlayingTrackId('')
    }

    try {
      await audio.play()
      setPlayingTrackId(track.trackId)
    } catch (error) {
      console.error('Failed to play track preview:', error)
      setPlayingTrackId('')
    }
  }

  const handleSelectTrack = async (trackId: string) => {
    if (!trackId || trackId === activeTrackId || selectingTrackId) return
    try {
      setSelectingTrackId(trackId)
      await slidesApi.selectMusicTrack(musicId, trackId, token)
      setActiveTrackId(trackId)
      await onTrackSelected?.()
    } catch (error) {
      console.error('Failed to select music track:', error)
    } finally {
      setSelectingTrackId('')
    }
  }

  const playingTrack = tracks.find((track) => track.trackId === playingTrackId)

  return (
    <div className="mb-3 space-y-2">
      <p className="text-[11px] text-gray-300">Pick generated track:</p>
      {playingTrack ? (
        <p className="text-[11px] text-green-200">
          Now playing: {playingTrack.title || `Track ${tracks.findIndex((item) => item.trackId === playingTrack.trackId) + 1}`}
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-1.5">
        {tracks.map((track, idx) => {
          const isActive = activeTrackId === track.trackId
          const isSelecting = selectingTrackId === track.trackId
          const durationLabel = track.durationSeconds ? `${Math.max(1, Math.round(track.durationSeconds))}s` : null
          return (
            <div
              key={`${musicId}-${track.trackId}`}
              className={`w-full rounded-lg border px-2 py-1.5 text-xs ${
                isActive
                  ? 'border-green-400/50 bg-green-500/10 text-green-100'
                  : 'border-white/10 bg-black/20 text-gray-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span>{track.title || `Track ${idx + 1}`}</span>
                <span className="text-[11px] text-gray-300">{durationLabel || 'track'}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    handleTogglePreview(track)
                  }}
                  disabled={!track.previewUrl || Boolean(selectingTrackId)}
                  className="rounded-md border border-white/15 px-2 py-1 text-[11px] text-gray-100 hover:bg-white/10 disabled:opacity-40 flex items-center gap-1"
                >
                  {playingTrackId === track.trackId ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  {playingTrackId === track.trackId ? 'Stop' : 'Preview'}
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    handleSelectTrack(track.trackId)
                  }}
                  disabled={Boolean(selectingTrackId) || isActive}
                  className="rounded-md border border-white/15 px-2 py-1 text-[11px] text-gray-100 hover:bg-white/10 disabled:opacity-40"
                >
                  {isSelecting ? 'Selecting...' : isActive ? 'Selected' : 'Use this'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DeckFirstSlidePreview({ deck, token }: { deck: any; token: string }) {
  const slides = Array.isArray(deck?.slides) ? [...deck.slides] : []
  const firstSlide = slides.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))[0]
  const [imageSrc, setImageSrc] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    let objectUrl: string | null = null

    const load = async () => {
      if (!firstSlide?.id) return
      try {
        const blob = await slidesApi.getSlideImageBlob(firstSlide.id, token)
        if (!mounted) return
        objectUrl = URL.createObjectURL(blob)
        setImageSrc(objectUrl)
      } catch {
        setImageSrc(null)
      }
    }

    load()
    return () => {
      mounted = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [firstSlide?.id, token])

  if (!firstSlide) return null

  const title =
    firstSlide?.content?.title ||
    firstSlide?.content?.reference ||
    firstSlide?.layoutKey ||
    'Slide'
  const subtitle = firstSlide?.content?.subtitle || firstSlide?.content?.caption || ''

  return (
    <div className="mt-3 mb-3 rounded-lg overflow-hidden border border-white/10 bg-black/30">
      <div className="aspect-video w-full relative">
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={`${deck.sermon?.title || deck.title || 'Deck'} first slide preview`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-slate-900/80 to-cyan-900/30" />
        )}
        <div className="absolute inset-0 p-3 flex flex-col justify-center">
          <p className="text-sm font-semibold text-white line-clamp-2">{String(title)}</p>
          {subtitle ? <p className="text-xs text-gray-200/80 mt-1 line-clamp-2">{String(subtitle)}</p> : null}
        </div>
      </div>
    </div>
  )
}

function GeneratedImagePreview({ imageId, token }: { imageId: string; token: string }) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    let objectUrl: string | null = null

    const load = async () => {
      try {
        const blob = await slidesApi.getImageBlob(imageId, token)
        if (!mounted) return
        objectUrl = URL.createObjectURL(blob)
        setSrc(objectUrl)
      } catch (error) {
        console.error('Failed to load image preview:', error)
      }
    }

    load()
    return () => {
      mounted = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [imageId, token])

  if (!src) return null

  return (
    <div className="mt-3 rounded-lg overflow-hidden border border-white/10 bg-black/40">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Generated media preview" className="w-full h-36 object-cover" />
    </div>
  )
}

function GeneratedSocialPreview({ socialId, token }: { socialId: string; token: string }) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    let objectUrl: string | null = null
    let retryTimer: ReturnType<typeof setTimeout> | null = null

    const load = async (attempt = 0) => {
      try {
        const blob = await slidesApi.getSocialBlob(socialId, token)
        if (!mounted) return
        objectUrl = URL.createObjectURL(blob)
        setSrc(objectUrl)
      } catch (error: any) {
        const statusCode = Number(error?.response?.status || 0)
        const shouldRetry = [404, 425, 500].includes(statusCode) || statusCode === 0
        if (shouldRetry && attempt < 6 && mounted) {
          retryTimer = setTimeout(() => {
            void load(attempt + 1)
          }, 700)
          return
        }
        console.error('Failed to load social preview:', error)
      }
    }

    void load()
    return () => {
      mounted = false
      if (retryTimer) clearTimeout(retryTimer)
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [socialId, token])

  if (!src) return null

  return (
    <div className="mt-3 rounded-lg overflow-hidden border border-white/10 bg-black/40">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Social media preview" className="w-full h-36 object-cover" />
    </div>
  )
}
