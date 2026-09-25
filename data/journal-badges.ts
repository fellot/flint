import { CELLAR_ESSENTIALS, type GuideCategory, type LocalizedText } from './cellar-essentials';

export interface JournalBadgeDefinition {
  id: string;
  family: 'essential' | 'discovery';
  name: LocalizedText;
  description: LocalizedText;
  icon: 'wine' | 'grape' | 'compass' | 'sparkles' | 'landmark';
  category?: GuideCategory;
}

/** One badge per discovery, independent of bottle quantities and scores. */
export const JOURNAL_BADGES: JournalBadgeDefinition[] = [
  ...CELLAR_ESSENTIALS.map((essential): JournalBadgeDefinition => ({
    id: `essential:${essential.id}`,
    family: 'essential',
    name: essential.name,
    description: {
      en: `Record a ${essential.name.en} tasting in your personal journal.`,
      pt: `Registre uma degustação de ${essential.name.pt} no seu diário pessoal.`,
    },
    icon: 'wine',
    category: essential.category,
  })),
  {
    id: 'discovery:tuscany', family: 'discovery', icon: 'landmark',
    name: { en: 'A taste of Tuscany', pt: 'Um sabor da Toscana' },
    description: {
      en: 'Record a wine from Tuscany, including Brunello, Chianti or Bolgheri.',
      pt: 'Registre um vinho da Toscana, incluindo Brunello, Chianti ou Bolgheri.',
    },
  },
  {
    id: 'discovery:bordeaux', family: 'discovery', icon: 'landmark',
    name: { en: 'Bordeaux passport', pt: 'Passaporte de Bordeaux' },
    description: {
      en: 'Record a wine from Bordeaux: either bank, or its white and sweet wines.',
      pt: 'Registre um vinho de Bordeaux: de qualquer margem, branco ou doce.',
    },
  },
  {
    id: 'discovery:super-tuscan', family: 'discovery', icon: 'sparkles', category: 'red',
    name: { en: 'Super Tuscans', pt: 'Supertoscanos' },
    description: {
      en: 'Record a red explicitly identified as Super Tuscan, or a recognized Tignanello or Sassicaia. Brunello and Chianti do not qualify just for being Tuscan.',
      pt: 'Registre um tinto identificado como Supertoscano, ou um Tignanello ou Sassicaia reconhecido. Brunello e Chianti não se qualificam apenas por serem toscanos.',
    },
  },
  {
    id: 'discovery:loire', family: 'discovery', icon: 'compass',
    name: { en: 'Along the Loire', pt: 'Pelo Loire' },
    description: {
      en: 'Record a wine from the Loire Valley, from Muscadet to Sancerre.',
      pt: 'Registre um vinho do Vale do Loire, de Muscadet a Sancerre.',
    },
  },
  {
    id: 'discovery:volcanic', family: 'discovery', icon: 'grape',
    name: { en: 'Volcanic origins', pt: 'Origens vulcânicas' },
    description: {
      en: 'Explore volcanic wine country with a recorded tasting from Etna or Santorini.',
      pt: 'Explore terras vulcânicas com uma degustação registrada do Etna ou de Santorini.',
    },
  },
];
