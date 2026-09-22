-- Add ONE Pillitteri Reserve Vidal Icewine 2015 to cellar 1; no price.
-- Run the whole file in Supabase > SQL Editor > New query.
-- Independent of the previous imports. Unassigned location; no personal rating.
-- Fixed ID prevents duplicates on rerun; never overwrites or restocks an existing row.
-- Window and peak are editorial estimates. WE 91 is in notes, not the WA/JS column.
-- Producer information and image are references for another vintage, not 2015.
-- Sources and limitations: 20260922-pillitteri-icewine.md.

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
    "id": "import-20260922-pillitteri-reserve-vidal-2015",
    "bottle": "Pillitteri Estates Winery Reserve Vidal Icewine",
    "country": "Canada",
    "region": "Niagara-on-the-Lake, Ontario",
    "vintage": 2015,
    "style": "Sweet",
    "grapes": "Vidal (100%)",
    "drinking_window": "2026–2035",
    "peak_year": "2028",
    "food_pairing_notes": "Blue cheese or aged cheddar contrasts with the intense sweetness; citrus tarts and fruit pastries should be less sweet than the wine. Serve small pours alongside dessert or cheese.",
    "meal_suggestion": "Blue cheese with toasted walnuts and pear slices, or a lightly sweetened lemon tart.",
    "notes": "VQA Niagara-on-the-Lake; sweet white dessert wine, not the standard non-Reserve Vidal Icewine. Wine Enthusiast: 91 points, Paul Gregutt, July 2020, exact 2015 Reserve; reports neutral-oak ageing, 232 g/L residual sugar and 10.5% ABV. IWSC exact-vintage entries report 11% ABV, Silver Outstanding in 2018 and Silver in 2019; check your bottle for the actual alcohol and size. Published tasting profile: candied citrus and stone fruit, vanilla, maple and honeyed richness balanced by fresh acidity. No verified WA/JS score found; awards are preserved in notes, not mislabelled as WA/JS or personal ratings. Drinking window 2026–2035 and peak 2028 are editorial estimates for a well-stored mature Reserve Icewine, informed by the producer Reserve-series longevity guidance of 20+ years; bottle condition and prior storage matter. Suggested service 10–12°C and meal are editorial. No exact 2015 PDF located: technical-sheet link is a producer page currently describing 2016, supplied only as a cuvée reference. Producer JPG is representative, not 2015 artwork; image filename refers to an older vintage. Bottle volume not assumed.",
    "technical_sheet_url": "https://store.pillitteri.com/products/reserve-vidal-icewine-375ml",
    "bottle_image_url": "https://store.pillitteri.com/cdn/shop/products/2012Vidal_ReserveIW.jpg?v=1618854929&width=1946",
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

-- Confirm this addition; a rerun reports its current state without changing it.
select bottle, vintage, quantity, status, drinking_window, peak_year,
       technical_sheet_url, bottle_image_url, notes
from public.wines
where cellar_id = '1' and id = 'import-20260922-pillitteri-reserve-vidal-2015';
commit;
