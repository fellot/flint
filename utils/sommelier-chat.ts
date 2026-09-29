import type { PalateEvidence } from '@/types/palate';

export type ChatReply = {
  type: 'recommendation' | 'question' | 'answer'; question?: string; answer?: string;
  wineId?: string; bottle?: string; reason?: string; servingTemperature?: string; decanting?: string;
  wine?: { region: string; vintage: number; location: string; bottle_image?: string };
  evidence?: PalateEvidence[];
  adventurousAlternative?: { bottle: string; reason: string } | null;
};

export function formatSommelierReply(reply: ChatReply, pt: boolean) {
  if (reply.type === 'question') return reply.question || '';
  if (reply.type === 'answer') return reply.answer || '';
  const details = [reply.wine?.region, reply.wine?.vintage || 'NV'].filter(Boolean).join(' · ');
  const lines = [
    `${pt ? 'Eu escolheria' : 'I’d open'}: ${reply.bottle}${details ? ` (${details})` : ''}.`,
    reply.reason,
    reply.servingTemperature ? `${pt ? 'Sugestão de serviço' : 'Serving suggestion'}: ${reply.servingTemperature}` : '',
    reply.decanting ? `${pt ? 'Decantação sugerida' : 'Decanting suggestion'}: ${reply.decanting}` : '',
    reply.wine?.location ? `${pt ? 'Onde está' : 'Where to find it'}: ${reply.wine.location}` : '',
  ];
  if (reply.evidence?.length) lines.push(`${pt ? 'Do seu diário' : 'From your journal'}:\n${reply.evidence.map(e => `• ${e.bottle} ${e.vintage || 'NV'}${e.score === null ? '' : ` — ${e.score}/100`}`).join('\n')}`);
  if (reply.adventurousAlternative) lines.push(`${pt ? 'Para explorar' : 'An adventurous alternative'}: ${reply.adventurousAlternative.bottle}\n${reply.adventurousAlternative.reason}`);
  return lines.filter(Boolean).join('\n\n');
}
