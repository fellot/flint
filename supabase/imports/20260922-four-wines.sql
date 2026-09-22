-- Flint: add four wines, one bottle each, to cellar 1. Researched 2026-09-22.
-- Supabase > SQL Editor > New query: paste THIS ENTIRE FILE and click Run.
-- Assumes Les Sinards ROUGE. Location remains unassigned; price is omitted (NULL).
-- Windows/peak years and meal ideas include editorial estimates, identified in notes.
-- Chablis technical sheet is a 2022 reference, NOT a 2024 sheet.
-- Fixed batch IDs make reruns safe: existing rows are NEVER overwritten or restocked.
-- This adds four new inventory entries; it does not merge independently added entries.
-- Full research/limitations: 20260922-four-wines.md.

begin;
set local standard_conforming_strings = on;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- Compatible with installations that have not run the earlier critic-score import.
alter table public.wines
  add column if not exists critic_rating numeric check (critic_rating between 0 and 100),
  add column if not exists critic_ratings jsonb check (jsonb_typeof(critic_ratings) = 'object');

insert into public.wines (
  id, bottle, country, region, vintage, style, grapes, drinking_window, peak_year, food_pairing_notes, meal_suggestion, notes, technical_sheet_url, bottle_image_url, critic_ratings, cellar_id, quantity, location, status, from_cellar, critic_rating
)
select id, bottle, country, region, vintage, style, grapes, drinking_window, peak_year, food_pairing_notes, meal_suggestion, notes, technical_sheet_url, bottle_image_url, critic_ratings, cellar_id, quantity, location, status, from_cellar, critic_rating from jsonb_to_recordset($wines$
[
  {
    "id": "import-20260922-les-sinards-2023",
    "bottle": "Famille Perrin Châteauneuf-du-Pape Les Sinards Rouge",
    "country": "France",
    "region": "Châteauneuf-du-Pape, Southern Rhône",
    "vintage": 2023,
    "style": "Red",
    "grapes": "Grenache, Mourvèdre, Syrah",
    "drinking_window": "2026–2033",
    "peak_year": "2029",
    "food_pairing_notes": "Duck, roast lamb, mushrooms and mature cheeses suit the ripe fruit, spice and supple tannins. Avoid very hot chilli and delicate fish.",
    "meal_suggestion": "Pan-seared duck breast with sautéed mushrooms and thyme-roasted potatoes.",
    "notes": "Assumed to be Les Sinards Rouge. Grenache-led blend; grapes from young Beaucastel vines and two nearby vineyards. Producer: two years in large oak foudres; serve at 15°C. Profile: red berries, violet, earthy spice and fine tannins. Drinking window 2026–2033 and peak 2029 are conservative cellar-planning estimates, not producer guarantees; producer gives 5–10 years of ageing potential. Meal suggestion is editorial. Producer bottle image is representative and may show another vintage.",
    "technical_sheet_url": "https://m.familleperrin.com/1F6ZMF/get/print",
    "bottle_image_url": "https://cdn.vin.co/_clients_folder/perrin/Famille_Perrin_Sinards_Rouge_1651759860_1024.png",
    "critic_ratings": {
      "wine_advocate": {
        "score": 92,
        "display_score": "92",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://m.familleperrin.com/1F6ZMF"
        ],
        "researched_on": "2026-09-22"
      },
      "james_suckling": {
        "score": 94,
        "display_score": "94",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://www.millesima.fr/famille-perrin-les-sinards-2023-1.html",
          "https://www.1jour1vin.com/fr/guide-achat-vin/rhone/vins-chateauneuf-du-pape/perrin/28351-vin-rouge-les-sinards-famille-perrin-2023"
        ],
        "researched_on": "2026-09-22"
      }
    },
    "cellar_id": "1",
    "quantity": 1,
    "location": "",
    "status": "in_cellar",
    "from_cellar": true,
    "critic_rating": 94
  },
  {
    "id": "import-20260922-santa-margherita-2025",
    "bottle": "Santa Margherita Valdadige Pinot Grigio",
    "country": "Italy",
    "region": "Valdadige, Trentino-Alto Adige",
    "vintage": 2025,
    "style": "White",
    "grapes": "Pinot Grigio (100%)",
    "drinking_window": "2026–2028",
    "peak_year": "2026",
    "food_pairing_notes": "Light, dry and fresh: pair with seafood salads, grilled white fish, shellfish pasta and simply prepared chicken. Keep sauces light.",
    "meal_suggestion": "Grilled sea bass with lemon, parsley and a fennel salad.",
    "notes": "Valdadige DOC, not the separate Alto Adige bottling. Dry white with apple, pear and floral character. Producer cuvée specification: 12.5% ABV; gentle pressing, no skin contact, stainless-steel fermentation and storage; serve at 10–12°C. Technical sheet is generic, not a 2025-specific analysis. Drinking window 2026–2028 and peak 2026 are editorial estimates prioritizing freshness. Meal suggestion is editorial. No verified WA/JS score found for 2025. Producer image is a representative cuvée image in WebP.",
    "technical_sheet_url": "https://www.santamargherita.com/administrator/components/com_winery/media/pdf/79edd58e5d3d84e46c51554caa841671-Santa-Margherita-Pinot-Grigio-Valdadige-DOC.pdf",
    "bottle_image_url": "https://www.santamargherita.com/images/prodotti/bianchi/pinot_grigio_valdadige/Pinot-Grigio-Valdadige-DOC---Vini-Tradizione.webp",
    "critic_ratings": null,
    "cellar_id": "1",
    "quantity": 1,
    "location": "",
    "status": "in_cellar",
    "from_cellar": true,
    "critic_rating": null
  },
  {
    "id": "import-20260922-les-venerables-2024",
    "bottle": "La Chablisienne Chablis Les Vénérables Vieilles Vignes",
    "country": "France",
    "region": "Chablis, Burgundy",
    "vintage": 2024,
    "style": "White",
    "grapes": "Chardonnay (100%)",
    "drinking_window": "2026–2032",
    "peak_year": "2028",
    "food_pairing_notes": "Suggested pairings: scallops, roast chicken, white fish with a light cream sauce, and mild hard cheeses; acidity should balance richness without overwhelming delicate flavours.",
    "meal_suggestion": "Seared scallops with lemon beurre blanc and sautéed leeks.",
    "notes": "2024 identity confirmed by Decanter: dry, medium-bodied, oaked Chablis, 100% Chardonnay. Producer cuvée background from its 2022 sheet: roughly 50-year-old vines on Kimmeridgian clay-limestone; tank/barrel fermentation and about 12 months on fine lees. These production details are background, not verified 2024 specifications. The linked technical sheet is explicitly 2022, supplied only as a cuvée reference; no 2024 sheet found and the producer 2023 PDF returned 404. No 2024-specific tasting description or WA/JS rating verified. Drinking window 2026–2032, peak 2028, service at 10–12°C and food/meal pairings are editorial estimates. Bottle PNG is representative, not confirmed 2024 artwork.",
    "technical_sheet_url": "https://chablisienne.com/media/wysiwyg/Chablis_Les_v_n_rables_2022.pdf",
    "bottle_image_url": "https://chablisienne.com/media/catalog/product/cache/2/image/5616fca04353d535343084001b248fbc/c/h/chablis_les_venerables_web_1_1_1_1.png",
    "critic_ratings": null,
    "cellar_id": "1",
    "quantity": 1,
    "location": "",
    "status": "in_cellar",
    "from_cellar": true,
    "critic_rating": null
  },
  {
    "id": "import-20260922-castelgiocondo-2021",
    "bottle": "Frescobaldi CastelGiocondo Brunello di Montalcino",
    "country": "Italy",
    "region": "Montalcino, Tuscany",
    "vintage": 2021,
    "style": "Red",
    "grapes": "Sangiovese (100%)",
    "drinking_window": "2028–2042",
    "peak_year": "2033",
    "food_pairing_notes": "Suggested pairings: steak, braised beef, lamb, mushroom dishes and aged Pecorino. Protein and fat balance the firm tannins; savoury dishes complement its earthy, spicy character.",
    "meal_suggestion": "Bistecca alla fiorentina with rosemary potatoes and white beans.",
    "notes": "Brunello di Montalcino DOCG. 14.5% ABV reported by exact-vintage merchants. Producer: stainless-steel fermentation, wood maturation and bottle refinement; berry/floral aromas, pepper, tea and tobacco, with fresh acidity and ripe tannins. 2028–2042 follows the Vinous window reproduced by Woodland Hills; peak 2033 is an editorial planning estimate. Suggested service: 16–18°C, with 1–2 hours of air while young; pairings are editorial. JS 95 and WA 93 are supported by exact-vintage merchants. An isolated merchant advertises JS 97 without a matching review; not treated as a verified higher score. Producer PNG is explicitly labelled 2021.",
    "technical_sheet_url": "https://www.frescobaldi.com/en/pdf/castelgiocondo/2021",
    "bottle_image_url": "https://www.frescobaldi.com/images/thumbs/0003760_castelgiocondo.png",
    "critic_ratings": {
      "wine_advocate": {
        "score": 93,
        "display_score": "93",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://shop.klwines.com/products/details/2038415"
        ],
        "researched_on": "2026-09-22"
      },
      "james_suckling": {
        "score": 95,
        "display_score": "95",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://shop.klwines.com/products/details/2038415",
          "https://whwc.com/frescobaldi-brunello-di-montalcino-castelgiocondo-2021/"
        ],
        "researched_on": "2026-09-22"
      }
    },
    "cellar_id": "1",
    "quantity": 1,
    "location": "",
    "status": "in_cellar",
    "from_cellar": true,
    "critic_rating": 95
  }
]
$wines$::jsonb) as wine(
  id text,
  bottle text,
  country text,
  region text,
  vintage integer,
  style text,
  grapes text,
  drinking_window text,
  peak_year text,
  food_pairing_notes text,
  meal_suggestion text,
  notes text,
  technical_sheet_url text,
  bottle_image_url text,
  critic_ratings jsonb,
  cellar_id text,
  quantity integer,
  location text,
  status text,
  from_cellar boolean,
  critic_rating numeric
)
on conflict (cellar_id, id) do nothing;

-- Confirm the four batch entries. A rerun reports their current state unchanged.
select bottle, vintage, quantity, status, location, drinking_window, peak_year,
       critic_rating, technical_sheet_url, bottle_image_url
from public.wines
where cellar_id = '1' and id in (
  'import-20260922-les-sinards-2023',
  'import-20260922-santa-margherita-2025',
  'import-20260922-les-venerables-2024',
  'import-20260922-castelgiocondo-2021'
)
order by bottle;
commit;
