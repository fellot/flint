import type { LocalizedText } from './cellar-essentials';

export type ShoppingIntent = 'explore' | 'restock' | 'contrast';
export type ShoppingRetailer = 'lcbo' | 'cellar-collection';
export type ShoppingAvailability = 'observed-stock' | 'unconfirmed' | 'unavailable';

export interface ShoppingAlternative {
  name: string;
  priceCad: number;
  url: string;
  note: LocalizedText;
}

export interface CellarShoppingPick {
  id: string;
  essentialId: string;
  intent: ShoppingIntent;
  name: string;
  vintage: number;
  priceCad: number;
  sku: string;
  url: string;
  retailer: ShoppingRetailer;
  availability: ShoppingAvailability;
  observedQuantity?: number;
  checkedAt: string;
  reason: LocalizedText;
  note?: LocalizedText;
  alternatives?: ShoppingAlternative[];
}

export const SHOPPING_REVIEWED_AT = '2026-09-24';

export const US_WINE_RESTRICTION_URL =
  'https://www.lcbo.com/content/lcbo/en/corporate-pages/lcbo-response-to-u-s--tariffs--q-a.html';

/** Dated red-wine research; prices are CAD per 750 mL bottle, not live offers. */
export const CELLAR_SHOPPING_PICKS: CellarShoppingPick[] = [
  {
    id: 'benanti-dafara-galluzzo-2022',
    essentialId: 'etna-rosso',
    intent: 'explore',
    name: 'Benanti Contrada Dafara Galluzzo',
    vintage: 2022,
    priceCad: 94,
    sku: '30116',
    url: 'https://www.lcbo.com/en/benanti-contrada-dafara-galluzzo-30116',
    retailer: 'lcbo',
    availability: 'unconfirmed',
    checkedAt: SHOPPING_REVIEWED_AT,
    reason: {
      en: 'Explore Etna through Nerello Mascalese: aromatic red fruit, citrus peel and fine, firm tannins offer a distinctive Sicilian expression with detail and structure.',
      pt: 'Explore o Etna pela Nerello Mascalese: frutas vermelhas aromáticas, casca de cítricos e taninos finos e firmes oferecem uma expressão siciliana distinta, com delicadeza e estrutura.',
    },
  },
  {
    id: 'clos-de-luz-massal-1945-2023',
    essentialId: 'carmenere',
    intent: 'explore',
    name: 'Clos de Luz Massal 1945 Carménère',
    vintage: 2023,
    priceCad: 24.95,
    sku: '11861',
    url: 'https://www.lcbo.com/en/clos-de-luz-massal-1945-carmen-rre-2016-11861',
    retailer: 'lcbo',
    availability: 'unconfirmed',
    checkedAt: SHOPPING_REVIEWED_AT,
    reason: {
      en: 'An old-vine Cachapoal introduction to Carménère’s herbal, peppery character, with red fruit and firm tannins. It broadens an exploration of Chilean reds beyond Cabernet Sauvignon and Syrah.',
      pt: 'Uma introdução de vinhas velhas de Cachapoal ao caráter herbal e apimentado da Carménère, com frutas vermelhas e taninos firmes. Amplia a exploração dos tintos chilenos além de Cabernet Sauvignon e Syrah.',
    },
    alternatives: [
      {
        name: 'Santa Rita Floresta Carménère 2023',
        priceCad: 23.25,
        url: 'https://www.lcbo.com/en/santa-rita-floresta-carmenere-34733',
        note: {
          en: 'Clearance price at review (regular C$27.95); stock unconfirmed. Concrete ageing offers a fresh, herbal alternative with less oak influence.',
          pt: 'Preço de liquidação na revisão (regular C$27,95); estoque não confirmado. A maturação em concreto oferece uma alternativa fresca e herbal, com menor influência da madeira.',
        },
      },
    ],
  },
  {
    id: 'canon-la-gaffeliere-2018',
    essentialId: 'bordeaux-right',
    intent: 'explore',
    name: 'Château Canon-la-Gaffelière',
    vintage: 2018,
    priceCad: 200,
    sku: '45222',
    url: 'https://www.lcbo.com/en/chateau-canon-la-gaffeliere-45222',
    retailer: 'lcbo',
    availability: 'unconfirmed',
    checkedAt: SHOPPING_REVIEWED_AT,
    reason: {
      en: 'A Saint-Émilion reference for the Right Bank’s blend balance, combining floral, savoury and dark-fruit character. Some bottle age makes it a useful comparison with Cabernet-led Left Bank Bordeaux.',
      pt: 'Uma referência de Saint-Émilion para o equilíbrio dos cortes da Margem Direita, combinando notas florais, terrosas e de frutas escuras. Alguma evolução em garrafa permite uma comparação interessante com Bordeaux da Margem Esquerda liderado por Cabernet.',
    },
    note: {
      en: 'The cited drinking window is 2026–2043; a window does not establish an exact peak year.',
      pt: 'A janela de consumo citada é 2026–2043; uma janela não define um ano exato de auge.',
    },
    alternatives: [
      {
        name: 'Château Laroque 2023',
        priceCad: 55,
        url: 'https://www.lcbo.com/en/chateau-laroque-2023-40496',
        note: {
          en: 'A lower-priced option to hold, with a cited 2033–2053 drinking window. Confirm stock and ordering terms; plan for patience before tasting.',
          pt: 'Uma opção mais acessível para guardar, com janela de consumo citada de 2033–2053. Confirme estoque e condições de compra; conte com tempo de guarda antes de provar.',
        },
      },
    ],
  },
  {
    id: 'el-enemigo-as-bravas-2017',
    essentialId: 'mendoza-malbec',
    intent: 'explore',
    name: 'El Enemigo As Bravas Malbec',
    vintage: 2017,
    priceCad: 150,
    sku: '50299',
    url: 'https://www.vintagesshoponline.com/vintages/Public/OrderProgramProducts.aspx?programId=1332&lang=en',
    retailer: 'cellar-collection',
    availability: 'observed-stock',
    observedQuantity: 20,
    checkedAt: SHOPPING_REVIEWED_AT,
    reason: {
      en: 'A Malbec-led Mendoza reference with restrained fruit, freshness and developed texture from extended ageing in large used oak casks. It explores the grape beyond richness and concentration.',
      pt: 'Uma referência de Mendoza liderada por Malbec, com fruta contida, frescor e textura desenvolvida pela longa maturação em grandes tonéis de carvalho usados. Explora a uva além da riqueza e da concentração.',
    },
    note: {
      en: '95% Malbec and 5% Sémillon. A Cabernet Franc-led blend containing some Malbec does not provide the same stylistic reference. The collection names Gualtallary, while its embedded critic note names El Cepillo; Mendoza/Uco Valley is the broad origin used here. The 20-bottle count was a dated observation, not a reservation.',
      pt: '95% Malbec e 5% Sémillon. Um corte liderado por Cabernet Franc com alguma Malbec não oferece a mesma referência de estilo. A coleção cita Gualtallary, enquanto a crítica incluída cita El Cepillo; aqui se usa a origem ampla Mendoza/Vale do Uco. A contagem de 20 garrafas foi uma observação datada, não uma reserva.',
    },
    alternatives: [
      {
        name: 'Catena Malbec',
        priceCad: 22.95,
        url: 'https://www.lcbo.com/en/catena-malbec-478727',
        note: {
          en: 'A more conventional, affordable varietal reference. The listing did not establish the current bottle vintage, and stock was unconfirmed.',
          pt: 'Uma referência varietal mais convencional e acessível. A página não confirmou a safra atual da garrafa, e o estoque não foi confirmado.',
        },
      },
    ],
  },
  {
    id: 'faust-cabernet-sauvignon-2021',
    essentialId: 'napa-cabernet',
    intent: 'explore',
    name: 'Faust Cabernet Sauvignon',
    vintage: 2021,
    priceCad: 74.95,
    sku: '238261',
    url: 'https://www.lcbo.com/fr/cabernet-sauvignon-faust-2018-238261',
    retailer: 'lcbo',
    availability: 'unavailable',
    checkedAt: SHOPPING_REVIEWED_AT,
    reason: {
      en: 'A future Napa Valley Cabernet Sauvignon reference for comparing the region’s ripe fruit and polished structure with Cabernet-led Bordeaux.',
      pt: 'Uma futura referência de Cabernet Sauvignon de Napa Valley para comparar a fruta madura e a estrutura polida da região com Bordeaux liderado por Cabernet.',
    },
    note: {
      en: 'Unavailable at review: LCBO’s U.S. product restriction covered online and in-store sales until further notice. C$74.95 is the historical listed price, not a live purchasable offer. A Cabernet from another origin does not represent Napa.',
      pt: 'Indisponível na revisão: a restrição da LCBO a produtos dos EUA abrangia vendas on-line e em lojas até novo aviso. C$74,95 é o preço histórico anunciado, não uma oferta disponível para compra. Um Cabernet de outra origem não representa Napa.',
    },
  },
  {
    id: 'chave-offerus-saint-joseph-2023',
    essentialId: 'rhone-syrah',
    intent: 'restock',
    name: 'J. L. Chave Sélection Offerus Saint-Joseph',
    vintage: 2023,
    priceCad: 50.95,
    sku: '359109',
    url: 'https://www.lcbo.com/en/j-l-chave-s-clection-offerus-saint-joseph-2018-359109',
    retailer: 'lcbo',
    availability: 'unconfirmed',
    checkedAt: SHOPPING_REVIEWED_AT,
    reason: {
      en: 'A Northern Rhône restock suggestion that adds Saint-Joseph’s expression of Syrah to the table: a useful way to revisit the region’s savoury, peppery style and compare appellations.',
      pt: 'Uma sugestão de reposição do Rhône Norte que leva à mesa a expressão de Syrah de Saint-Joseph: uma forma de revisitar o estilo herbal e apimentado da região e comparar denominações.',
    },
    note: {
      en: 'The listing described it as approachable at review, with development through 2033. Stock was unconfirmed.',
      pt: 'A página o descrevia como acessível na revisão, com evolução até 2033. O estoque não foi confirmado.',
    },
  },
  {
    id: 'vina-tondonia-reserva-2013',
    essentialId: 'rioja-red',
    intent: 'contrast',
    name: 'López de Heredia Viña Tondonia Reserva',
    vintage: 2013,
    priceCad: 82.95,
    sku: '356337',
    url: 'https://www.lcbo.com/en/r-l-pez-de-heredia-vi-a-tondonia-reserva-2009-356337',
    retailer: 'lcbo',
    availability: 'unconfirmed',
    checkedAt: SHOPPING_REVIEWED_AT,
    reason: {
      en: 'An optional traditional Rioja contrast: a mature Reserva reference for exploring the relationship between fruit, oak and bottle age alongside more contemporary expressions.',
      pt: 'Um contraste opcional de Rioja tradicional: uma referência de Reserva maduro para explorar a relação entre fruta, madeira e evolução em garrafa ao lado de expressões mais contemporâneas.',
    },
    note: {
      en: 'The published drinking window is 2027–2040. Stock was unconfirmed at review.',
      pt: 'A janela de consumo publicada é 2027–2040. O estoque não foi confirmado na revisão.',
    },
  },
];
