import { GRAPES } from './grapes';

export type GrapeId = typeof GRAPES[number]['id'];
export type Localized = Readonly<{ en: string; pt: string }>;
type Level = 1 | 2 | 3 | 4 | 5;
type Levels = readonly [Level, Level, Level, Level, Level, Level, Level, Level, Level, Level];
export type FlavourAxis = Readonly<{ id: string; label: Localized; colour: string; meaning: Localized }>;
const t = (en: string, pt: string): Localized => ({ en, pt });
const axis = (id: string, en: string, pt: string, colour: string, meaning: string, meaningPt: string): FlavourAxis =>
  ({ id, label: t(en, pt), colour, meaning: t(meaning, meaningPt) });

const body = axis('body', 'Body', 'Corpo', '#bd6663', 'Weight and fullness on the palate: light to full.', 'Peso e volume na boca: de leve a encorpado.');
const acidity = axis('acidity', 'Acidity', 'Acidez', '#b79848', 'The mouth-watering, fresh sensation: low to high.', 'A sensação de frescor e salivação: de baixa a alta.');
const floral = axis('floral', 'Floral', 'Flores', '#99859f', 'Flower-like aromas; these do not imply sweetness.', 'Aromas que lembram flores; não significam doçura.');
const herbal = axis('herbal', 'Herbal', 'Ervas', '#738263', 'Fresh or dried herbs and leafy notes.', 'Ervas frescas ou secas e notas de folhas.');
const spice = axis('spice', 'Spice', 'Especiarias', '#b17c51', 'Anise, clove or other spices. Oak can add to this impression.', 'Anis, cravo e outras especiarias. A madeira pode realçar essa impressão.');
const citrus = axis('citrus', 'Citrus', 'Cítricos', '#bba550', 'Lemon, lime, grapefruit or orange-like aromas.', 'Aromas que lembram limão, lima, toranja ou laranja.');
const orchard = axis('orchard', 'Apple / pear', 'Maçã / pera', '#7f966a', 'Apple, pear and quince-like fruit.', 'Frutas que lembram maçã, pera e marmelo.');
const nuts = axis('nuts', 'Nuts', 'Castanhas', '#937552', 'Almond and walnut notes; often shaped by ageing.', 'Notas de amêndoas e nozes, frequentemente ligadas à maturação.');

export const FLAVOUR_AXES = {
  red: [
    axis('red-fruit', 'Red fruit', 'Fruta vermelha', '#b64358', 'Cherry, raspberry, strawberry or redcurrant-like fruit.', 'Frutas que lembram cereja, framboesa, morango ou groselha vermelha.'),
    axis('dark-fruit', 'Dark fruit', 'Fruta escura', '#68283d', 'Blackcurrant, blackberry, blueberry or dark plum-like fruit.', 'Frutas que lembram cassis, amora, mirtilo ou ameixa escura.'),
    floral, herbal,
    axis('pepper', 'Pepper', 'Pimenta', '#677976', 'Black or white pepper aromas, rather than chilli heat.', 'Aromas de pimenta-do-reino, não a ardência de pimentas.'),
    axis('earth', 'Earthy', 'Terroso', '#8b695b', 'Savoury, earthy or forest-floor impressions, often clearer with age.', 'Impressões terrosas e de bosque, muitas vezes mais claras com a idade.'),
    spice, body, acidity,
    axis('tannin', 'Tannin', 'Taninos', '#58616a', 'The drying, grippy sensation from grape skins, seeds and sometimes oak.', 'A sensação seca e adstringente das cascas, sementes e, às vezes, da madeira.'),
  ],
  white: [citrus, orchard,
    axis('stone-fruit', 'Stone fruit', 'Fruta de caroço', '#c58a62', 'Peach, apricot and nectarine-like aromas.', 'Aromas que lembram pêssego, damasco e nectarina.'),
    axis('tropical', 'Tropical', 'Tropical', '#c6a061', 'Pineapple, mango, passion fruit or lychee-like aromas.', 'Aromas que lembram abacaxi, manga, maracujá ou lichia.'),
    floral, herbal, spice,
    axis('honey', 'Honeyed', 'Mel', '#a78546', 'Honey or beeswax aromas. These can occur in dry wines too, especially with age.', 'Aromas de mel ou cera. Também podem aparecer em vinhos secos, especialmente com a idade.'),
    body, acidity,
  ],
  aged: [citrus, orchard,
    axis('dried-fruit', 'Dried fruit', 'Fruta seca', '#94636a', 'Raisin, fig and dried apricot-like aromas, often from drying or ageing.', 'Aromas que lembram passas, figos e damascos secos, ligados à secagem ou maturação.'),
    nuts,
    axis('caramel', 'Caramel', 'Caramelo', '#ac7e46', 'Toffee and caramel-like notes developed by the wine style.', 'Notas de caramelo ligadas ao estilo de elaboração.'),
    floral,
    axis('yeasty', 'Yeasty', 'Levedura', '#929475', 'Bread-like or savoury notes from yeast contact or a veil of flor.', 'Notas de pão ou notas salgadas do contato com leveduras ou da flor.'),
    spice, body, acidity,
  ],
} as const satisfies Record<string, readonly FlavourAxis[]>;

export type GrapeFlavourProfile = Readonly<{
  wheel: keyof typeof FLAVOUR_AXES;
  levels: Levels;
  aromas: Localized;
  variation: Localized;
  style: Localized;
  source?: Readonly<{ name: string; url: string }>;
}>;
const red = (levels: Levels, en: string, pt: string, note: string, notePt: string, source?: GrapeFlavourProfile['source']): GrapeFlavourProfile =>
  ({ wheel: 'red', levels, aromas: t(en, pt), variation: t(note, notePt), style: t('Typical red-wine expression', 'Expressão típica em vinho tinto'), source });
const white = (levels: Levels, en: string, pt: string, note: string, notePt: string, source?: GrapeFlavourProfile['source']): GrapeFlavourProfile =>
  ({ wheel: 'white', levels, aromas: t(en, pt), variation: t(note, notePt), style: t('Typical white-wine expression', 'Expressão típica em vinho branco'), source });
const source = (name: string, url: string) => ({ name, url });

// Original, indicative editorial sketches, not analytical measurements or copied
// source scores. Order follows FLAVOUR_AXES. Sources support the qualitative
// descriptions; their authors did not assign these numerical levels.
// Reviewed 2026-10-02. Never use these levels as personal preference evidence.
export const GRAPE_FLAVOURS = {
  aglianico: red([3,4,2,2,3,4,3,5,4,5], 'Black cherry · plum · savoury spice', 'Cereja escura · ameixa · especiarias', 'Firm when young; bottle age softens its grip and brings more savoury detail.', 'Firme quando jovem; a idade suaviza os taninos e amplia as notas terrosas.'),
  albarino: white([5,3,4,1,3,2,1,1,2,5], 'Lime · nectarine · blossom', 'Lima · nectarina · flores', 'Usually bright and citrus-led; time on lees can make the texture rounder.', 'Geralmente fresco e cítrico; o contato com as borras pode arredondar a textura.'),
  'alicante-bouschet': red([2,5,2,2,3,3,3,5,3,5], 'Blackberry · dark plum · pepper', 'Amora · ameixa escura · pimenta', 'Its deeply coloured flesh contributes density; extraction changes the tannic grip.', 'Sua polpa escura contribui para a densidade; a extração altera a força dos taninos.'),
  arneis: white([3,4,3,1,3,2,1,2,3,3], 'Pear · peach · white flowers', 'Pera · pêssego · flores brancas', 'Often rounded, with an almond-like finish; freshness depends on ripeness.', 'Frequentemente redondo, com final amendoado; o frescor depende da maturação da uva.'),
  assyrtiko: white([5,2,2,1,2,2,1,1,3,5], 'Lemon · grapefruit · saline edge', 'Limão · toranja · toque salino', 'The wheel represents dry wine; sweet Vinsanto and oak-aged styles differ greatly.', 'A roda representa vinho seco; Vinsanto doce e versões com madeira são bem diferentes.'),
  barbera: red([5,3,2,2,2,3,2,3,5,2], 'Tart cherry · plum · dried herbs', 'Cereja ácida · ameixa · ervas secas', 'High freshness with relatively gentle tannins; oak can add weight and spice.', 'Muito frescor e taninos relativamente suaves; a madeira pode acrescentar corpo e especiarias.'),
  blaufrankisch: red([3,4,3,2,4,3,2,3,4,4], 'Cherry · blackberry · pepper', 'Cereja · amora · pimenta', 'Ranges from lively and lean to concentrated; spice often remains a signature.', 'Vai de leve e vibrante a concentrado; as especiarias costumam ser marcantes.'),
  bobal: red([3,4,2,2,2,3,3,4,4,4], 'Blackberry · pomegranate · liquorice', 'Amora · romã · alcaçuz', 'Old vines can give concentrated fruit; lighter extraction makes a gentler wine.', 'Vinhas velhas podem dar fruta concentrada; menor extração torna o vinho mais suave.'),
  'cabernet-franc': red([4,3,3,5,3,3,2,3,4,3], 'Raspberry · violet · leafy herbs', 'Framboesa · violeta · folhas', 'Cool sites emphasise leafy freshness; riper sites shift toward darker fruit.', 'Locais frios realçam o frescor vegetal; locais quentes tendem à fruta mais escura.'),
  'cabernet-sauvignon': red([2,5,2,4,2,3,3,5,4,5], 'Cassis · blackberry · dried herbs', 'Cassis · amora · ervas secas', 'Ripeness changes the herbal edge; cedar and vanilla often reflect oak ageing.', 'A maturação altera o toque vegetal; cedro e baunilha frequentemente vêm da madeira.'),
  canaiolo: red([4,2,4,2,1,2,2,3,3,2], 'Red berries · violet · rose', 'Frutas vermelhas · violeta · rosa', 'Usually a blending partner; this sketch draws on a varietal example, not a Chianti blend.', 'Geralmente usada em cortes; este perfil parte de um exemplo varietal, não de um Chianti.', source('Castelvecchio · Canaiolo', 'https://www.castelvecchio.it/en/numero-otto/')),
  carignan: red([4,3,2,3,3,4,3,3,4,4], 'Cranberry · raspberry · savoury herbs', 'Cranberry · framboesa · ervas', 'Old-vine fruit can be concentrated; carbonic fermentation gives a softer, fruitier style.', 'Vinhas velhas podem dar concentração; a maceração carbônica traz mais fruta e suavidade.'),
  carmenere: red([3,4,2,5,3,2,3,4,3,3], 'Plum · raspberry · green pepper', 'Ameixa · framboesa · pimentão', 'Riper fruit tones down the green notes; oak can introduce cocoa and baking spice.', 'Uvas mais maduras suavizam as notas verdes; a madeira pode trazer cacau e especiarias.'),
  carricante: white([5,3,2,1,2,2,1,1,2,5], 'Lemon · green apple · saline edge', 'Limão · maçã verde · toque salino', 'Typically lean and bright; lees or bottle age can broaden its texture.', 'Tipicamente leve e fresco; borras ou idade em garrafa podem ampliar a textura.', source('Wine Folly · Sicily', 'https://sicily.guides.winefolly.com/wines/carricante/')),
  chardonnay: white([4,4,3,3,2,1,2,2,3,4], 'Apple · lemon · peach', 'Maçã · limão · pêssego', 'A fresh-fruit baseline: oak adds toast, while malolactic fermentation can add buttery notes.', 'Uma base de fruta fresca: madeira traz tostado; fermentação malolática pode trazer notas amanteigadas.'),
  'chenin-blanc': white([4,5,3,2,3,2,2,3,3,5], 'Quince · apple · beeswax', 'Marmelo · maçã · cera', 'Dry, sparkling and sweet styles share acidity; age and botrytis can amplify honeyed notes.', 'Estilos secos, espumantes e doces compartilham a acidez; idade e botrytis podem realçar o mel.'),
  cinsault: red([5,1,4,2,1,2,2,2,3,2], 'Strawberry · cherry · flowers', 'Morango · cereja · flores', 'Often delicate and fragrant; rosé and old-vine reds offer different textures.', 'Frequentemente delicada e perfumada; rosés e tintos de vinhas velhas têm texturas diferentes.'),
  cortese: white([4,4,2,1,3,2,1,1,2,4], 'Lemon · green apple · white flowers', 'Limão · maçã verde · flores brancas', 'Gavi is a classic dry expression; lees ageing can add breadth to its crisp core.', 'Gavi é uma expressão seca clássica; borras podem dar volume à base fresca.'),
  corvina: red([5,2,3,2,2,3,3,2,4,2], 'Sour cherry · herbs · almond', 'Cereja ácida · ervas · amêndoa', 'This is a fresh-grape red profile; drying grapes for Amarone adds body and dried-fruit character.', 'Este perfil é de uvas frescas; a secagem para Amarone acrescenta corpo e fruta passa.'),
  dolcetto: red([3,4,3,2,1,2,2,3,2,4], 'Black cherry · plum · violet', 'Cereja escura · ameixa · violeta', 'Despite its name, usually dry; tannins can feel firmer than its modest acidity suggests.', 'Apesar do nome, costuma ser seco; os taninos podem parecer firmes diante da acidez moderada.'),
  fiano: white([3,3,4,2,3,2,2,3,4,3], 'Pear · peach · hazelnut', 'Pera · pêssego · avelã', 'Often textured; nutty and waxy nuances may become clearer with age.', 'Frequentemente texturizado; nuances de castanhas e cera podem aparecer com a idade.'),
  furmint: white([5,4,3,1,2,2,2,2,3,5], 'Quince · apple · lemon', 'Marmelo · maçã · limão', 'Dry Furmint is the baseline here; botrytised Tokaji adds sweetness and dried-fruit complexity.', 'Aqui a base é Furmint seco; Tokaji com botrytis acrescenta doçura e complexidade de fruta seca.'),
  gamay: red([5,2,4,2,1,3,2,2,4,2], 'Cherry · raspberry · violet', 'Cereja · framboesa · violeta', 'Cru Beaujolais can be firmer and more earthy than youthful, fruit-led examples.', 'Crus de Beaujolais podem ser mais firmes e terrosos que exemplos jovens e frutados.'),
  garganega: white([4,3,3,1,3,2,1,2,3,4], 'Peach · citrus · almond', 'Pêssego · cítricos · amêndoa', 'Dry Soave is the reference; richer late-harvest wines have a different balance.', 'Soave seco é a referência; vinhos de colheita tardia têm outro equilíbrio.'),
  gewurztraminer: white([2,2,3,5,5,1,4,3,4,2], 'Lychee · rose · ginger', 'Lichia · rosa · gengibre', 'Perfume can suggest sweetness even in dry wines; check the actual style and sugar.', 'O perfume pode sugerir doçura mesmo em vinhos secos; confira o estilo e o açúcar.'),
  glera: { ...white([3,5,3,1,4,1,1,1,2,4], 'Pear · green apple · blossom', 'Pera · maçã verde · flores', 'A youthful Prosecco-style sketch; dosage changes sweetness, and lees ageing adds other aromas.', 'Um perfil de Prosecco jovem; a dosagem altera a doçura, e as borras acrescentam outros aromas.', source('Zardetto · Glera Prosecco', 'https://usa.zardettoprosecco.com/wines/prosecco-doc-organic-grapes/')), style: t('Young sparkling expression', 'Expressão em espumante jovem') },
  godello: white([4,4,3,1,3,2,1,2,3,4], 'Grapefruit · quince · white flowers', 'Toranja · marmelo · flores brancas', 'Can be taut or creamy; lees and oak have a strong influence on texture.', 'Pode ser firme ou cremoso; borras e madeira influenciam bastante a textura.'),
  graciano: red([3,4,3,3,2,3,3,3,5,4], 'Dark berries · flowers · liquorice', 'Frutas escuras · flores · alcaçuz', 'Often lends freshness and perfume to Rioja blends; age adds savoury layers.', 'Costuma trazer frescor e perfume aos cortes de Rioja; a idade acrescenta notas terrosas.', source('Rioja DOCa', 'https://riojawine.com/en-us/the-designation/grape-varieties/graciano/')),
  greco: white([4,4,3,1,3,2,2,2,3,4], 'Citrus · pear · peach', 'Cítricos · pera · pêssego', 'Often combines freshness with a firm, slightly phenolic texture.', 'Costuma combinar frescor com uma textura firme e ligeiramente fenólica.'),
  grenache: red([5,3,2,3,3,2,4,4,3,2], 'Strawberry · raspberry · warm spice', 'Morango · framboesa · especiarias', 'Warm sites bring richer fruit and body; altitude and earlier picking preserve freshness.', 'Locais quentes trazem fruta rica e corpo; altitude e colheita mais cedo preservam o frescor.'),
  'grenache-blanc': white([3,4,3,1,3,2,2,2,4,2], 'Pear · yellow plum · honeysuckle', 'Pera · ameixa amarela · madressilva', 'Often broad and rounded; oak or earlier picking can markedly change its balance.', 'Frequentemente amplo e redondo; madeira ou colheita mais cedo podem mudar seu equilíbrio.'),
  'gruner-veltliner': white([4,3,2,1,2,4,4,1,3,5], 'Lime · green herbs · white pepper', 'Lima · ervas verdes · pimenta branca', 'Pepper sits in the spice sector here; styles range from lean to rich late-picked wines.', 'A pimenta entra no setor de especiarias; os estilos vão de leves a ricos, de colheita tardia.'),
  malbec: red([2,5,4,1,2,2,3,4,3,4], 'Plum · blackberry · violet', 'Ameixa · amora · violeta', 'Altitude can lift floral notes and freshness; warmer sites tend toward plush fruit.', 'A altitude pode realçar flores e frescor; locais quentes tendem à fruta macia e madura.'),
  'malvazija-istarska': white([3,4,4,1,4,2,1,2,3,3], 'Acacia · apple · apricot', 'Acácia · maçã · damasco', 'This is Istrian Malvazija specifically; skin contact and ageing can make it much more textured.', 'É a Malvazija da Ístria; contato com cascas e maturação podem aumentar bastante a textura.', source('Vinistra', 'https://vinistra.hr/en/malvasia-istriana')),
  mammolo: red([3,1,5,2,1,2,4,3,3,2], 'Violet · blood orange · ginger', 'Violeta · laranja sanguínea · gengibre', 'Usually a fragrant blending grape; this sketch uses a varietal producer example.', 'Geralmente perfuma cortes; este perfil usa um exemplo varietal de produtor.', source('Piandaccoli · Mammolo', 'https://piandaccoliwine.com/wp-content/uploads/2024/06/Mammolo.pdf')),
  marsanne: white([2,4,3,2,3,2,2,3,4,2], 'Pear · melon · almond', 'Pera · melão · amêndoa', 'Often broad rather than sharply acidic; age can introduce richer nutty notes.', 'Costuma ser ampla, com acidez moderada; a idade pode trazer notas de castanhas.'),
  mencia: red([4,3,3,3,3,3,2,3,4,3], 'Cherry · violet · herbs', 'Cereja · violeta · ervas', 'Cooler hillside sites often show more freshness; extraction changes weight and grip.', 'Encostas frescas costumam mostrar mais vivacidade; a extração altera peso e taninos.'),
  merlot: red([3,5,2,2,1,3,3,4,3,3], 'Plum · black cherry · leafy herbs', 'Ameixa · cereja escura · ervas', 'Ranges from fresh and leafy to plush; cocoa and vanilla can come from oak.', 'Vai de fresco e vegetal a macio e rico; cacau e baunilha podem vir da madeira.'),
  mourvedre: red([2,5,3,3,4,4,3,5,3,5], 'Blackberry · pepper · savoury herbs', 'Amora · pimenta · ervas', 'Warm-climate reds are the reference; rosé and blends express it differently.', 'A referência é o tinto de clima quente; rosés e cortes expressam a uva de outro modo.', source('Wine Folly', 'https://winefolly.com/grapes/monastrell-mourvedre/')),
  muscadelle: white([2,3,3,2,5,1,1,3,3,2], 'Acacia · honeysuckle · honey', 'Acácia · madressilva · mel', 'A small but aromatic component in dry and sweet Bordeaux blends; not the Muscat grape.', 'Componente aromático de cortes bordaleses secos e doces; não é a uva Muscat.', source('Bordeaux wines', 'https://www.bordeaux.com/en/grape-varieties/muscadelle/')),
  'muscat-blanc': white([4,3,3,3,5,1,2,3,2,3], 'Orange blossom · grape · peach', 'Flor de laranjeira · uva · pêssego', 'Made dry, sweet, still, sparkling or fortified; aromatic intensity does not tell you the sugar level.', 'Pode ser seca, doce, tranquila, espumante ou fortificada; o perfume não indica o açúcar.'),
  nebbiolo: red([5,2,5,3,2,4,3,3,5,5], 'Cherry · rose · anise', 'Cereja · rosa · anis', 'A pale colour can hide serious tannins; age adds earth, leather and dried flowers.', 'A cor clara pode esconder taninos fortes; a idade traz terra, couro e flores secas.'),
  negroamaro: red([2,5,2,4,2,3,3,4,3,4], 'Dark plum · blackberry · dried thyme', 'Ameixa escura · amora · tomilho seco', 'Usually ripe and savoury; rosé versions have much less tannin.', 'Geralmente maduro e terroso; versões rosé têm muito menos tanino.'),
  'nerello-mascalese': red([5,2,3,4,2,3,3,2,5,3], 'Cherry · orange peel · dried herbs', 'Cereja · casca de laranja · ervas secas', 'Often light in colour with firm freshness; site and extraction strongly shape the grip.', 'Frequentemente claro e fresco; local e extração moldam bastante os taninos.'),
  'nero-davola': red([3,5,2,2,3,3,3,4,3,4], 'Dark cherry · plum · liquorice', 'Cereja escura · ameixa · alcaçuz', 'Can be juicy and fresh or rich and oak-aged; not every bottle is heavy.', 'Pode ser suculento e fresco ou rico e amadeirado; nem toda garrafa é pesada.'),
  palomino: {
    wheel: 'aged', levels: [2,2,1,4,1,1,5,1,2,2], aromas: t('Almond · bread dough · saline edge', 'Amêndoa · massa de pão · toque salino'),
    style: t('Fino Sherry expression', 'Expressão em Jerez Fino'),
    variation: t('Palomino itself is fairly neutral. This wheel shows Fino: flor ageing creates the nutty, yeasty character. Oloroso and still wines differ.', 'A Palomino é relativamente neutra. A roda mostra Fino: a flor cria notas de castanhas e levedura. Oloroso e vinhos tranquilos são diferentes.'),
    source: source('Consejo Regulador · Fino', 'https://www.sherry.wine/sherry-wine/dry-sherry-wines/fino'),
  },
  'pedro-ximenez': {
    wheel: 'aged', levels: [1,1,5,4,5,1,1,3,5,2], aromas: t('Raisin · fig · toffee', 'Passas · figo · caramelo'),
    style: t('Sweet PX Sherry expression', 'Expressão em Jerez PX doce'),
    variation: t('This familiar sweet style uses dried grapes and ageing. Its richness is not a universal trait of fresh Pedro Ximénez grapes.', 'Este estilo doce usa uvas secas e maturação. A riqueza não é universal nos vinhos de uvas Pedro Ximénez frescas.'),
  },
  'petit-verdot': red([2,5,4,3,3,3,3,5,4,5], 'Blackberry · violet · plum', 'Amora · violeta · ameixa', 'Often a small, powerful blending component; ripe varietal wines can be very concentrated.', 'Frequentemente é uma pequena parte potente de cortes; varietais maduros podem ser muito concentrados.'),
  'petite-sirah': red([2,5,2,2,4,3,3,5,3,5], 'Blueberry · blackberry · pepper', 'Mirtilo · amora · pimenta', 'Durif is not Syrah; skin extraction can make its already firm tannins especially dense.', 'Durif não é Syrah; a extração pode tornar seus taninos firmes ainda mais densos.'),
  'pinot-blanc': white([3,4,3,1,3,1,1,1,3,3], 'Apple · pear · white flowers', 'Maçã · pera · flores brancas', 'Often subtle and rounded; cooler sites and sparkling styles feel fresher.', 'Costuma ser sutil e redondo; locais frios e espumantes parecem mais frescos.'),
  'pinot-gris': white([3,5,3,2,2,1,2,2,3,3], 'Pear · apple · peach', 'Pera · maçã · pêssego', 'A middle-ground sketch: light Pinot Grigio, rich Alsace Gris and skin-contact wines differ widely.', 'Um perfil intermediário: Pinot Grigio leve, Gris rico da Alsácia e vinhos de casca diferem muito.'),
  'pinot-meunier': { ...white([3,4,4,1,3,1,2,1,3,4], 'Apple · peach · yellow plum', 'Maçã · pêssego · ameixa amarela', 'A black grape usually tasted in Champagne. This shows its fresh white-wine expression; lees ageing adds bread and nuts.', 'Uva tinta comum em Champagne. Aqui está sua expressão branca fresca; borras acrescentam pão e castanhas.', source('Comité Champagne', 'https://www.champagne.fr/en/champagne-tasting/the-tasting-experience')), style: t('Fresh Champagne expression', 'Expressão fresca em Champagne') },
  'pinot-noir': red([5,1,4,2,1,4,2,2,4,2], 'Cherry · raspberry · rose', 'Cereja · framboesa · rosa', 'Cool sites tend toward tart red fruit; age can bring forest-floor and mushroom notes.', 'Locais frios tendem à fruta vermelha ácida; a idade pode trazer bosque e cogumelos.'),
  pinotage: red([3,5,2,2,3,3,3,4,3,4], 'Plum · blackberry · savoury spice', 'Ameixa · amora · especiarias', 'Styles range from fresh fruit to concentrated reds; smoke and coffee can be winemaking effects.', 'Vai de fruta fresca a tintos concentrados; fumaça e café podem vir da elaboração.'),
  riesling: white([5,4,3,2,4,1,1,2,2,5], 'Lime · apple · blossom', 'Lima · maçã · flores', 'This wheel does not predict sweetness. Dry and sweet Riesling share high acidity; age may bring wax and petrol.', 'A roda não prevê doçura. Riesling seco e doce compartilham alta acidez; a idade pode trazer cera e petróleo.'),
  roussanne: white([3,3,4,2,3,3,2,3,4,3], 'Apricot · chamomile · beeswax', 'Damasco · camomila · cera', 'Often textured and herbal; oak and bottle age can make the wine richer.', 'Costuma ser texturizada e herbal; madeira e idade podem enriquecer o vinho.'),
  sagrantino: red([2,5,2,3,3,4,3,5,4,5], 'Dark plum · black tea · liquorice', 'Ameixa escura · chá preto · alcaçuz', 'Dry Montefalco is the reference; formidable young tannins soften with time. Passito is a different style.', 'A referência é Montefalco seco; taninos fortes suavizam com o tempo. Passito é outro estilo.'),
  sangiovese: red([5,2,3,4,2,4,3,3,5,4], 'Sour cherry · dried herbs · earth', 'Cereja ácida · ervas secas · terra', 'From light and lively to structured Brunello; oak, site and age shift the balance.', 'Vai de leve e vivo a Brunello estruturado; madeira, local e idade mudam o equilíbrio.'),
  'sauvignon-blanc': white([5,3,2,4,2,5,1,1,2,5], 'Grapefruit · gooseberry · cut herbs', 'Toranja · groselha · ervas frescas', 'Cool climates emphasise herbs; warmer ripeness can bring passion fruit. Oak changes texture.', 'Climas frios realçam ervas; maior maturação pode trazer maracujá. A madeira muda a textura.'),
  savagnin: {
    wheel: 'aged', levels: [3,3,2,5,1,1,3,5,3,5], aromas: t('Walnut · curry · apple', 'Noz · curry · maçã'),
    style: t('Oxidative Jura expression', 'Expressão oxidativa do Jura'),
    variation: t('This is a voile-aged style, not a fortified wine. Topped-up (ouillé) Savagnin is fresher and fruitier, with far less walnut and curry.', 'Este estilo matura sob véu, sem fortificação. Savagnin ouillé, com barril atestado, é mais fresco e frutado, com menos noz e curry.'),
    source: source('Comité des vins du Jura', 'https://www.jura-vins.com/medias/documents-a-telecharger/docs-utiles/CIVJ_PLQ_Pro_2009_GB_web.pdf'),
  },
  semillon: white([3,3,3,1,2,3,2,3,4,3], 'Lemon · yellow apple · beeswax', 'Limão · maçã amarela · cera', 'Young Hunter Valley wines can be lean; age, oak and sweet botrytised styles show quite different richness.', 'Vinhos jovens do Hunter Valley podem ser leves; idade, madeira e botrytis produzem riquezas diferentes.'),
  syrah: red([2,5,4,3,5,3,3,4,4,4], 'Blackberry · violet · black pepper', 'Amora · violeta · pimenta-do-reino', 'Cool-climate Syrah often shows more pepper; warm-climate Shiraz tends toward riper fruit and fuller body.', 'Syrah de clima frio costuma ter mais pimenta; Shiraz de clima quente tende à fruta madura e mais corpo.'),
  tannat: red([2,5,2,2,3,3,3,5,4,5], 'Blackberry · plum · liquorice', 'Amora · ameixa · alcaçuz', 'Extraction and ageing make a big difference to its naturally firm grip.', 'Extração e maturação fazem grande diferença nos seus taninos naturalmente firmes.'),
  tempranillo: red([4,3,2,3,2,4,3,4,3,4], 'Cherry · plum · dried herbs', 'Cereja · ameixa · ervas secas', 'Vanilla, coconut and leather are more prominent in some oak-aged or mature expressions.', 'Baunilha, coco e couro aparecem mais em certas versões com madeira ou maduras.'),
  'tinta-barroca': red([3,4,2,2,1,2,2,4,2,3], 'Ripe berries · plum', 'Frutas maduras · ameixa', 'Mostly encountered in Douro and Port blends. This is a broad grape sketch, not a prediction of Port sweetness.', 'Comum em cortes do Douro e Porto. Este é um perfil geral da uva, não uma previsão da doçura de um Porto.', source('Wines of Portugal', 'https://winesofportugal.com/pt/vinhos-portugueses/castas/tinta-barroca/')),
  'touriga-franca': red([3,4,5,3,1,2,2,4,3,4], 'Blackberry · rose · wild flowers', 'Amora · rosa · flores silvestres', 'Frequently part of a Douro blend, where other varieties and fortification change the result.', 'Frequentemente integra cortes do Douro; outras uvas e a fortificação alteram o resultado.', source('Wines of Portugal', 'https://winesofportugal.com/pt/vinhos-portugueses/castas/touriga-franca/')),
  'touriga-nacional': red([2,5,5,3,2,3,3,5,4,5], 'Blackberry · violet · herbs', 'Amora · violeta · ervas', 'The dry-red expression is shown; Port adds sweetness, alcohol and an ageing-dependent character.', 'Aqui está a expressão tinta seca; Porto acrescenta doçura, álcool e características da maturação.'),
  'trebbiano-toscano': white([4,3,2,1,2,2,1,1,2,4], 'Lemon · green apple · mild herbs', 'Limão · maçã verde · ervas suaves', 'Often restrained rather than highly aromatic; not interchangeable with every grape called Trebbiano.', 'Costuma ser discreta; não é intercambiável com todas as uvas chamadas Trebbiano.'),
  verdejo: white([4,3,3,2,2,4,2,1,2,4], 'Citrus · melon · fennel', 'Cítricos · melão · funcho', 'Usually fresh and herbal; lees ageing can give more volume and texture.', 'Geralmente fresca e herbal; borras podem acrescentar volume e textura.'),
  verdicchio: white([4,3,3,1,2,3,1,1,3,4], 'Lemon · peach · almond', 'Limão · pêssego · amêndoa', 'Almond-like finish and freshness are useful clues; richer aged examples are broader.', 'Final amendoado e frescor são boas pistas; versões maduras podem ser mais amplas.'),
  vermentino: white([5,3,2,1,3,3,1,1,3,4], 'Citrus · apple · herbs', 'Cítricos · maçã · ervas', 'Coastal examples can feel saline; ripeness and lees contact influence the body.', 'Exemplos costeiros podem parecer salinos; maturação e borras influenciam o corpo.'),
  vidal: white([3,3,4,5,3,1,1,3,3,5], 'Pineapple · apricot · honeysuckle', 'Abacaxi · damasco · madressilva', 'Often made as icewine, which concentrates sugar, fruit and texture; dry Vidal is much lighter.', 'Muito usada em icewine, que concentra açúcar, fruta e textura; Vidal seco é bem mais leve.'),
  viognier: white([2,2,5,4,5,1,2,2,5,2], 'Apricot · peach · orange blossom', 'Damasco · pêssego · flor de laranjeira', 'Perfumed fruit can taste sweet even when the wine is dry; picking time strongly affects freshness.', 'O perfume frutado pode sugerir doçura em vinho seco; a colheita influencia muito o frescor.'),
  viura: white([3,4,2,1,3,2,1,2,3,3], 'Apple · pear · white flowers', 'Maçã · pera · flores brancas', 'Young Macabeo can be delicate; long-aged white Rioja adds nutty, savoury and oxidative notes.', 'Macabeo jovem pode ser delicado; Rioja branco envelhecido ganha notas de castanhas e oxidação.'),
  xinomavro: red([4,2,3,4,2,5,3,3,5,5], 'Tart cherry · tomato · olive', 'Cereja ácida · tomate · azeitona', 'A savoury, structured dry-red sketch; tannins and acidity can be striking when young.', 'Perfil tinto seco, terroso e estruturado; taninos e acidez podem ser marcantes quando jovem.'),
  zinfandel: red([4,4,1,2,4,2,4,5,3,3], 'Bramble fruit · plum · pepper', 'Frutas silvestres · ameixa · pimenta', 'Ripeness ranges widely; jammy fruit does not automatically mean the wine is sweet.', 'A maturação varia bastante; fruta em compota não significa automaticamente vinho doce.'),
  zweigelt: red([5,2,3,2,2,2,2,3,4,2], 'Cherry · raspberry · soft spice', 'Cereja · framboesa · especiarias suaves', 'Often juicy and approachable; reserve wines may add concentration and oak influence.', 'Frequentemente suculento e acessível; reservas podem ter mais concentração e madeira.'),
} satisfies Record<GrapeId, GrapeFlavourProfile>;

export function grapeFlavourProfile(id: string): GrapeFlavourProfile | undefined {
  if (!Object.prototype.hasOwnProperty.call(GRAPE_FLAVOURS, id)) return undefined;
  const profile: GrapeFlavourProfile = GRAPE_FLAVOURS[id as GrapeId];
  return { ...profile, source: profile.source || source('Wine Folly', `https://winefolly.com/grapes/${id}/`) };
}
