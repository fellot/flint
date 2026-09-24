import type { Wine } from '../types/wine';

// These are deliberately narrow matches against recorded metadata, not an
// inference about the wine. An unmatched bottle may simply need better details.
function normalize(value: string): string {
  return (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, ' ').trim();
}

function includes(text: string, ...phrases: string[]): boolean {
  const words = ` ${text} `;
  return phrases.some(phrase => words.includes(` ${normalize(phrase)} `));
}

type Style = 'red' | 'white' | 'rose' | 'sparkling' | 'sweet' | 'fortified';
const styles: Record<Style, string[]> = {
  red: ['red', 'tinto', 'vinho tinto'],
  white: ['white', 'branco', 'vinho branco'],
  rose: ['rosé', 'rosado', 'vinho rosé'],
  sparkling: ['sparkling', 'espumante'],
  sweet: ['sweet', 'dessert', 'doce', 'sobremesa'],
  fortified: ['fortified', 'fortificado'],
};

const countries = {
  france: ['France', 'França', 'Francia'],
  italy: ['Italy', 'Italia', 'Itália'],
  spain: ['Spain', 'España', 'Espanha'],
  australia: ['Australia', 'Austrália'],
  argentina: ['Argentina'],
  usa: ['United States', 'United States of America', 'USA', 'US', 'Estados Unidos', 'EUA'],
  portugal: ['Portugal'],
  chile: ['Chile'],
  newZealand: ['New Zealand', 'Nova Zelândia'],
  germany: ['Germany', 'Deutschland', 'Alemanha'],
  austria: ['Austria', 'Österreich', 'Áustria'],
  greece: ['Greece', 'Grécia', 'Hellas'],
  hungary: ['Hungary', 'Hungria', 'Magyarország'],
  canada: ['Canada', 'Canadá'],
};

type Context = { identity: string; grape: string; declaredGrapes: string; style: string; country: string };
type Rule = (wine: Context) => boolean;

function from(style: Style, country: keyof typeof countries, check: Rule): Rule {
  return wine => styles[style].some(value => normalize(value) === wine.style)
    && countries[country].some(value => normalize(value) === wine.country)
    && check(wine);
}

const origin = (wine: Context, ...values: string[]) => includes(wine.identity, ...values);
const grape = (wine: Context, ...values: string[]) => includes(wine.grape, ...values);
// Appellations can establish the grape when it is not recorded, but an explicit
// contradictory grape field is a reason to leave the bottle unmatched.
const compatibleGrape = (wine: Context, ...values: string[]) => !wine.declaredGrapes
  || ['unknown', 'not specified', 'n a', 'desconhecido'].includes(wine.declaredGrapes)
  || includes(wine.declaredGrapes, ...values);
const sweetMarkers = [
  'sweet', 'doce', 'suave', 'semi sweet', 'semisweet', 'off dry', 'offdry', 'demi sec', 'demi seco',
  'meio seco', 'semi seco', 'moelleux', 'doux', 'dolce', 'amabile', 'lieblich',
  'feinherb', 'halbtrocken', 'late harvest', 'colheita tardia', 'vendanges tardives',
  'beerenauslese', 'trockenbeerenauslese', 'eiswein', 'icewine', 'cream', 'medium',
];
const notSweet = (wine: Context) => !origin(wine, ...sweetMarkers);
const dryRiesling = (wine: Context) => notSweet(wine)
  && origin(wine, 'trocken', 'GG', 'Grosses Gewächs', 'Grosses Gewaechs', 'dry', 'seco');
const drySparkling = (wine: Context) => notSweet(wine)
  && !origin(wine, 'extra dry', 'extra seco', 'sec', 'demi sec', 'seco')
  && origin(wine, 'brut', 'pas dosé', 'pas dosato', 'dosage zéro', 'zero dosage');
const agedWhite = (wine: Context) => !origin(wine, 'unoaked', 'sin barrica', 'sem madeira', 'joven', 'jovem')
  && origin(wine, 'reserva', 'crianza', 'oak aged', 'barrel aged', 'aged in oak', 'aged in barrel',
    'envejecido en barrica', 'criado en barrica', 'envelhecido em carvalho', 'élevé en fût');

const rules: Record<string, Rule> = {
  'barossa-shiraz': from('red', 'australia', w => origin(w, 'Barossa') && !origin(w, 'Eden Valley') && grape(w, 'Shiraz', 'Syrah')),
  'rhone-syrah': from('red', 'france', w => compatibleGrape(w, 'Syrah', 'Shiraz')
    && (origin(w, 'Côte Rôtie', 'Hermitage', 'Crozes Hermitage', 'Cornas', 'Saint Joseph', 'St Joseph')
    || (origin(w, 'Northern Rhône', 'Rhône septentrional') && grape(w, 'Syrah', 'Shiraz')))),
  'bordeaux-left': from('red', 'france', w => origin(w, 'Pauillac', 'Saint Julien', 'St Julien', 'Margaux', 'Pessac Léognan', 'Saint Estèphe', 'St Estèphe', 'Médoc', 'Graves')
    || (origin(w, 'Bordeaux') && origin(w, 'Left Bank', 'Rive gauche'))),
  'bordeaux-right': from('red', 'france', w => origin(w, 'Saint Émilion', 'St Émilion', 'Pomerol', 'Fronsac')
    || (origin(w, 'Bordeaux') && origin(w, 'Right Bank', 'Rive droite'))),
  'burgundy-pinot': from('red', 'france', w => origin(w, 'Burgundy', 'Bourgogne', 'Côte de Nuits', 'Côte de Beaune', 'Gevrey Chambertin', 'Chambolle Musigny', 'Vosne Romanée', 'Nuits Saint Georges', 'Volnay', 'Pommard') && grape(w, 'Pinot Noir')),
  'barolo-barbaresco': from('red', 'italy', w => origin(w, 'Barolo', 'Barbaresco') && compatibleGrape(w, 'Nebbiolo')),
  brunello: from('red', 'italy', w => origin(w, 'Brunello di Montalcino', 'Brunello') && compatibleGrape(w, 'Sangiovese', 'Brunello')),
  'rioja-red': from('red', 'spain', w => origin(w, 'Rioja') && grape(w, 'Tempranillo', 'Tinta del País', 'Tinto Fino')),
  ribera: from('red', 'spain', w => origin(w, 'Ribera del Duero') && grape(w, 'Tempranillo', 'Tinta del País', 'Tinto Fino', 'Tinto del País')),
  'mendoza-malbec': from('red', 'argentina', w => origin(w, 'Mendoza', 'Uco', 'Luján de Cuyo') && grape(w, 'Malbec')),
  'napa-cabernet': from('red', 'usa', w => origin(w, 'Napa', 'Oakville', 'Rutherford', 'Stags Leap District', 'Stag s Leap District', 'Howell Mountain', 'Mount Veeder') && grape(w, 'Cabernet Sauvignon')),
  'southern-rhone': from('red', 'france', w => origin(w, 'Châteauneuf du Pape', 'Gigondas', 'Southern Rhône', 'Rhône méridional') && grape(w, 'Grenache', 'Garnacha')),
  'douro-red': from('red', 'portugal', w => origin(w, 'Douro') && grape(w, 'Touriga Nacional', 'Touriga Franca', 'Touriga Francesa', 'Tinta Roriz', 'Tinta Barroca', 'Tinto Cão')),
  beaujolais: from('red', 'france', w => !origin(w, 'Nouveau', 'Primeur') && compatibleGrape(w, 'Gamay')
    && origin(w, 'Morgon', 'Fleurie', 'Moulin à Vent', 'Brouilly', 'Chénas', 'Chiroubles', 'Juliénas', 'Régnié', 'Saint Amour', 'St Amour')),
  carmenere: from('red', 'chile', w => origin(w, 'Colchagua', 'Cachapoal') && grape(w, 'Carménère')),
  chablis: from('white', 'france', w => notSweet(w) && origin(w, 'Chablis') && compatibleGrape(w, 'Chardonnay')),
  'cote-beaune': from('white', 'france', w => notSweet(w) && compatibleGrape(w, 'Chardonnay')
    && (origin(w, 'Meursault', 'Puligny Montrachet', 'Chassagne Montrachet') || (origin(w, 'Côte de Beaune') && grape(w, 'Chardonnay')))),
  'sancerre-pouilly': from('white', 'france', w => notSweet(w) && origin(w, 'Sancerre', 'Pouilly Fumé') && compatibleGrape(w, 'Sauvignon Blanc')),
  'marlborough-sauvignon': from('white', 'newZealand', w => notSweet(w) && origin(w, 'Marlborough') && grape(w, 'Sauvignon Blanc')),
  'german-riesling': from('white', 'germany', w => dryRiesling(w) && grape(w, 'Riesling')),
  savennieres: from('white', 'france', w => notSweet(w) && origin(w, 'Savennières') && compatibleGrape(w, 'Chenin Blanc', 'Chenin')),
  gruner: from('white', 'austria', w => notSweet(w) && origin(w, 'Wachau', 'Kamptal') && grape(w, 'Grüner Veltliner')),
  albarino: from('white', 'spain', w => notSweet(w) && origin(w, 'Rías Baixas') && grape(w, 'Albariño')),
  assyrtiko: from('white', 'greece', w => notSweet(w) && origin(w, 'Santorini') && grape(w, 'Assyrtiko')),
  champagne: from('sparkling', 'france', w => drySparkling(w) && origin(w, 'Champagne')),
  franciacorta: from('sparkling', 'italy', w => drySparkling(w) && origin(w, 'Franciacorta')),
  cava: from('sparkling', 'spain', w => drySparkling(w) && origin(w, 'Cava')),
  'provence-rose': from('rose', 'france', w => notSweet(w) && origin(w, 'Provence') && !origin(w, 'Bandol')),
  'bandol-rose': from('rose', 'france', w => notSweet(w) && origin(w, 'Bandol')),
  'fino-manzanilla': from('fortified', 'spain', w => notSweet(w)
    && (origin(w, 'Manzanilla') || (origin(w, 'Fino') && origin(w, 'Jerez', 'Xérès', 'Sherry', 'Sanlúcar', 'Montilla Moriles')))),
  'amontillado-oloroso': from('fortified', 'spain', w => notSweet(w) && origin(w, 'Jerez', 'Xérès', 'Sherry', 'Sanlúcar') && origin(w, 'Amontillado', 'Oloroso')),
  sauternes: from('sweet', 'france', w => origin(w, 'Sauternes', 'Barsac')),
  tokaji: from('sweet', 'hungary', w => origin(w, 'Tokaj', 'Tokaji') && origin(w, 'Aszú')),
  port: from('fortified', 'portugal', w => origin(w, 'Port', 'Porto') && origin(w, 'Vintage', 'Tawny')
    && !origin(w, 'LBV', 'Late Bottled Vintage', 'Late Bottled', 'White', 'Branco', 'Ruby', 'Rosé')),
  icewine: from('sweet', 'canada', w => origin(w, 'Niagara', 'Niagara on the Lake', 'Niagara Peninsula') && origin(w, 'Icewine', 'Ice wine', 'Vin de glace')),
  'etna-rosso': from('red', 'italy', w => compatibleGrape(w, 'Nerello Mascalese')
    && (origin(w, 'Etna Rosso') || (origin(w, 'Etna') && grape(w, 'Nerello Mascalese')))),
  'hunter-semillon': from('white', 'australia', w => notSweet(w) && origin(w, 'Hunter', 'Hunter Valley') && grape(w, 'Sémillon')),
  'white-rioja': from('white', 'spain', w => notSweet(w) && agedWhite(w) && origin(w, 'Rioja') && grape(w, 'Viura', 'Macabeo')),
  'vin-jaune': from('white', 'france', w => notSweet(w) && origin(w, 'Vin Jaune') && compatibleGrape(w, 'Savagnin')),
};

export function getEssentialMatches(id: string, wines: Wine[]): Wine[] {
  const match = Object.prototype.hasOwnProperty.call(rules, id) ? rules[id] : undefined;
  if (!match) return [];
  return wines.filter(wine => wine.status === 'in_cellar' && wine.quantity > 0 && match({
    identity: normalize(`${wine.bottle || ''} ${wine.region || ''}`),
    // A grape explicitly named on the bottle is useful even if its field is empty.
    grape: normalize(`${wine.grapes || ''} ${wine.bottle || ''}`),
    declaredGrapes: normalize(wine.grapes),
    style: normalize(wine.style),
    country: normalize(wine.country),
  }));
}
