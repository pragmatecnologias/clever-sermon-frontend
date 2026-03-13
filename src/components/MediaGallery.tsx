'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Image, FileText, Music, Mic, Video, Download, Trash2, Loader2, Share2 } from 'lucide-react'
import { slidesApi } from '@/lib/slides-api'

interface MediaItem {
  id: string
  type: 'image' | 'slide' | 'audio' | 'music' | 'video' | 'social'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  filePath?: string
  createdAt: string
  errorMessage?: string
  label?: string
  dimensions?: string
}

function formatSocialToken(value?: string): string {
  if (!value) return ''
  return value
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ')
}

interface MediaGalleryProps {
  workspaceId: string
  token: string
  filter?: 'all' | 'image' | 'slide' | 'audio' | 'music' | 'video' | 'social'
  onFilterChange?: (filter: 'all' | 'image' | 'slide' | 'audio' | 'music' | 'video' | 'social') => void
}

export default function MediaGallery({ workspaceId, token, filter, onFilterChange }: MediaGalleryProps) {
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

  // Combine decks and media into single filtered list
  const allItems = [
    ...decks.map(deck => ({
      id: deck.id,
      type: 'slide' as const,
      status: deck.status,
      createdAt: deck.createdAt,
      deck: deck,
    })),
    ...media,
  ]

  const filteredItems = activeFilter === 'all' 
    ? allItems 
    : allItems.filter(item => item.type === activeFilter)

  const filters = [
    { value: 'all', label: 'All', icon: null },
    { value: 'image', label: 'Images', icon: Image },
    { value: 'slide', label: 'Slides', icon: FileText },
    { value: 'audio', label: 'Audio', icon: Mic },
    { value: 'music', label: 'Music', icon: Music },
    { value: 'video', label: 'Video', icon: Video },
    { value: 'social', label: 'Social', icon: Share2 },
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
      case 'image': return <Image className="w-5 h-5" />
      case 'slide': return <FileText className="w-5 h-5" />
      case 'audio': return <Mic className="w-5 h-5" />
      case 'music': return <Music className="w-5 h-5" />
      case 'video': return <Video className="w-5 h-5" />
      case 'social': return <Share2 className="w-5 h-5" />
      default: return null
    }
  }

  const loadMediaLibrary = useCallback(async () => {
    try {
      setLoading(true)
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
          ...musicResult.value.map((item: any) => ({
            id: item.id,
            type: 'music' as const,
            status: (String(item.status || '').toLowerCase() === 'ready' ? 'completed' : String(item.status || '').toLowerCase()) as MediaItem['status'],
            filePath: item.filePath,
            createdAt: item.createdAt,
            errorMessage: item.errorMessage,
          }))
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
      setLoading(false)
    }
  }, [workspaceId, token])

  useEffect(() => {
    void loadMediaLibrary()
  }, [loadMediaLibrary])

  const hasInFlightItems = useMemo(() => {
    const hasPendingDeck = decks.some((deck) =>
      ['pending', 'processing', 'generating'].includes(String(deck?.status || '').toLowerCase()),
    )
    const hasPendingMedia = media.some((item) =>
      ['pending', 'processing', 'generating'].includes(String(item?.status || '').toLowerCase()),
    )
    return hasPendingDeck || hasPendingMedia
  }, [decks, media])

  useEffect(() => {
    if (!hasInFlightItems) return

    const interval = setInterval(() => {
      void loadMediaLibrary()
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
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 border border-white/10 rounded-xl bg-black/20">
          <p className="text-gray-400">No {activeFilter !== 'all' ? activeFilter : ''} media generated yet</p>
          <p className="text-sm text-gray-500 mt-2">Use the generation panels below to create media</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            // Render deck card
            if ('deck' in item && item.deck) {
              const deck = item.deck
              const deckStatus = String(deck.status || '').toLowerCase()
              const canEditDeck = deckStatus === 'ready' || deckStatus === 'completed'
              return (
                <div
                  key={item.id}
                  className="border border-white/10 rounded-xl p-4 bg-black/30 hover:bg-black/40 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      <span className="text-sm font-medium">Slide Deck</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(deckStatus)}`}>
                      {deckStatus}
                    </span>
                  </div>

                  <p className="text-sm text-gray-300 mb-2">{deck.sermon?.title || 'Untitled'}</p>
                  <p className="text-xs text-gray-500 mb-3">
                    {deck.slides?.length || 0} slides • {deck.theme?.name || 'Default Theme'}
                  </p>
                  <DeckFirstSlidePreview deck={deck} token={token} />

                  {canEditDeck ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          slidesApi.exportDeck(deck.id, 'pptx', token).catch((error) =>
                            console.error('Failed to export deck:', error),
                          )
                        }
                        className="w-full cyber-outline text-xs px-3 py-2 rounded-full flex items-center justify-center gap-2"
                      >
                        <Download className="w-3 h-3" />
                        Export PPTX
                      </button>
                    </div>
                  ) : null}

                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(deck.createdAt).toLocaleString()}
                  </p>
                </div>
              )
            }

            // Render regular media card
            const mediaItem = item as MediaItem
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
                  <div className="mb-3">
                    <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-full animate-[progress_loop_1.1s_linear_infinite] bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
                    </div>
                  </div>
                )}

                {mediaItem.status === 'failed' && mediaItem.errorMessage && (
                  <p className="text-xs text-red-300 mb-3">{mediaItem.errorMessage}</p>
                )}

                {(mediaItem.status === 'completed' || mediaItem.status === 'failed') && (
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
      )}
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
          <img src={imageSrc} alt="First slide preview" className="absolute inset-0 w-full h-full object-cover" />
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
