import type { Wine } from '@/types/wine';
import { getMaturity, styleFamily } from './cellar';

export const occasions = ['unwind', 'dinner', 'company', 'celebrate', 'dessert'] as const;
export type Occasion = typeof occasions[number];
export type EveningPlan = { wineId: string; title: string; reason: string; meal: string; question: string };
export const occasionCopy = {
  en: {
    unwind: { label: 'Just because', title: 'No occasion required.', question: 'What small thing made today a good day?' },
    dinner: { label: 'Dinner for two', title: 'A table for two. No rush.', question: 'Which meal would you travel back in time to have again?' },
    company: { label: 'Friends over', title: 'Pull up another chair.', question: 'If this table could move anywhere in the world, where would we go?' },
    celebrate: { label: 'A little celebration', title: 'To something worth a toast.', question: 'What deserves a little more celebration in your life?' },
    dessert: { label: 'Something sweet', title: 'Save the best for last.', question: 'What is the dessert you will always have room for?' },
  },
  pt: {
    unwind: { label: 'Sem motivo', title: 'Não precisa de ocasião.', question: 'Que pequena coisa fez seu dia valer a pena?' },
    dinner: { label: 'Jantar a dois', title: 'Uma mesa a dois. Sem pressa.', question: 'Que refeição você voltaria no tempo para repetir?' },
    company: { label: 'Amigos em casa', title: 'Puxe mais uma cadeira.', question: 'Se esta mesa pudesse viajar, para onde iríamos?' },
    celebrate: { label: 'Uma celebração', title: 'Um brinde ao que importa.', question: 'O que merece ser mais celebrado na sua vida?' },
    dessert: { label: 'Algo doce', title: 'O melhor fica para o final.', question: 'Para qual sobremesa você sempre tem espaço?' },
  },
};

export function isOccasion(value: unknown): value is Occasion {
  return typeof value === 'string' && occasions.includes(value as Occasion);
}

// The same inventory rules are used by the card and its authenticated AI endpoint.
export function occasionPicks(wines: Wine[], occasion: Occasion, year: number): Wine[] {
  const available = wines.filter(w => w.status === 'in_cellar' && w.quantity > 0
    && (occasion === 'dessert' ? styleFamily(w.style) === 'sweet' : styleFamily(w.style) !== 'sweet'));
  const score = (w: Wine) => {
    const maturity = getMaturity(w, year);
    return (maturity === 'ready' ? 20 : maturity === 'unknown' ? 5 : 0)
      + (occasion === 'celebrate' && styleFamily(w.style) === 'sparkling' ? 12 : 0)
      + (occasion === 'company' ? Math.min(w.quantity, 4) : 0)
      + (occasion === 'unwind' && w.coravin ? 6 : 0);
  };
  return available.sort((a, b) => score(b) - score(a) || a.bottle.localeCompare(b.bottle));
}

export function windowNote(wine: Wine, year: number, locale: 'en' | 'pt'): string {
  const pt = locale === 'pt';
  const years = wine.drinkingWindow?.match(/\b(?:19|20|21)\d{2}\b/g)?.map(Number) || [];
  if (years.length >= 2 && year > years[1]) return pt ? 'Além da janela estimada · confira a condição' : 'Beyond its estimated window · check condition';
  if (years.length >= 2 && year >= years[0]) return pt ? 'Dentro da janela estimada' : 'Within its estimated drinking window';
  if (years.length && year < years[0]) return pt ? `Janela estimada a partir de ${years[0]}` : `Estimated window starts in ${years[0]}`;
  return wine.drinkingWindow || (pt ? 'Sem janela de consumo confirmada' : 'Drinking window not confirmed');
}

export function localEvening(wine: Wine, occasion: Occasion, year: number, locale: 'en' | 'pt'): EveningPlan {
  const pt = locale === 'pt';
  const family = styleFamily(wine.style);
  const dishes = {
    red: pt ? 'Cogumelos assados com ervas e polenta cremosa.' : 'Herb-roasted mushrooms over creamy polenta.',
    white: pt ? 'Peixe grelhado com limão e legumes da estação.' : 'Lemon-grilled fish and seasonal vegetables.',
    rose: pt ? 'Legumes grelhados e uma salada de tomate.' : 'Grilled vegetables and a ripe tomato salad.',
    sparkling: pt ? 'Batatas fritas crocantes e um prato de queijos.' : 'Crisp fries and a little cheese board.',
    sweet: pt ? 'Queijo azul, peras e nozes tostadas.' : 'Blue cheese, sliced pears and toasted walnuts.',
    orange: pt ? 'Couve-flor assada com especiarias e tahine.' : 'Spiced roast cauliflower with tahini.',
  };
  const place = [wine.region, wine.country].filter(Boolean).join(', ');
  return {
    wineId: wine.id, title: occasionCopy[locale][occasion].title,
    reason: `${place ? (pt ? `Uma viagem a ${place}, sem sair da mesa. ` : `A little trip to ${place}, without leaving the table. `) : ''}${windowNote(wine, year, locale)}.`,
    meal: wine.mealToHaveWithThisWine?.trim() || dishes[family],
    question: occasionCopy[locale][occasion].question,
  };
}

// Never let generated IDs, missing fields or unbounded text drive the UI/actions.
export function parseEveningPlan(value: unknown, wines: Wine[]): EveningPlan | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const limits = { wineId: 200, title: 90, reason: 400, meal: 240, question: 200 };
  for (const [key, limit] of Object.entries(limits)) {
    if (typeof raw[key] !== 'string' || !raw[key].trim() || raw[key].length > limit) return null;
  }
  if (!wines.some(w => w.id === raw.wineId && w.status === 'in_cellar' && w.quantity > 0)) return null;
  return Object.fromEntries(Object.keys(limits).map(key => [key, (raw[key] as string).trim()])) as EveningPlan;
}
