export type CampaignRole =
  | 'main_invitation'
  | 'devotional_teaser'
  | 'story_invite'
  | 'reflection_question'
  | 'youtube_thumbnail'
  | 'whatsapp_forward';

export const CAMPAIGN_ROLE_LABELS: Record<CampaignRole, { label: string; emoji: string; desc: string }> = {
  main_invitation: { label: 'Main Invitation', emoji: '🎯', desc: 'Facebook banner with event details' },
  devotional_teaser: { label: 'Devotional Teaser', emoji: '💭', desc: 'Instagram quote card' },
  story_invite: { label: 'Story Invite', emoji: '📱', desc: 'Instagram story invitation' },
  reflection_question: { label: 'Reflection Question', emoji: '❓', desc: 'Instagram story engagement' },
  youtube_thumbnail: { label: 'YouTube Thumbnail', emoji: '▶️', desc: 'Video thumbnail' },
  whatsapp_forward: { label: 'WhatsApp Forward', emoji: '💬', desc: 'Status share' },
};

export const CAMPAIGN_ROLE_COLORS: Record<CampaignRole, string> = {
  main_invitation: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
  devotional_teaser: 'bg-purple-500/20 text-purple-200 border-purple-400/30',
  story_invite: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/30',
  reflection_question: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
  youtube_thumbnail: 'bg-red-500/20 text-red-200 border-red-400/30',
  whatsapp_forward: 'bg-green-500/20 text-green-200 border-green-400/30',
};

export function formatServiceDetails(input: {
  churchName: string;
  address: string;
  serviceDate: string;
  serviceTime: string;
  timezoneLabel: string;
  livestreamUrl: string;
}): string {
  const lines: string[] = [];
  if (input.serviceDate || input.serviceTime) {
    lines.push([input.serviceDate, input.serviceTime].filter(Boolean).join(' • '));
  }
  if (input.churchName) lines.push(input.churchName);
  if (input.address) lines.push(input.address);
  if (input.livestreamUrl) lines.push(input.livestreamUrl);
  return lines.join('\n');
}
