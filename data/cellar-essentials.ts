export type GuideCategory = 'red' | 'white' | 'sparkling' | 'rose' | 'fortified' | 'sweet';
export type GuideTier = 'foundation' | 'classic' | 'discovery';
export type LocalizedText = { en: string; pt: string };

export interface CellarEssential {
  id: string;
  category: GuideCategory;
  tier: GuideTier;
  name: LocalizedText;
  region: LocalizedText;
  grapes: LocalizedText;
  character: LocalizedText;
  role: LocalizedText;
  source?: { label: string; url: string };
}

/** Benchmarks for exploration, not a checklist of bottles every person must own. */
export const CELLAR_ESSENTIALS: CellarEssential[] = [
  {
    id: 'barossa-shiraz', category: 'red', tier: 'foundation',
    name: { en: 'Barossa Shiraz', pt: 'Shiraz de Barossa' },
    region: { en: 'Barossa Valley · Australia', pt: 'Barossa Valley · Austrália' },
    grapes: { en: 'Shiraz (Syrah)', pt: 'Shiraz (Syrah)' },
    character: {
      en: 'Typically generous and full-bodied, with dark fruit, pepper and spice; producer choices shape the balance of richness and freshness.',
      pt: 'Geralmente generoso e encorpado, com frutas escuras, pimenta e especiarias; o produtor define o equilíbrio entre riqueza e frescor.',
    },
    role: {
      en: 'The Australian reference for a powerful red, and an illuminating comparison with the more savoury expressions of Northern Rhône Syrah.',
      pt: 'A referência australiana para um tinto potente e uma comparação reveladora com as expressões mais salgadas e herbais do Rhône Norte.',
    },
    source: { label: 'Wine Australia', url: 'https://www.wineaustralia.com/market-insights/regions-and-varieties/shiraz' },
  },
  {
    id: 'rhone-syrah', category: 'red', tier: 'foundation',
    name: { en: 'Northern Rhône Syrah', pt: 'Syrah do Rhône Norte' },
    region: { en: 'Côte-Rôtie, Hermitage or Cornas · France', pt: 'Côte-Rôtie, Hermitage ou Cornas · França' },
    grapes: { en: 'Syrah', pt: 'Syrah' },
    character: {
      en: 'Often savoury and firmly structured, with pepper, olive and floral notes alongside dark fruit; individual appellations offer distinct expressions.',
      pt: 'Frequentemente estruturado, com pimenta, azeitona e notas florais junto às frutas escuras; cada denominação oferece uma expressão própria.',
    },
    role: {
      en: 'Adds a savoury dimension to a red collection and makes an excellent same-grape tasting partner for Barossa Shiraz.',
      pt: 'Acrescenta uma dimensão mais herbal à coleção de tintos e forma uma excelente comparação da mesma uva com Shiraz de Barossa.',
    },
  },
  {
    id: 'bordeaux-left', category: 'red', tier: 'foundation',
    name: { en: 'Left Bank Bordeaux', pt: 'Bordeaux da Margem Esquerda' },
    region: { en: 'Pauillac, Saint-Julien, Margaux or Pessac-Léognan · France', pt: 'Pauillac, Saint-Julien, Margaux ou Pessac-Léognan · França' },
    grapes: { en: 'Usually Cabernet Sauvignon-led blends', pt: 'Cortes geralmente liderados por Cabernet Sauvignon' },
    character: {
      en: 'Usually Cabernet Sauvignon-led, combining cassis, cedar and firm structure; the balance of fruit and tannin varies with estate and vintage.',
      pt: 'Geralmente liderado por Cabernet Sauvignon, combina cassis, cedro e estrutura firme; o equilíbrio entre fruta e taninos varia conforme produtor e safra.',
    },
    role: {
      en: 'A benchmark for structured blends and bottle development, particularly rewarding alongside Right Bank Bordeaux or a Napa Cabernet Sauvignon.',
      pt: 'Uma referência para cortes estruturados e evolução em garrafa, especialmente interessante ao lado de Bordeaux da Margem Direita ou Cabernet de Napa.',
    },
    source: { label: 'Bordeaux Wine Council', url: 'https://www.bordeaux.com/en/grape-varieties/cabernet-sauvignon/' },
  },
  {
    id: 'bordeaux-right', category: 'red', tier: 'foundation',
    name: { en: 'Right Bank Bordeaux', pt: 'Bordeaux da Margem Direita' },
    region: { en: 'Saint-Émilion or Pomerol · France', pt: 'Saint-Émilion ou Pomerol · França' },
    grapes: { en: 'Usually Merlot-led, often with Cabernet Franc', pt: 'Geralmente Merlot, frequentemente com Cabernet Franc' },
    character: {
      en: 'Commonly Merlot-led, with plum fruit, supple texture and earthy complexity; Cabernet Franc can contribute fragrance, freshness and further structure.',
      pt: 'Normalmente liderado por Merlot, com ameixa, textura macia e complexidade terrosa; Cabernet Franc pode contribuir com perfume, frescor e estrutura.',
    },
    role: {
      en: 'Completes the Bordeaux picture with a different blend balance, showing how neighbouring regions can produce remarkably different expressions of red wine.',
      pt: 'Completa o panorama de Bordeaux com outro equilíbrio de uvas, mostrando como regiões vizinhas podem produzir expressões bastante diferentes de vinho tinto.',
    },
  },
  {
    id: 'burgundy-pinot', category: 'red', tier: 'foundation',
    name: { en: 'Burgundy Pinot Noir', pt: 'Pinot Noir da Borgonha' },
    region: { en: 'Côte de Nuits or Côte de Beaune · France', pt: 'Côte de Nuits ou Côte de Beaune · França' },
    grapes: { en: 'Pinot Noir', pt: 'Pinot Noir' },
    character: {
      en: 'Known for perfume, red fruit and elegance, with texture and intensity that vary widely across villages, producers and vintages.',
      pt: 'Conhecido pelo perfume, frutas vermelhas e elegância, com textura e intensidade que variam bastante entre vilarejos, produtores e safras.',
    },
    role: {
      en: 'Provides a lighter-bodied counterpoint to powerful reds and a reference for exploring how place changes the expression of one grape.',
      pt: 'Oferece um contraponto de corpo mais leve aos tintos potentes e uma referência para explorar como o lugar transforma uma mesma uva.',
    },
  },
  {
    id: 'barolo-barbaresco', category: 'red', tier: 'foundation',
    name: { en: 'Barolo & Barbaresco', pt: 'Barolo e Barbaresco' },
    region: { en: 'Piedmont · Italy', pt: 'Piemonte · Itália' },
    grapes: { en: 'Nebbiolo', pt: 'Nebbiolo' },
    character: {
      en: 'Rose and red cherry meet substantial tannin and freshness; bottle development can reveal layers of earthy and savoury complexity.',
      pt: 'Rosas e cereja vermelha encontram taninos marcantes e frescor; a evolução em garrafa pode revelar camadas de complexidade terrosa.',
    },
    role: {
      en: 'Brings aromatic delicacy with serious structure, offering a distinctive Italian ageing tradition and an engaging contrast to Cabernet-based wines.',
      pt: 'Une delicadeza aromática e estrutura séria, apresentando uma tradição italiana de guarda e um contraste interessante com vinhos de Cabernet.',
    },
  },
  {
    id: 'brunello', category: 'red', tier: 'foundation',
    name: { en: 'Brunello di Montalcino', pt: 'Brunello di Montalcino' },
    region: { en: 'Montalcino, Tuscany · Italy', pt: 'Montalcino, Toscana · Itália' },
    grapes: { en: 'Sangiovese', pt: 'Sangiovese' },
    character: {
      en: 'A structured expression of Sangiovese, commonly bringing cherry, herbs and freshness together with savoury complexity as the wine develops.',
      pt: 'Uma expressão estruturada de Sangiovese, geralmente reunindo cereja, ervas e frescor com complexidade mais terrosa à medida que evolui.',
    },
    role: {
      en: 'An important Tuscan reference for food-friendly structure and development, giving a Sangiovese perspective alongside Piedmontese Nebbiolo in the cellar.',
      pt: 'Uma referência toscana de estrutura e evolução à mesa, oferecendo a perspectiva da Sangiovese ao lado do Nebbiolo piemontês na adega.',
    },
    source: { label: 'Consorzio del Brunello di Montalcino', url: 'https://www.consorziobrunellodimontalcino.it/it/586/il-brunello' },
  },
  {
    id: 'rioja-red', category: 'red', tier: 'foundation',
    name: { en: 'Rioja Reserva & Gran Reserva', pt: 'Rioja Reserva e Gran Reserva' },
    region: { en: 'Rioja · Spain', pt: 'Rioja · Espanha' },
    grapes: { en: 'Usually Tempranillo-led blends', pt: 'Cortes geralmente liderados por Tempranillo' },
    character: {
      en: 'Often Tempranillo-led, balancing red fruit with oak influence and bottle maturity; traditional and contemporary producers interpret that balance differently.',
      pt: 'Frequentemente liderado por Tempranillo, equilibra frutas vermelhas, influência da madeira e maturidade; produtores tradicionais e contemporâneos interpretam esse equilíbrio de maneiras distintas.',
    },
    role: {
      en: 'A Spanish benchmark for the relationship between fruit, oak and time, particularly useful for discovering the appeal of mature reds.',
      pt: 'Uma referência espanhola para a relação entre fruta, madeira e tempo, especialmente útil para descobrir o encanto dos tintos maduros.',
    },
  },
  {
    id: 'ribera', category: 'red', tier: 'classic',
    name: { en: 'Ribera del Duero Tempranillo', pt: 'Tempranillo de Ribera del Duero' },
    region: { en: 'Ribera del Duero · Spain', pt: 'Ribera del Duero · Espanha' },
    grapes: { en: 'Tempranillo (Tinto Fino)', pt: 'Tempranillo (Tinto Fino)' },
    character: {
      en: 'Often dark-fruited and concentrated, with firm structure; altitude, vintage and winemaking influence the balance of power and freshness.',
      pt: 'Frequentemente concentrado e de frutas escuras, com estrutura firme; altitude, safra e vinificação influenciam o equilíbrio entre potência e frescor.',
    },
    role: {
      en: 'Adds another important Spanish interpretation of Tempranillo and makes a natural side-by-side comparison with a Rioja of similar maturity.',
      pt: 'Acrescenta outra interpretação espanhola importante da Tempranillo e convida a uma comparação lado a lado com um Rioja de maturidade semelhante.',
    },
  },
  {
    id: 'mendoza-malbec', category: 'red', tier: 'foundation',
    name: { en: 'Mendoza Malbec', pt: 'Malbec de Mendoza' },
    region: { en: 'Uco Valley or Luján de Cuyo, Mendoza · Argentina', pt: 'Vale do Uco ou Luján de Cuyo, Mendoza · Argentina' },
    grapes: { en: 'Malbec', pt: 'Malbec' },
    character: {
      en: 'Violet, plum and dark fruit are familiar signatures; Uco Valley also offers fresher, more restrained interpretations alongside richer styles.',
      pt: 'Violeta, ameixa e frutas escuras são marcas familiares; o Vale do Uco também oferece interpretações mais frescas e contidas além das encorpadas.',
    },
    role: {
      en: 'An Argentine cornerstone that invites exploration beyond richness, comparing different sites and producers for fragrance, texture and freshness.',
      pt: 'Um pilar argentino que convida a explorar além da concentração, comparando locais e produtores em busca de perfume, textura e frescor.',
    },
    source: { label: 'Wines of Argentina', url: 'https://blog.winesofargentina.com/destacadas/argentine-malbec-4-styles/' },
  },
  {
    id: 'napa-cabernet', category: 'red', tier: 'classic',
    name: { en: 'Napa Valley Cabernet Sauvignon', pt: 'Cabernet Sauvignon de Napa Valley' },
    region: { en: 'Napa Valley, California · United States', pt: 'Napa Valley, Califórnia · Estados Unidos' },
    grapes: { en: 'Cabernet Sauvignon, sometimes blended', pt: 'Cabernet Sauvignon, às vezes em corte' },
    character: {
      en: 'Frequently ripe and richly textured, with cassis and polished structure; vineyard location and producer style create considerable variation.',
      pt: 'Frequentemente maduro e de textura rica, com cassis e estrutura polida; localização do vinhedo e estilo do produtor criam grande diversidade.',
    },
    role: {
      en: 'The Californian reference for Cabernet Sauvignon, offering a revealing comparison with Cabernet-led Bordeaux and other expressions of the same grape.',
      pt: 'A referência californiana de Cabernet Sauvignon, oferecendo uma comparação reveladora com Bordeaux liderado por Cabernet e outras expressões da mesma uva.',
    },
  },
  {
    id: 'southern-rhone', category: 'red', tier: 'classic',
    name: { en: 'Southern Rhône Grenache blends', pt: 'Cortes de Grenache do Rhône Sul' },
    region: { en: 'Châteauneuf-du-Pape or Gigondas · France', pt: 'Châteauneuf-du-Pape ou Gigondas · França' },
    grapes: { en: 'Grenache, often with Syrah and Mourvèdre', pt: 'Grenache, frequentemente com Syrah e Mourvèdre' },
    character: {
      en: 'Warm red fruit, herbs and spice are common themes, with Grenache often joined by Syrah and Mourvèdre for added dimension.',
      pt: 'Frutas vermelhas maduras, ervas e especiarias são temas comuns, com Grenache frequentemente acompanhada por Syrah e Mourvèdre para maior complexidade.',
    },
    role: {
      en: 'Adds Mediterranean warmth and a different blending tradition, complementing the more peppery, Syrah-led wines of the Northern Rhône.',
      pt: 'Acrescenta calor mediterrâneo e uma tradição diferente de cortes, complementando os vinhos do Rhône Norte liderados pela Syrah e suas notas de pimenta.',
    },
    source: { label: 'Inter Rhône', url: 'https://www.vins-rhone.com/en/grenache-noir-grape-variety' },
  },
  {
    id: 'douro-red', category: 'red', tier: 'classic',
    name: { en: 'Douro native-grape blends', pt: 'Cortes de uvas portuguesas do Douro' },
    region: { en: 'Douro · Portugal', pt: 'Douro · Portugal' },
    grapes: { en: 'Touriga Nacional, Touriga Franca and other local varieties', pt: 'Touriga Nacional, Touriga Franca e outras castas locais' },
    character: {
      en: 'Portuguese varieties bring dark fruit, floral aromas and structure, with the blend and vineyard location shaping each wine’s expression.',
      pt: 'As castas portuguesas trazem frutas escuras, aromas florais e estrutura, com o corte e o vinhedo moldando a expressão de cada vinho.',
    },
    role: {
      en: 'Broadens the cellar beyond international grapes and introduces the Douro’s distinct tradition of native varieties and complex red blends.',
      pt: 'Amplia a adega além das uvas internacionais e apresenta a tradição singular do Douro de castas locais e cortes tintos complexos.',
    },
  },
  {
    id: 'beaujolais', category: 'red', tier: 'classic',
    name: { en: 'Cru Beaujolais', pt: 'Cru Beaujolais' },
    region: { en: 'Morgon, Fleurie or Moulin-à-Vent · France', pt: 'Morgon, Fleurie ou Moulin-à-Vent · França' },
    grapes: { en: 'Gamay', pt: 'Gamay' },
    character: {
      en: 'Freshness, red fruit and drinkability meet genuine depth in good examples; the crus offer different balances of perfume and structure.',
      pt: 'Frescor, frutas vermelhas e facilidade de beber encontram profundidade nos bons exemplares; os crus equilibram perfume e estrutura de maneiras diferentes.',
    },
    role: {
      en: 'A useful counterweight to powerful reds, bringing an inviting, food-friendly style that can still reward attention and thoughtful selection.',
      pt: 'Um contraponto útil aos tintos potentes, trazendo um estilo convidativo e versátil à mesa que também merece atenção e escolha cuidadosa.',
    },
  },
  {
    id: 'carmenere', category: 'red', tier: 'classic',
    name: { en: 'Chilean Carménère', pt: 'Carménère chilena' },
    region: { en: 'Colchagua or Cachapoal · Chile', pt: 'Colchagua ou Cachapoal · Chile' },
    grapes: { en: 'Carménère', pt: 'Carménère' },
    character: {
      en: 'Dark fruit, herbal character and spice create a distinctive profile; ripeness and producer choices influence the balance of these elements.',
      pt: 'Frutas escuras, caráter herbal e especiarias criam um perfil distinto; maturação e escolhas do produtor influenciam o equilíbrio entre esses elementos.',
    },
    role: {
      en: 'A Chilean signature that expands a South American selection beyond Malbec, particularly interesting when exploring herbal and spicy red wines.',
      pt: 'Uma assinatura chilena que amplia a seleção sul-americana além da Malbec, especialmente interessante para explorar tintos de caráter herbal e especiado.',
    },
  },
  {
    id: 'chablis', category: 'white', tier: 'foundation',
    name: { en: 'Chablis', pt: 'Chablis' },
    region: { en: 'Chablis, Burgundy · France', pt: 'Chablis, Borgonha · França' },
    grapes: { en: 'Chardonnay', pt: 'Chardonnay' },
    character: {
      en: 'A crisp, citrus-driven expression of Chardonnay, often emphasizing freshness and precision rather than richness; texture varies with site and winemaking.',
      pt: 'Uma expressão de Chardonnay fresca e cítrica, frequentemente valorizando precisão e acidez; a textura varia conforme o local e a vinificação.',
    },
    role: {
      en: 'A foundation for fresh dry whites and a particularly instructive comparison with the broader Chardonnay styles of the Côte de Beaune.',
      pt: 'Um alicerce para brancos secos e frescos e uma comparação especialmente instrutiva com os estilos mais amplos de Chardonnay da Côte de Beaune.',
    },
    source: { label: 'Bourgogne Wine Board', url: 'https://www.bourgogne-wines.com/wine-and-terroir/our-grape-varietals-our-colors/chardonnay/chardonnay-a-bourgogne-original-that-has-travelled-the-world%2C2797%2C10602.html' },
  },
  {
    id: 'cote-beaune', category: 'white', tier: 'foundation',
    name: { en: 'Côte de Beaune Chardonnay', pt: 'Chardonnay da Côte de Beaune' },
    region: { en: 'Meursault, Puligny-Montrachet or Chassagne-Montrachet · France', pt: 'Meursault, Puligny-Montrachet ou Chassagne-Montrachet · França' },
    grapes: { en: 'Chardonnay', pt: 'Chardonnay' },
    character: {
      en: 'Often broader and more textured than Chablis, with oak influence and freshness working together; village and producer differences remain important.',
      pt: 'Frequentemente mais amplo e texturado que Chablis, com influência da madeira e frescor combinados; as diferenças entre vilarejos e produtores são importantes.',
    },
    role: {
      en: 'The classic reference for textured Chardonnay, providing a white with presence at dinner and a rewarding study of balance.',
      pt: 'A referência clássica de Chardonnay com textura, oferecendo um branco com presença à mesa e um estudo interessante de equilíbrio.',
    },
    source: { label: 'Bourgogne Wine Board', url: 'https://www.bourgogne-wines.com/wine-and-terroir/our-grape-varietals-our-colors/chardonnay/chardonnay-a-bourgogne-original-that-has-travelled-the-world%2C2797%2C10602.html' },
  },
  {
    id: 'sancerre-pouilly', category: 'white', tier: 'foundation',
    name: { en: 'Loire Sauvignon Blanc', pt: 'Sauvignon Blanc do Loire' },
    region: { en: 'Sancerre or Pouilly-Fumé · France', pt: 'Sancerre ou Pouilly-Fumé · França' },
    grapes: { en: 'Sauvignon Blanc', pt: 'Sauvignon Blanc' },
    character: {
      en: 'Typically dry and fresh, combining citrus and herbal notes with a focused palate; producer and vintage influence aromatic intensity.',
      pt: 'Geralmente seco e fresco, combinando cítricos e notas herbais com um paladar preciso; produtor e safra influenciam a intensidade aromática.',
    },
    role: {
      en: 'A versatile dry white for the table and the French benchmark to compare with more overtly aromatic Marlborough Sauvignon Blanc.',
      pt: 'Um branco seco versátil à mesa e a referência francesa para comparar com Sauvignon Blanc de Marlborough mais intensamente aromático.',
    },
  },
  {
    id: 'marlborough-sauvignon', category: 'white', tier: 'classic',
    name: { en: 'Marlborough Sauvignon Blanc', pt: 'Sauvignon Blanc de Marlborough' },
    region: { en: 'Marlborough · New Zealand', pt: 'Marlborough · Nova Zelândia' },
    grapes: { en: 'Sauvignon Blanc', pt: 'Sauvignon Blanc' },
    character: {
      en: 'An overtly aromatic expression, often combining passion fruit and green herbal notes with lively acidity and an immediately expressive personality.',
      pt: 'Uma expressão intensamente aromática, frequentemente combinando maracujá e notas herbais verdes com acidez viva e uma personalidade imediatamente expressiva.',
    },
    role: {
      en: 'Adds aromatic energy to a white selection and makes a revealing regional comparison with Sancerre or Pouilly-Fumé from the Loire.',
      pt: 'Acrescenta energia aromática à seleção de brancos e forma uma comparação regional reveladora com Sancerre ou Pouilly-Fumé do Loire.',
    },
    source: { label: 'New Zealand Wine', url: 'https://www.nzwine.com/en/regions/marlborough/' },
  },
  {
    id: 'german-riesling', category: 'white', tier: 'foundation',
    name: { en: 'Dry German Riesling', pt: 'Riesling alemão seco' },
    region: { en: 'Nahe, Rheingau, Rheinhessen or Pfalz · Germany', pt: 'Nahe, Rheingau, Rheinhessen ou Pfalz · Alemanha' },
    grapes: { en: 'Riesling · look for “trocken”', pt: 'Riesling · procure “trocken”' },
    character: {
      en: 'Intense citrus and precise acidity can develop complexity with time; choose bottles labelled trocken when looking for a dry expression.',
      pt: 'Cítricos intensos e acidez precisa podem desenvolver complexidade com o tempo; escolha garrafas rotuladas trocken ao procurar uma expressão seca.',
    },
    role: {
      en: 'A foundation for dry, aromatic whites with development potential, especially useful when expanding beyond Chardonnay without choosing semi-sweet styles.',
      pt: 'Um alicerce para brancos secos e aromáticos com potencial de evolução, especialmente útil para ir além da Chardonnay sem escolher estilos meio-doces.',
    },
    source: { label: 'German Wine Institute', url: 'https://www.winesofgermany.com/our-wine/wine-tasting/wine-tasting/195/geschmacksrichtungen' },
  },
  {
    id: 'savennieres', category: 'white', tier: 'foundation',
    name: { en: 'Savennières dry Chenin Blanc', pt: 'Chenin Blanc seco de Savennières' },
    region: { en: 'Savennières, Loire · France', pt: 'Savennières, Loire · França' },
    grapes: { en: 'Chenin Blanc · choose dry', pt: 'Chenin Blanc · escolha seco' },
    character: {
      en: 'Dry examples offer apple, quince, texture and bright acidity, with savoury complexity emerging in some wines as they develop.',
      pt: 'Exemplares secos oferecem maçã, marmelo, textura e acidez viva, com complexidade mais terrosa surgindo em alguns vinhos durante sua evolução.',
    },
    role: {
      en: 'An important alternative to Chardonnay for texture and depth; confirm the wine is dry when choosing a particular bottle.',
      pt: 'Uma alternativa importante à Chardonnay em textura e profundidade; confirme que o vinho é seco ao escolher uma garrafa específica.',
    },
    source: { label: 'Savennières', url: 'https://www.savennieres.fr/decouvrir/203' },
  },
  {
    id: 'gruner', category: 'white', tier: 'classic',
    name: { en: 'Austrian Grüner Veltliner', pt: 'Grüner Veltliner austríaco' },
    region: { en: 'Wachau or Kamptal · Austria', pt: 'Wachau ou Kamptal · Áustria' },
    grapes: { en: 'Grüner Veltliner', pt: 'Grüner Veltliner' },
    character: {
      en: 'Citrus, gentle pepper and savoury character are common markers; styles range from refreshing and light to fuller, more textured wines.',
      pt: 'Cítricos, pimenta suave e caráter herbal são marcas comuns; os estilos variam de leves e refrescantes a vinhos mais amplos e texturados.',
    },
    role: {
      en: 'Adds a distinctive Austrian voice to dry whites and a particularly useful option for meals built around vegetables and herbs.',
      pt: 'Acrescenta uma voz austríaca distinta aos brancos secos e uma opção especialmente útil para refeições centradas em vegetais e ervas.',
    },
  },
  {
    id: 'albarino', category: 'white', tier: 'classic',
    name: { en: 'Rías Baixas Albariño', pt: 'Albariño de Rías Baixas' },
    region: { en: 'Rías Baixas, Galicia · Spain', pt: 'Rías Baixas, Galícia · Espanha' },
    grapes: { en: 'Albariño', pt: 'Albariño' },
    character: {
      en: 'Fragrant citrus and stone fruit meet refreshing acidity, offering an expressive dry white whose texture varies with producer and maturation.',
      pt: 'Cítricos perfumados e frutas de caroço encontram acidez refrescante, oferecendo um branco seco expressivo cuja textura varia com produtor e maturação.',
    },
    role: {
      en: 'Brings a Spanish coastal reference to the cellar and a natural option for seafood, especially when freshness is the priority.',
      pt: 'Traz uma referência costeira espanhola à adega e uma opção natural para frutos do mar, especialmente quando o frescor é prioridade.',
    },
    source: { label: 'D.O. Rías Baixas', url: 'https://doriasbaixas.com/variedades-de-uva-rias-baixas/' },
  },
  {
    id: 'assyrtiko', category: 'white', tier: 'classic',
    name: { en: 'Santorini Assyrtiko', pt: 'Assyrtiko de Santorini' },
    region: { en: 'Santorini · Greece', pt: 'Santorini · Grécia' },
    grapes: { en: 'Assyrtiko', pt: 'Assyrtiko' },
    character: {
      en: 'Powerful acidity, citrus and a distinctly saline impression often define dry examples, with enough presence to stand alongside richer food.',
      pt: 'Acidez marcante, cítricos e uma impressão nitidamente salina frequentemente definem os exemplares secos, com presença para acompanhar pratos mais ricos.',
    },
    role: {
      en: 'A strong next step for adventurous drinking, introducing a Greek grape with a different balance of freshness, texture and intensity.',
      pt: 'Um ótimo próximo passo para explorar, apresentando uma uva grega com um equilíbrio diferente entre frescor, textura e intensidade.',
    },
    source: { label: 'Wines of Greece', url: 'https://winesofgreece.org/pdo/pdo-santorini/' },
  },
  {
    id: 'champagne', category: 'sparkling', tier: 'foundation',
    name: { en: 'Champagne', pt: 'Champagne' },
    region: { en: 'Champagne · France', pt: 'Champagne · França' },
    grapes: { en: 'Chardonnay, Pinot Noir and Meunier; blends or single-grape expressions', pt: 'Chardonnay, Pinot Noir e Meunier; cortes ou expressões de uma só uva' },
    character: {
      en: 'Fine bubbles, freshness and complexity from lees ageing take different forms in Blanc de Blancs and Pinot-led blends; explore both.',
      pt: 'Bolhas finas, frescor e complexidade do contato com leveduras assumem formas diferentes em Blanc de Blancs e cortes liderados por Pinot.',
    },
    role: {
      en: 'A foundation for celebrations, aperitifs and food pairing. Start with Brut or Extra Brut; Extra Dry is a sweeter designation.',
      pt: 'Um alicerce para celebrações, aperitivos e harmonizações. Comece por Brut ou Extra Brut; Extra Dry é uma designação mais doce.',
    },
    source: { label: 'Comité Champagne', url: 'https://www.champagne.fr/en/about-champagne/how-champagne-is-made/dosage' },
  },
  {
    id: 'franciacorta', category: 'sparkling', tier: 'classic',
    name: { en: 'Franciacorta', pt: 'Franciacorta' },
    region: { en: 'Lombardy · Italy', pt: 'Lombardia · Itália' },
    grapes: { en: 'Principally Chardonnay and Pinot Noir', pt: 'Principalmente Chardonnay e Pinot Noir' },
    character: {
      en: 'Traditional-method sparkling wine with texture from ageing on the yeast, usually built around Chardonnay and Pinot Noir in different proportions.',
      pt: 'Espumante de método tradicional com textura do envelhecimento sobre leveduras, geralmente elaborado com Chardonnay e Pinot Noir em diferentes proporções.',
    },
    role: {
      en: 'Offers an Italian perspective on traditional-method sparkling. Choose Brut or Extra Brut to explore it within a drier style preference.',
      pt: 'Oferece uma perspectiva italiana dos espumantes de método tradicional. Escolha Brut ou Extra Brut para explorá-lo dentro de uma preferência mais seca.',
    },
    source: { label: 'Franciacorta', url: 'https://franciacorta.wine/en/wine/method/' },
  },
  {
    id: 'cava', category: 'sparkling', tier: 'classic',
    name: { en: 'Cava Reserva & Gran Reserva', pt: 'Cava Reserva e Gran Reserva' },
    region: { en: 'Cava · Spain', pt: 'Cava · Espanha' },
    grapes: { en: 'Often Xarel·lo, Macabeo and Parellada', pt: 'Frequentemente Xarel·lo, Macabeo e Parellada' },
    character: {
      en: 'Traditional-method bubbles meet a distinctive grape palette, with Xarel·lo, Macabeo and Parellada offering a different expression from Chardonnay-led sparkling wines.',
      pt: 'Bolhas de método tradicional encontram uvas distintas, com Xarel·lo, Macabeo e Parellada oferecendo uma expressão diferente dos espumantes liderados por Chardonnay.',
    },
    role: {
      en: 'Expands the sparkling collection through Spanish varieties and longer-aged styles. Look for Brut Nature or Extra Brut for a drier profile.',
      pt: 'Amplia a coleção de espumantes com variedades espanholas e estilos de maior envelhecimento. Procure Brut Nature ou Extra Brut para um perfil mais seco.',
    },
    source: { label: 'D.O. Cava', url: 'https://www.cava.wine/en/news-articles/cava-grapes-types-and-varieties-of-cava-grapes/' },
  },
  {
    id: 'provence-rose', category: 'rose', tier: 'foundation',
    name: { en: 'Dry Provence rosé', pt: 'Rosé seco da Provence' },
    region: { en: 'Provence · France', pt: 'Provence · França' },
    grapes: { en: 'Regional blends, often Grenache and Cinsault', pt: 'Cortes regionais, frequentemente Grenache e Cinsault' },
    character: {
      en: 'Usually fresh, dry and delicately fruity, with the blend and producer determining how much texture accompanies its refreshing character.',
      pt: 'Geralmente fresco, seco e delicadamente frutado, com o corte e o produtor determinando quanta textura acompanha seu caráter refrescante.',
    },
    role: {
      en: 'A versatile option for lighter meals and warm weather; it earns cellar space even when bought primarily to enjoy young.',
      pt: 'Uma opção versátil para refeições leves e dias quentes; merece espaço na adega mesmo quando comprado principalmente para beber jovem.',
    },
  },
  {
    id: 'bandol-rose', category: 'rose', tier: 'classic',
    name: { en: 'Bandol rosé', pt: 'Rosé de Bandol' },
    region: { en: 'Bandol, Provence · France', pt: 'Bandol, Provence · França' },
    grapes: { en: 'Blends with a substantial Mourvèdre component', pt: 'Cortes com participação importante de Mourvèdre' },
    character: {
      en: 'Often more textured and savoury than lighter Provence rosés, with Mourvèdre contributing a distinctive presence to the regional blend.',
      pt: 'Frequentemente mais texturado e complexo que os rosés leves da Provence, com Mourvèdre contribuindo com uma presença distinta ao corte regional.',
    },
    role: {
      en: 'A rosé with a place at dinner, useful for exploring texture and showing the category’s range beyond a refreshing aperitif.',
      pt: 'Um rosé com lugar no jantar, útil para explorar textura e mostrar a amplitude da categoria além de um aperitivo refrescante.',
    },
    source: { label: 'Maison des Vins de Bandol', url: 'https://www.maisondesvins-bandol.com/en/bandol-rose-wines.cfm?currentpage=3' },
  },
  {
    id: 'fino-manzanilla', category: 'fortified', tier: 'classic',
    name: { en: 'Fino & Manzanilla', pt: 'Fino e Manzanilla' },
    region: { en: 'Jerez and Sanlúcar de Barrameda · Spain', pt: 'Jerez e Sanlúcar de Barrameda · Espanha' },
    grapes: { en: 'Palomino', pt: 'Palomino' },
    character: {
      en: 'Very dry, savoury and almond-like, these fortified wines offer a distinctive expression shaped by maturation under a layer of flor yeast.',
      pt: 'Muito secos e com notas amendoadas, estes vinhos fortificados oferecem uma expressão distinta, moldada pelo amadurecimento sob uma camada de levedura flor.',
    },
    role: {
      en: 'Opens a new pairing world with olives, seafood and cured foods, demonstrating that fortified wine can be completely dry.',
      pt: 'Abre um novo universo de harmonizações com azeitonas, frutos do mar e curados, demonstrando que vinho fortificado pode ser completamente seco.',
    },
    source: { label: 'Sherry Wines', url: 'https://www.sherry.wine/sherry-cask/types-of-sherry-wine' },
  },
  {
    id: 'amontillado-oloroso', category: 'fortified', tier: 'classic',
    name: { en: 'Dry Amontillado & Oloroso', pt: 'Amontillado e Oloroso secos' },
    region: { en: 'Jerez · Spain', pt: 'Jerez · Espanha' },
    grapes: { en: 'Palomino', pt: 'Palomino' },
    character: {
      en: 'Nutty and complex, with oxidative maturation contributing a savoury depth that feels markedly different from fresh, fruit-led table wines.',
      pt: 'Amendoados e complexos, com maturação oxidativa contribuindo para uma profundidade bastante diferente dos vinhos de mesa frescos e centrados na fruta.',
    },
    role: {
      en: 'Adds depth to a dry fortified selection and invites different food pairings; choose the dry styles rather than sweetened blends.',
      pt: 'Acrescenta profundidade à seleção de fortificados secos e convida a outras harmonizações; escolha os estilos secos em vez dos cortes adoçados.',
    },
    source: { label: 'Sherry Wines', url: 'https://www.sherry.wine/sherry-cask/types-of-sherry-wine' },
  },
  {
    id: 'sauternes', category: 'sweet', tier: 'classic',
    name: { en: 'Sauternes & Barsac', pt: 'Sauternes e Barsac' },
    region: { en: 'Bordeaux · France', pt: 'Bordeaux · França' },
    grapes: { en: 'Sémillon and Sauvignon Blanc, often botrytised', pt: 'Sémillon e Sauvignon Blanc, frequentemente botritizadas' },
    character: {
      en: 'Rich dessert wines shaped by noble rot, combining concentrated sweetness with layered fruit and acidity that varies by wine and vintage.',
      pt: 'Vinhos de sobremesa ricos, moldados pela podridão nobre, combinando doçura concentrada, camadas de fruta e acidez variável conforme vinho e safra.',
    },
    role: {
      en: 'An optional dessert-wine benchmark: include it if you enjoy deliberately rich sweet wines, even when semi-sweet everyday styles do not appeal.',
      pt: 'Uma referência opcional de sobremesa: inclua se aprecia vinhos deliberadamente doces e ricos, mesmo quando estilos meio-doces cotidianos não agradam.',
    },
  },
  {
    id: 'tokaji', category: 'sweet', tier: 'classic',
    name: { en: 'Tokaji Aszú', pt: 'Tokaji Aszú' },
    region: { en: 'Tokaj · Hungary', pt: 'Tokaj · Hungria' },
    grapes: { en: 'Often Furmint and Hárslevelű', pt: 'Frequentemente Furmint e Hárslevelű' },
    character: {
      en: 'Concentrated sweetness meets bright acidity in this distinctive Hungarian dessert style, with complexity shaped by botrytised grapes and maturation.',
      pt: 'Doçura concentrada encontra acidez viva neste estilo húngaro de sobremesa, com complexidade moldada por uvas botritizadas e pela maturação.',
    },
    role: {
      en: 'An optional exploration of how acidity balances sweetness, providing a different regional perspective beside Sauternes in a small dessert-wine selection.',
      pt: 'Uma exploração opcional de como a acidez equilibra a doçura, oferecendo outra perspectiva regional ao lado de Sauternes numa seleção de sobremesa.',
    },
  },
  {
    id: 'port', category: 'sweet', tier: 'classic',
    name: { en: 'Vintage & aged Tawny Port', pt: 'Porto Vintage e Tawny com indicação de idade' },
    region: { en: 'Douro · Portugal', pt: 'Douro · Portugal' },
    grapes: { en: 'Traditional Douro varieties, usually blended', pt: 'Castas tradicionais do Douro, geralmente em corte' },
    character: {
      en: 'Two distinct sweet fortified traditions: Vintage emphasizes fruit and bottle development, while aged Tawny explores nutty complexity through wood maturation.',
      pt: 'Duas tradições distintas de fortificados doces: Vintage enfatiza fruta e evolução em garrafa, enquanto Tawny envelhecido explora complexidade amendoada pela madeira.',
    },
    role: {
      en: 'An optional Portuguese dessert collection within a collection; tasting both styles shows how maturation changes wines from the same region.',
      pt: 'Uma coleção portuguesa opcional de sobremesa dentro da adega; provar os dois estilos mostra como a maturação transforma vinhos da mesma região.',
    },
  },
  {
    id: 'icewine', category: 'sweet', tier: 'classic',
    name: { en: 'Niagara icewine', pt: 'Icewine de Niagara' },
    region: { en: 'Niagara, Ontario · Canada', pt: 'Niagara, Ontário · Canadá' },
    grapes: { en: 'Especially Vidal or Riesling', pt: 'Especialmente Vidal ou Riesling' },
    character: {
      en: 'A concentrated dessert wine made from naturally frozen grapes, combining pronounced sweetness and fruit intensity with varying levels of balancing acidity.',
      pt: 'Um vinho de sobremesa concentrado de uvas naturalmente congeladas, combinando doçura pronunciada e intensidade de fruta com diferentes níveis de acidez.',
    },
    role: {
      en: 'An optional Canadian signature for those who enjoy rich dessert wines; Vidal and Riesling offer worthwhile expressions to compare.',
      pt: 'Uma assinatura canadense opcional para quem aprecia vinhos ricos de sobremesa; Vidal e Riesling oferecem expressões que valem uma comparação.',
    },
  },
  {
    id: 'etna-rosso', category: 'red', tier: 'discovery',
    name: { en: 'Etna Rosso', pt: 'Etna Rosso' },
    region: { en: 'Mount Etna, Sicily · Italy', pt: 'Monte Etna, Sicília · Itália' },
    grapes: { en: 'Nerello Mascalese-led, sometimes with Nerello Cappuccio', pt: 'Liderado por Nerello Mascalese, às vezes com Nerello Cappuccio' },
    character: {
      en: 'Nerello Mascalese-led reds can combine perfume and fine structure, offering a different Sicilian expression from the island’s richer red styles.',
      pt: 'Tintos liderados por Nerello Mascalese podem combinar perfume e estrutura fina, oferecendo uma expressão siciliana diferente dos estilos mais encorpados da ilha.',
    },
    role: {
      en: 'A rewarding adventurous step for someone drawn to aromatic reds, extending exploration beyond familiar Pinot Noir, Nebbiolo and Sangiovese.',
      pt: 'Um passo de descoberta para quem aprecia tintos aromáticos, ampliando a exploração além das conhecidas Pinot Noir, Nebbiolo e Sangiovese.',
    },
    source: { label: 'Consorzio Etna DOC', url: 'https://thewinesofetna.com/it/i-vini-e-le-uve/' },
  },
  {
    id: 'hunter-semillon', category: 'white', tier: 'discovery',
    name: { en: 'Hunter Valley Sémillon', pt: 'Sémillon de Hunter Valley' },
    region: { en: 'Hunter Valley · Australia', pt: 'Hunter Valley · Austrália' },
    grapes: { en: 'Sémillon', pt: 'Sémillon' },
    character: {
      en: 'A distinctive dry white with fresh acidity when young, capable of developing a remarkably different, more complex character with age.',
      pt: 'Um branco seco distinto com acidez fresca quando jovem, capaz de desenvolver um caráter notavelmente diferente e mais complexo com a idade.',
    },
    role: {
      en: 'An adventurous lesson in white-wine development: comparing younger and mature examples can be more revealing than simply adding another grape.',
      pt: 'Uma lição de descoberta sobre evolução dos brancos: comparar exemplares jovens e maduros pode revelar mais do que apenas acrescentar outra uva.',
    },
    source: { label: 'Wine Australia', url: 'https://www.wineaustralia.com/market-insights/regions-and-varieties/semillon' },
  },
  {
    id: 'white-rioja', category: 'white', tier: 'discovery',
    name: { en: 'Traditional aged white Rioja', pt: 'Rioja branco tradicional envelhecido' },
    region: { en: 'Rioja · Spain', pt: 'Rioja · Espanha' },
    grapes: { en: 'Usually Viura-led', pt: 'Geralmente liderado por Viura' },
    character: {
      en: 'Viura-led wines can gain texture and complexity through maturation, revealing a distinctive white style where development is part of the appeal.',
      pt: 'Vinhos liderados por Viura podem ganhar textura e complexidade na maturação, revelando um estilo branco distinto cuja evolução faz parte do encanto.',
    },
    role: {
      en: 'Explores mature whites from a region often associated with reds, adding a different perspective alongside Burgundy Chardonnay and dry Chenin Blanc.',
      pt: 'Explora brancos maduros de uma região frequentemente associada aos tintos, acrescentando outra perspectiva ao lado de Chardonnay da Borgonha e Chenin seco.',
    },
    source: { label: 'Rioja Wine', url: 'https://riojawine.com/en-us/the-designation/grape-varieties/viura/' },
  },
  {
    id: 'vin-jaune', category: 'white', tier: 'discovery',
    name: { en: 'Jura Vin Jaune', pt: 'Vin Jaune do Jura' },
    region: { en: 'Jura · France', pt: 'Jura · França' },
    grapes: { en: 'Savagnin', pt: 'Savagnin' },
    character: {
      en: 'Dry Savagnin with intense savoury and nutty character, shaped by its distinctive maturation; a striking departure from fresh, fruit-focused whites.',
      pt: 'Savagnin seco com caráter intenso e amendoado, moldado por uma maturação distinta; uma mudança marcante em relação aos brancos frescos e frutados.',
    },
    role: {
      en: 'The adventurous edge of this guide: explore a singular dry white whose unusual flavour profile opens an entirely different pairing conversation.',
      pt: 'O lado mais aventureiro deste guia: explore um branco seco singular cujo perfil incomum abre uma conversa completamente diferente sobre harmonização.',
    },
    source: { label: 'Vins du Jura · wine guide (PDF)', url: 'https://www.jura-vins.com/medias/nos-vins/3-guide-vins-jura/VDJ-guide2015new-V2-Anglais.pdf' },
  },
];
