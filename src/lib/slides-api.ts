import axios from 'axios';

const SLIDES_API_URL = process.env.NEXT_PUBLIC_SLIDES_API_URL || 'http://localhost:3001/api/v1';
const SERMON_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';

export interface SyncWorkspaceData {
  workspaceId: string;
  title: string;
  seriesTitle?: string;
  language?: string;
  mainScriptureRef: string;
  bigIdea: string;
  mainPoints: string[];
  audienceContext?: string;
  tone?: string;
  notes?: string;
  outline?: any;
  manuscript?: any;
  applications?: any[];
  questions?: any[];
}

export interface GenerateImageRequest {
  sermonId?: string;
  workspaceId?: string;
  prompt: string;
  provider: 'openai' | 'local';
  preset?: string;
}

export interface GenerateAudioRequest {
  sermonId?: string;
  workspaceId?: string;
  text: string;
  voiceId?: string;
  provider?: string;
  narrationPrompt?: string;
}

export interface GenerateMusicRequest {
  sermonId?: string;
  workspaceId?: string;
  prompt: string;
  genre?: string;
  durationSeconds?: number;
  provider?: string;
}

export interface GenerateVideoRequest {
  deckId?: string;
  audioId?: string;
  sermonId?: string;
  workspaceId?: string;
  resolution?: string;
}

export const slidesApi = {
  // Sync workspace to slides app
  syncWorkspace: async (workspaceData: SyncWorkspaceData, token: string) => {
    const response = await axios.post(
      `${SLIDES_API_URL}/sermons/from-workspace`,
      workspaceData,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  // Images
  generateImage: async (request: GenerateImageRequest, token: string) => {
    const response = await axios.post(
      `${SLIDES_API_URL}/images/generate`,
      request,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  getImage: (imageId: string, token: string) => {
    return `${SLIDES_API_URL}/images/${imageId}/download?token=${token}`;
  },

  getImageBlob: async (imageId: string, token: string) => {
    const response = await axios.get(
      `${SLIDES_API_URL}/images/${imageId}/download`,
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      }
    );
    return response.data as Blob;
  },

  listImages: async (workspaceId: string, token: string) => {
    const response = await axios.get(
      `${SLIDES_API_URL}/images/list/${workspaceId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  deleteImage: async (imageId: string, token: string) => {
    const response = await axios.delete(`${SLIDES_API_URL}/images/${imageId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Slides/Decks
  generateDeck: async (
    sermonId: string,
    themeId: string | undefined,
    token: string,
    deckSize: 'short' | 'standard' | 'long' = 'long',
    options?: {
      backgroundProvider?: 'local' | 'openai'
      backgroundPreset?: string
    }
  ) => {
    const response = await axios.post(
      `${SLIDES_API_URL}/sermons/${sermonId}/decks`,
      {
        themeId,
        deckSize,
        backgroundProvider: options?.backgroundProvider,
        backgroundPreset: options?.backgroundPreset,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  getDeck: async (deckId: string, token: string) => {
    const response = await axios.get(
      `${SLIDES_API_URL}/decks/${deckId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  getDecks: async (token: string) => {
    const response = await axios.get(
      `${SLIDES_API_URL}/decks`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  getSermons: async (token: string) => {
    const response = await axios.get(
      `${SLIDES_API_URL}/sermons`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  getSermon: async (sermonId: string, token: string) => {
    const response = await axios.get(
      `${SLIDES_API_URL}/sermons/${sermonId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  getThemes: async (token: string) => {
    const response = await axios.get(
      `${SLIDES_API_URL}/themes`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  getSlides: async (deckId: string, token: string) => {
    const response = await axios.get(
      `${SLIDES_API_URL}/decks/${deckId}/slides`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  generateSlideImage: async (
    slideId: string,
    provider: 'local' | 'openai',
    token: string,
    prompt?: string,
    preset?: string,
    target: 'background' | 'content' = 'background',
  ) => {
    const response = await axios.post(
      `${SLIDES_API_URL}/slides/${slideId}/image`,
      { provider, prompt, preset, target },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  updateSlide: async (slideId: string, data: any, token: string) => {
    const response = await axios.put(
      `${SLIDES_API_URL}/slides/${slideId}`,
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  getSlideImageBlob: async (slideId: string, token: string) => {
    const response = await axios.get(
      `${SLIDES_API_URL}/slides/${slideId}/image`,
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      }
    );
    return response.data as Blob;
  },

  exportDeck: async (deckId: string, format: 'pptx' | 'pdf', token: string) => {
    const response = await axios.post(
      `${SLIDES_API_URL}/decks/${deckId}/exports`,
      { type: format },
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      }
    );
    const blobUrl = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `deck-${deckId}.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
  },

  // Audio
  generateAudio: async (request: GenerateAudioRequest, token: string) => {
    const response = await axios.post(
      `${SLIDES_API_URL}/audio/generate`,
      request,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  getAudio: async (audioId: string, token: string) => {
    const response = await axios.get(
      `${SLIDES_API_URL}/audio/${audioId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  getAudioDownloadUrl: (audioId: string, token: string) => {
    return `${SLIDES_API_URL}/audio/${audioId}/download?token=${token}`;
  },

  getAudioBlob: async (audioId: string, token: string) => {
    const response = await axios.get(
      `${SLIDES_API_URL}/audio/${audioId}/download`,
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      }
    );
    return response.data as Blob;
  },

  listAudio: async (workspaceId: string, token: string) => {
    const response = await axios.get(
      `${SLIDES_API_URL}/audio/list/${workspaceId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  deleteAudio: async (audioId: string, token: string) => {
    const response = await axios.delete(`${SLIDES_API_URL}/audio/${audioId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  getVoices: async (token: string, provider: string = 'local') => {
    const response = await axios.get(
      `${SLIDES_API_URL}/audio/voices`,
      {
        params: { provider },
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  // Music
  generateMusic: async (request: GenerateMusicRequest, token: string) => {
    const response = await axios.post(
      `${SLIDES_API_URL}/music/generate`,
      request,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  getMusic: async (musicId: string, token: string) => {
    const response = await axios.get(
      `${SLIDES_API_URL}/music/${musicId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  selectMusicTrack: async (musicId: string, trackId: string, token: string) => {
    const response = await axios.post(
      `${SLIDES_API_URL}/music/${musicId}/select-track`,
      { trackId },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  getMusicDownloadUrl: (musicId: string, token: string) => {
    return `${SLIDES_API_URL}/music/${musicId}/download?token=${token}`;
  },

  getMusicBlob: async (musicId: string, token: string) => {
    const response = await axios.get(
      `${SLIDES_API_URL}/music/${musicId}/download`,
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      }
    );
    return response.data as Blob;
  },

  listMusic: async (workspaceId: string, token: string) => {
    const response = await axios.get(
      `${SLIDES_API_URL}/music/list/${workspaceId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  deleteMusic: async (musicId: string, token: string) => {
    const response = await axios.delete(`${SLIDES_API_URL}/music/${musicId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  getGenres: async (token: string) => {
    const response = await axios.get(
      `${SLIDES_API_URL}/music/genres`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  // Video
  generateVideo: async (request: GenerateVideoRequest, token: string) => {
    const response = await axios.post(
      `${SLIDES_API_URL}/video/generate`,
      request,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  getVideo: async (videoId: string, token: string) => {
    const response = await axios.get(
      `${SLIDES_API_URL}/video/${videoId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  getVideoDownloadUrl: (videoId: string, token: string) => {
    return `${SLIDES_API_URL}/video/${videoId}/download?token=${token}`;
  },

  getVideoBlob: async (videoId: string, token: string) => {
    const response = await axios.get(
      `${SLIDES_API_URL}/video/${videoId}/download`,
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      }
    );
    return response.data as Blob;
  },

  listVideo: async (workspaceId: string, token: string) => {
    const response = await axios.get(
      `${SLIDES_API_URL}/video/list/${workspaceId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  deleteVideo: async (videoId: string, token: string) => {
    const response = await axios.delete(`${SLIDES_API_URL}/video/${videoId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Social Media
  generateSocialKit: async (request: {
    sermonId?: string;
    workspaceId?: string;
    quote: string;
    caption: string;
    title: string;
    passage: string;
    prompt?: string;
    mode?: 'auto_multi_network' | 'core4' | 'manual';
    useCase?: string;
    overlay?: {
      eventTitle?: string;
      eventSubtitle?: string;
      serviceDate?: string;
      serviceTime?: string;
      timezone?: string;
      locationOverride?: string;
      churchName?: string;
      website?: string;
      phone?: string;
      logoUrl?: string;
      ctaText?: string;
      hashtags?: string;
      showLogo?: boolean;
      showAddress?: boolean;
      showWebsite?: boolean;
      showPhone?: boolean;
      showServiceTime?: boolean;
      preset?: 'minimal' | 'bold' | 'announcement';
      layoutVariant?: string;
      densityMode?: 'auto' | 'full' | 'minimal';
      imageProvider?: 'local' | 'openai';
      imagePreset?: string;
      language?: 'es' | 'en';
    };
  }, token: string) => {
    const response = await axios.post(
      `${SLIDES_API_URL}/social/generate`,
      request,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  getSocialMedia: async (socialId: string, token: string) => {
    const response = await axios.get(
      `${SLIDES_API_URL}/social/${socialId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  listSocial: async (workspaceId: string, token: string) => {
    const response = await axios.get(
      `${SLIDES_API_URL}/social/list/${workspaceId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  deleteSocial: async (socialId: string, token: string) => {
    const response = await axios.delete(`${SLIDES_API_URL}/social/${socialId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  getSocialBlob: async (socialId: string, token: string) => {
    const response = await axios.get(
      `${SLIDES_API_URL}/social/${socialId}/download`,
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      }
    );
    return response.data as Blob;
  },

  getChurchSettings: async (token: string) => {
    const response = await axios.get(`${SERMON_API_URL}/church-settings/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  updateChurchSettings: async (
    request: {
      churchName?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
      phone?: string;
      website?: string;
      logoUrl?: string;
      defaultTimezone?: string;
    },
    token: string,
  ) => {
    const response = await axios.patch(`${SERMON_API_URL}/church-settings/me`, request, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  uploadChurchLogo: async (file: File, token: string) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${SERMON_API_URL}/church-settings/me/logo`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Sermon Song Generation
  previewSermonSong: async (request: {
    sermonId: string;
    mode: string;
    style?: string;
    useCase?: string;
    studyPrompt?: string;
    language?: string;
  }, token: string) => {
    const response = await axios.post(
      `${SLIDES_API_URL}/music/sermon-song/preview`,
      request,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  generateSermonSong: async (request: {
    sermonId: string;
    workspaceId?: string;
    mode: string;
    style?: string;
    useCase?: string;
    duration?: number;
    studyPrompt?: string;
    language?: string;
  }, token: string) => {
    const response = await axios.post(
      `${SLIDES_API_URL}/music/sermon-song/generate`,
      request,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  generateSermonLyrics: async (request: {
    sermonId: string;
    style?: string;
    mode?: 'with_lyrics' | 'chorus_only';
    useCase?: string;
    studyPrompt?: string;
    language?: string;
  }, token: string) => {
    const response = await axios.post(
      `${SLIDES_API_URL}/music/sermon-song/lyrics`,
      request,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  updateSermonLyricsDraft: async (request: {
    sermonId: string;
    mode?: 'with_lyrics' | 'chorus_only';
    style?: string;
    useCase?: string;
    studyPrompt?: string;
    language?: string;
    elements?: Record<string, any> | null;
    lyrics: {
      title?: string;
      themeStatement?: string;
      verse1?: string[];
      chorus?: string[];
      verse2?: string[];
      bridge?: string[];
      outro?: string[];
      keyPhrases?: string[];
      scriptureAnchors?: string[];
    };
  }, token: string) => {
    const response = await axios.post(
      `${SLIDES_API_URL}/music/sermon-song/lyrics-draft`,
      request,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },
};
