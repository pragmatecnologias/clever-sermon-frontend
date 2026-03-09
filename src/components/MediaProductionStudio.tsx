'use client'

import { useState } from 'react'
import { Sparkles, FileText, Image, Mic, Music, Video, Share2, Loader2 } from 'lucide-react'
import { slidesApi } from '@/lib/slides-api'
import SlideGenerationPanel from './SlideGenerationPanel'
import ImageGenerationPanel from './ImageGenerationPanel'
import AudioGenerationPanel from './AudioGenerationPanel'
import MusicGenerationPanel from './MusicGenerationPanel'
import VideoGenerationPanel from './VideoGenerationPanel'
import MediaGallery from './MediaGallery'
import SermonMusicGenerator from './SermonMusicGenerator'

interface MediaProductionStudioProps {
  workspace: any
  token: string
}

type MediaFilter = 'all' | 'image' | 'slide' | 'audio' | 'music' | 'video'

export default function MediaProductionStudio({ workspace, token }: MediaProductionStudioProps) {
  const [generatingAll, setGeneratingAll] = useState(false)
  const [currentStep, setCurrentStep] = useState<string>('')
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all')

  // Auto-generate sermon summary for prompts
  const sermonSummary = {
    title: workspace.title || 'Untitled Sermon',
    passage: workspace.mainPassage || '',
    theme: workspace.theme || workspace.sermonGoals || '',
    tone: workspace.metadata?.tone || 'encouraging',
    outline: workspace.outlines?.[0]?.structure?.points || [],
    manuscript: workspace.manuscripts?.[0]?.content?.text || '',
    applications: workspace.applications || [],
    illustrations: workspace.illustrations || [],
  }

  // Auto-generate prompts based on sermon content
  const autoPrompts = {
    image: `Cinematic church background for sermon "${sermonSummary.title}" about ${sermonSummary.theme}. Passage: ${sermonSummary.passage}. Style: modern, inspiring, ${sermonSummary.tone}.`,
    
    music: `${sermonSummary.tone} worship background music for sermon about ${sermonSummary.theme}. Genre: contemporary worship with piano and strings. Mood: ${sermonSummary.tone}.`,
    
    social: {
      quote: extractBestQuote(sermonSummary.manuscript, sermonSummary.applications),
      caption: `${sermonSummary.title} | ${sermonSummary.passage}\n\n${sermonSummary.theme}`,
    },
  }

  function extractBestQuote(manuscript: string, applications: any[]): string {
    // Extract a powerful quote from manuscript or applications
    if (applications.length > 0 && applications[0].content) {
      const content = typeof applications[0].content === 'string' 
        ? applications[0].content 
        : applications[0].content.text || ''
      const sentences = content.split(/[.!?]/).filter((s: string) => s.trim().length > 20)
      return sentences[0]?.trim() || sermonSummary.theme
    }
    
    if (manuscript) {
      const sentences = manuscript.split(/[.!?]/).filter((s: string) => s.trim().length > 30 && s.trim().length < 150)
      return sentences[0]?.trim() || sermonSummary.theme
    }
    
    return sermonSummary.theme
  }

  const handleGenerateAll = async () => {
    setGeneratingAll(true)
    setCompletedSteps([])
    let sermonId: string | null = null
    let deckId: string | null = null
    let audioId: string | null = null
    
    try {
      // Step 0: Sync workspace to slides app
      setCurrentStep('Syncing workspace...')
      const syncData = {
        workspaceId: workspace.id,
        title: sermonSummary.title,
        seriesTitle: workspace.seriesTitle,
        mainScriptureRef: sermonSummary.passage,
        bigIdea: sermonSummary.theme,
        mainPoints: sermonSummary.outline.map((p: any) => 
          typeof p === 'string' ? p : (p.title || p.content || '')
        ),
        audienceContext: workspace.audienceProfile,
        tone: sermonSummary.tone,
        notes: sermonSummary.manuscript,
        outline: workspace.outlines?.[0],
        manuscript: workspace.manuscripts?.[0],
        applications: sermonSummary.applications,
        questions: workspace.questions || [],
      }
      const sermon = await slidesApi.syncWorkspace(syncData, token)
      sermonId = sermon.id
      
      // Step 1: Generate Slides
      setCurrentStep('Generating slide deck...')
      const deck = await slidesApi.generateDeck(sermonId!, undefined, token)
      deckId = deck.id
      
      // Wait for deck to be ready
      await pollDeckStatus(deckId!)
      setCompletedSteps(prev => [...prev, 'slides'])
      
      // Step 2: Generate Images
      setCurrentStep('Generating sermon images...')
      await slidesApi.generateImage({
        sermonId: sermonId || undefined,
        workspaceId: workspace.id,
        prompt: autoPrompts.image,
        provider: 'local',
        preset: 'modern',
      }, token)
      setCompletedSteps(prev => [...prev, 'images'])
      
      // Step 3: Generate Audio
      setCurrentStep('Generating audio narration...')
      const audio = await slidesApi.generateAudio({
        sermonId: sermonId || undefined,
        workspaceId: workspace.id,
        text: sermonSummary.manuscript.substring(0, 5000), // Limit for API
        provider: 'elevenlabs',
      }, token)
      audioId = audio.id
      setCompletedSteps(prev => [...prev, 'audio'])
      
      // Step 4: Generate Sermon Theme Song
      setCurrentStep('Generating sermon theme song...')
      await slidesApi.generateSermonSong({
        sermonId: sermonId!,
        workspaceId: workspace.id,
        mode: 'with_lyrics',
        style: 'worship',
        useCase: 'theme-song',
        duration: 180,
      }, token)
      setCompletedSteps(prev => [...prev, 'music'])
      
      // Step 5: Generate Video (if we have deck and audio)
      if (deckId && audioId) {
        setCurrentStep('Composing final video...')
        await slidesApi.generateVideo({
          deckId: deckId || undefined,
          audioId: audioId || undefined,
          sermonId: sermonId || undefined,
          workspaceId: workspace.id,
          resolution: '1920x1080',
        }, token)
        setCompletedSteps(prev => [...prev, 'video'])
      }
      
      // Step 6: Generate Social Media
      setCurrentStep('Creating social media assets...')
      await slidesApi.generateSocialKit({
        sermonId: sermonId || undefined,
        workspaceId: workspace.id,
        quote: autoPrompts.social.quote,
        caption: autoPrompts.social.caption,
        title: sermonSummary.title,
        passage: sermonSummary.passage,
      }, token)
      setCompletedSteps(prev => [...prev, 'social'])
      
      setCurrentStep('Complete! All media generated.')
    } catch (err: any) {
      console.error('Failed to generate all media:', err)
      setCurrentStep(`Error: ${err.message || 'Generation failed'}`)
    } finally {
      setGeneratingAll(false)
    }
  }

  const pollDeckStatus = async (deckId: string, maxAttempts = 30): Promise<void> => {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      const deck = await slidesApi.getDeck(deckId, token)
      if (deck.status === 'ready') return
      if (deck.status === 'failed') throw new Error('Deck generation failed')
    }
    throw new Error('Deck generation timeout')
  }

  const mediaTypes = [
    { id: 'slides', label: 'Slide Deck', icon: FileText, color: 'purple', description: 'PowerPoint presentation' },
    { id: 'images', label: 'Images', icon: Image, color: 'blue', description: 'Sermon visuals' },
    { id: 'audio', label: 'Audio', icon: Mic, color: 'green', description: 'Narration & podcast' },
    { id: 'music', label: 'Theme Song', icon: Music, color: 'pink', description: 'Sermon worship music' },
    { id: 'video', label: 'Video', icon: Video, color: 'orange', description: 'Full sermon video' },
    { id: 'social', label: 'Social Kit', icon: Share2, color: 'cyan', description: 'Posts & graphics' },
  ]

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="cyber-panel rounded-2xl p-8 bg-gradient-to-br from-purple-900/20 to-pink-900/20">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Sermon Production Studio</h2>
            <p className="text-gray-300 mb-4">
              Transform your sermon into church-ready media assets
            </p>
            <div className="flex flex-wrap gap-2">
              {mediaTypes.map(type => (
                <div
                  key={type.id}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
                    completedSteps.includes(type.id)
                      ? `bg-${type.color}-500/20 text-${type.color}-200 border border-${type.color}-400/40`
                      : 'bg-white/5 text-gray-400 border border-white/10'
                  }`}
                >
                  <type.icon className="w-3 h-3" />
                  {type.label}
                  {completedSteps.includes(type.id) && <span>✓</span>}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={handleGenerateAll}
            disabled={generatingAll}
            className="cyber-button px-6 py-3 rounded-xl flex items-center gap-2 text-lg font-semibold"
          >
            {generatingAll ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {currentStep}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Complete Media Package
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generation Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Slides - Primary Feature */}
        {(mediaFilter === 'all' || mediaFilter === 'slide') && (
          <div className="lg:col-span-2">
            <SlideGenerationPanel 
              workspace={workspace} 
              token={token}
              onGenerated={() => setRefreshKey(prev => prev + 1)}
            />
          </div>
        )}

        {/* Images */}
        {(mediaFilter === 'all' || mediaFilter === 'image') && (
          <div className="lg:col-span-2">
            <ImageGenerationPanel
              workspaceId={workspace.id}
              workspaceData={{
                title: sermonSummary.title,
                theme: sermonSummary.theme,
                mainPassage: sermonSummary.passage,
              }}
              token={token}
              autoPrompt={autoPrompts.image}
            />
          </div>
        )}

        {/* Audio */}
        {(mediaFilter === 'all' || mediaFilter === 'audio') && (
          <div className="lg:col-span-2">
            <AudioGenerationPanel
              workspaceId={workspace.id}
              workspace={workspace}
              token={token}
              autoText={sermonSummary.manuscript}
            />
          </div>
        )}

        {/* Sermon Theme Song Generator - New Feature */}
        {(mediaFilter === 'all' || mediaFilter === 'music') && (
          <div className="lg:col-span-2">
            <SermonMusicGenerator
              workspace={workspace}
              sermonId={workspace.sermonId}
              token={token}
            />
          </div>
        )}

        {/* Video */}
        {(mediaFilter === 'all' || mediaFilter === 'video') && (
          <div className="lg:col-span-2">
            <VideoGenerationPanel workspaceId={workspace.id} token={token} />
          </div>
        )}

        {/* Social Media Kit - New Feature */}
        {mediaFilter === 'all' && (
          <div className="border border-white/10 rounded-xl p-6 bg-black/20 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Share2 className="w-6 h-6 text-cyan-300" />
              <h3 className="text-lg font-semibold">Social Media Kit</h3>
            </div>

            <div className="border border-cyan-400/40 bg-cyan-500/10 text-cyan-100 text-sm rounded-xl px-4 py-3">
              <p className="font-medium mb-1">Sermon Promotion Assets</p>
              <p className="text-xs text-cyan-200/80">
                Generate quote graphics, thumbnails, and short clips for social media
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">
                  Featured Quote
                </label>
                <textarea
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm min-h-[80px]"
                  defaultValue={autoPrompts.social.quote}
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-widest text-gray-400 mb-2 block">
                  Social Caption
                </label>
                <textarea
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm min-h-[60px]"
                  defaultValue={autoPrompts.social.caption}
                />
              </div>

              <button
                className="w-full cyber-button text-sm px-4 py-3 rounded-xl flex items-center justify-center gap-2"
                disabled
              >
                <Share2 className="w-4 h-4" />
                Generate Social Kit (Coming Soon)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Media Library */}
      <div className="cyber-panel rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">Media Library</h3>
        <MediaGallery 
          workspaceId={workspace.id} 
          token={token}
          key={refreshKey}
          filter={mediaFilter}
          onFilterChange={setMediaFilter}
        />
      </div>
    </div>
  )
}
