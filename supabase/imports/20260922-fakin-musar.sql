-- Flint: Fakin La Prima Malvazija 2023 and Château Musar Red 2019.
-- Run the ENTIRE file in Supabase > SQL Editor > New query.
-- Adds one bottle each to cellar 1, with unassigned location and no price.
-- Independent of 20260922-four-wines.sql; does not add the first four again.
-- Fixed IDs make reruns safe; existing entries are never overwritten/restocked.
-- DWWA and Wine Enthusiast awards are preserved in notes, not WA/JS columns.
-- Drinking windows/peaks include editorial estimates clearly identified in notes.
-- Research and limitations: 20260922-fakin-musar.md.

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
    "id": "import-20260922-fakin-la-prima-2023",
    "bottle": "Fakin La Prima Malvazija",
    "country": "Croatia",
    "region": "Motovun, Istria",
    "vintage": 2023,
    "style": "White",
    "grapes": "Malvazija Istarska (100%)",
    "drinking_window": "2026–2031",
    "peak_year": "2028",
    "food_pairing_notes": "Rich seafood, scallops, lobster, mushroom risotto and truffle pasta complement this textured, dry white. Its citrus freshness balances butter and cream.",
    "meal_suggestion": "Istrian fuži pasta with truffles and a light butter sauce.",
    "notes": "750 mL; dry white; 14% ABV per supplied listing. Decanter World Wine Awards 2025: 96 points for the 2023 vintage, as supplied by the owner and corroborated by the Istria tourism award summary. Supplied tasting note describes pear, stone fruit, honeyed floral and citrus aromas, a waxy texture and a mineral finish. Producer cuvée background (not a vintage-specific sheet): Komarso site, hand-harvested; 12 months in acacia barrels; serve at 14–16°C. Drinking window 2026–2031 and peak 2028 are editorial planning estimates, assuming good storage; meal suggestion is editorial. No exact 2023 PDF or verified WA/JS rating found. Technical-sheet link points to the producer information page, not a PDF. Producer bottle JPG is representative and not confirmed 2023 artwork. DWWA 96 is recorded here, not mislabelled as a WA/JS score.",
    "technical_sheet_url": "https://fakinwines.com/en/fakin-single-vineyard/",
    "bottle_image_url": "https://fakinwines.com/wp-content/uploads/2023/11/Fakin-Wines-La-Prima-scaled.jpg",
    "critic_ratings": null,
    "cellar_id": "1",
    "quantity": 1,
    "location": "",
    "status": "in_cellar",
    "from_cellar": true,
    "critic_rating": null
  },
  {
    "id": "import-20260922-chateau-musar-red-2019",
    "bottle": "Château Musar Red",
    "country": "Lebanon",
    "region": "Bekaa Valley",
    "vintage": 2019,
    "style": "Red",
    "grapes": "Cabernet Sauvignon, Cinsault, Carignan (equal parts)",
    "drinking_window": "2026–2036",
    "peak_year": "2031",
    "food_pairing_notes": "Roast or grilled lamb, beef casseroles, game and mature cheeses suit the savoury spice, acidity and fine tannins.",
    "meal_suggestion": "Slow-roasted lamb shoulder with rosemary, garlic and roasted aubergine.",
    "notes": "750 mL. Producer 2019 sheet: 13.5% ABV; supplied retail listing says 14% (check bottle label for your lot). Equal-parts blend, native-yeast fermentation in concrete, 12 months in French Nevers oak; blended winter 2021 and bottled unfined/unfiltered July–August 2022, released January 2026. Dark berry and plum character with olive, clove and pepper; fresh acidity and integrated tannins. Producer recommends standing upright overnight, carefully decanting off sediment, allowing an hour of air and serving at 18°C. Planning window 2026–2036 follows The Wine Society 750 mL listing; peak 2031 is an editorial estimate, not a producer guarantee. The wine can age longer in suitable storage. Meal suggestion is editorial. No verified exact-vintage WA/JS score found. Producer news reports Wine Enthusiast 96 for Red 2019; retained as a separately attributed note, not a WA/JS score. Exact-vintage producer PDF and 2019 bottle JPG linked; no PNG found.",
    "technical_sheet_url": "https://chateaumusar.com/wp-content/uploads/2017/06/Chateau-Musar-Red-2019-Tasting-Notes.pdf",
    "bottle_image_url": "https://chateaumusar.com/wp-content/uploads/2025/11/Chateau-Musar-Red-2019-274x1024.jpg",
    "critic_ratings": null,
    "cellar_id": "1",
    "quantity": 1,
    "location": "",
    "status": "in_cellar",
    "from_cellar": true,
    "critic_rating": null
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

-- Confirm these two additions (reruns leave them unchanged).
select bottle, vintage, quantity, status, drinking_window, peak_year,
       technical_sheet_url, bottle_image_url, notes
from public.wines
where cellar_id = '1' and id in (
  'import-20260922-fakin-la-prima-2023',
  'import-20260922-chateau-musar-red-2019'
)
order by bottle;
commit;
