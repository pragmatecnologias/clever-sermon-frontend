'use client'

import { useState, useEffect } from 'react'
import { Image, FileText, Music, Mic, Video, Download, Trash2, Loader2, Edit } from 'lucide-react'
import { slidesApi } from '@/lib/slides-api'
import DeckEditor from './DeckEditor'

interface MediaItem {
  id: string
  type: 'image' | 'slide' | 'audio' | 'music' | 'video'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  filePath?: string
  createdAt: string
  errorMessage?: string
}

interface MediaGalleryProps {
  workspaceId: string
  token: string
  filter?: 'all' | 'image' | 'slide' | 'audio' | 'music' | 'video'
  onFilterChange?: (filter: 'all' | 'image' | 'slide' | 'audio' | 'music' | 'video') => void
}

export default function MediaGallery({ workspaceId, token, filter, onFilterChange }: MediaGalleryProps) {
  const [internalFilter, setInternalFilter] = useState<'all' | 'image' | 'slide' | 'audio' | 'music' | 'video'>('all')
  const [media, setMedia] = useState<MediaItem[]>([])
  const [decks, setDecks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null)

  const activeFilter = filter ?? internalFilter
  const setActiveFilter = (next: 'all' | 'image' | 'slide' | 'audio' | 'music' | 'video') => {
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
      default: return null
    }
  }

  useEffect(() => {
    loadMediaLibrary()
  }, [workspaceId, token])

  useEffect(() => {
    if (activeFilter === 'slide') {
      const firstReadyDeck = decks.find((deck) => String(deck.status || '').toLowerCase() === 'ready')
      const firstDeck = firstReadyDeck || decks[0]
      if (firstDeck && editingDeckId !== firstDeck.id) {
        setEditingDeckId(firstDeck.id)
      }
      if (!firstDeck) {
        setEditingDeckId(null)
      }
      return
    }
    if (editingDeckId) {
      setEditingDeckId(null)
    }
  }, [activeFilter, decks, editingDeckId])

  const loadMediaLibrary = async () => {
    try {
      setLoading(true)
      const [decksResult, imagesResult, audioResult, musicResult, videoResult] = await Promise.allSettled([
        slidesApi.getDecks(token),
        slidesApi.listImages(workspaceId, token),
        slidesApi.listAudio(workspaceId, token),
        slidesApi.listMusic(workspaceId, token),
        slidesApi.listVideo(workspaceId, token),
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

      mappedMedia.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      setMedia(mappedMedia)
    } catch (err) {
      console.error('Failed to load media library:', err)
    } finally {
      setLoading(false)
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

      {/* Editing Deck - Full View when Slides filter active */}
      {editingDeckId && activeFilter === 'slide' ? (
        <div className="border border-cyan-400/40 rounded-xl p-6 bg-cyan-500/5">
          <DeckEditor
            deckId={editingDeckId}
            token={token}
            onClose={() => setEditingDeckId(null)}
            onExport={() => {}}
          />
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-300" />
        </div>
      ) : activeFilter === 'slide' && editingDeckId ? (
        null
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

                  {canEditDeck && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingDeckId(deck.id)}
                        className="flex-1 cyber-button text-xs px-3 py-2 rounded-full flex items-center justify-center gap-2"
                      >
                        <Edit className="w-3 h-3" />
                        Edit Slides
                      </button>
                      <button className="cyber-outline text-xs px-3 py-2 rounded-full flex items-center justify-center gap-2">
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(deck.createdAt).toLocaleString()}
                  </p>
                </div>
              )
            }

            // Render regular media card
            return (
              <div
                key={item.id}
                className="border border-white/10 rounded-xl p-4 bg-black/30 hover:bg-black/40 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(item.type)}
                    <span className="text-sm font-medium capitalize">{item.type}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                {item.status === 'processing' && (
                  <div className="mb-3">
                    <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-full animate-[progress_loop_1.1s_linear_infinite] bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
                    </div>
                  </div>
                )}

                {item.status === 'failed' && 'errorMessage' in item && item.errorMessage && (
                  <p className="text-xs text-red-300 mb-3">{item.errorMessage}</p>
                )}

                {item.status === 'completed' && (
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 cyber-outline text-xs px-3 py-2 rounded-full flex items-center justify-center gap-2">
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                    <button className="cyber-outline text-xs px-3 py-2 rounded-full text-red-300 border-red-400/40 hover:bg-red-500/10">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-2">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
