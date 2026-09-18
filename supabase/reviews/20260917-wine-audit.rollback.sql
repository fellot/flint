-- Flint: restore wine recommendation review, 2026-09-17.
-- Run the WHOLE file in Supabase > SQL Editor. No CLI or application deployment needed.
-- Source: the user's current export, 29 wines in cellar 1.
-- Read 20260917-wine-audit.md for reasons, sources, uncertainty and label checks.
-- Only drinking_window, peak_year, food_pairing_notes and meal_suggestion can change.
-- Peak years and some window bounds are planning estimates, not verified facts.
-- Restores only the fields changed by the paired apply script, while the row remains in the cellar.
-- Missing, consumed, sold, gifted and zero-stock records are skipped.
-- Changed identities or conflicting edits to a target field abort the whole transaction.
-- Rerunning is safe: already matching fields are not updated. updated_at uses the existing trigger.

begin;
set local standard_conforming_strings = on;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

create temporary table flint_wine_review (
  cellar_id text not null check (cellar_id = '1'), id text not null,
  bottle text not null, vintage integer not null,
  expected jsonb not null, proposed jsonb not null, identity_flag text,
  primary key (cellar_id, id)
) on commit drop;

insert into flint_wine_review
select * from jsonb_to_recordset($review_data$
[
  {
    "cellar_id": "1",
    "id": "31",
    "bottle": "Arzuaga Reserva Especial",
    "vintage": 2019,
    "expected": {
      "food_pairing_notes": "Tempranillo-led Ribera del Duero with dark fruit, spice and substantial oak aging. Its richness suits roast lamb, beef in a savoury sauce, game or roast pork. Taste after opening and allow air if the wine seems closed; serve around 16-18 C."
    },
    "proposed": {
      "food_pairing_notes": "Elegant blend of Tempranillo and Cabernet Sauvignon, showcasing rich dark fruit flavors, balanced acidity, and subtle oak. This wine pairs beautifully with roast lamb, particularly when seasoned with rosemary and garlic, as well as with Ibérico pork, which complements its depth. For optimal enjoyment, decant for at least 1 hour to allow the wine to breathe. Critic score: RP 94."
    },
    "identity_flag": null
  },
  {
    "cellar_id": "1",
    "id": "24",
    "bottle": "Casa Ferreirinha Castas Escondidas Douro",
    "vintage": 2019,
    "expected": {
      "food_pairing_notes": "A fresh, structured Douro blend of lesser-known varieties and old-vine fruit, with red and black fruit and peppery spice. Pair with roast lamb, beef, game or a savoury stew; avoid very sweet barbecue glazes. Taste after opening and aerate if needed."
    },
    "proposed": {
      "food_pairing_notes": "The Casa Ferreirinha Castas Escondidas Douro 2019 is a rich, full-bodied red blend featuring Touriga Franca and Tinta Barroca, offering dark fruit flavors and a hint of spice. It pairs excellently with grilled beef, game meats, and hearty stews. For optimal enjoyment, decant for 1-2 hours to allow the wine to breathe and reveal its complexity. Critics have noted its quality, with a score of RP 94."
    },
    "identity_flag": null
  },
  {
    "cellar_id": "1",
    "id": "25",
    "bottle": "Casa Ferreirinha Quinta da Leda",
    "vintage": 2018,
    "expected": {},
    "proposed": {},
    "identity_flag": null
  },
  {
    "cellar_id": "1",
    "id": "2c2ebb2e-413f-4157-b432-dfa0553f00c6",
    "bottle": "Casa Ferreirinha Quinta da Leda 2021",
    "vintage": 2021,
    "expected": {
      "drinking_window": "2025–2041",
      "peak_year": "2031",
      "food_pairing_notes": "Structured Douro red with red and black fruit, pepper and cedar, supported by substantial tannins and fresh acidity. Pair with roast or grilled lamb, beef, game and aged cheeses. Rosemary lamb chops and a savoury red-wine sauce are a good match."
    },
    "proposed": {
      "drinking_window": "2023-2030",
      "peak_year": "2025",
      "food_pairing_notes": "This wine likely has a rich, full-bodied profile with good acidity and tannins, making it suitable for pairing with grilled meats, hearty stews, or aged cheeses."
    },
    "identity_flag": null
  },
  {
    "cellar_id": "1",
    "id": "21",
    "bottle": "Castello Banfi Poggio all'Oro Brunello di Montalcino Riserva",
    "vintage": 2016,
    "expected": {
      "drinking_window": "2025–2043",
      "food_pairing_notes": "Structured Sangiovese with cherry fruit, floral and savoury notes, lively acidity and firm tannins. Pair with bistecca alla Fiorentina, roast game or wild-boar ragù. Taste before decanting and give it air if the tannins and aromas remain closed."
    },
    "proposed": {
      "drinking_window": "2026–2046",
      "food_pairing_notes": "The Castello Banfi Poggio all'Oro Brunello di Montalcino Riserva 2016 is a powerful Sangiovese that showcases rich cherry and plum flavors, complemented by earthy undertones and firm tannins. Ideal pairings include grilled ribeye steak or roasted game, alongside rich pasta dishes like pappardelle with wild boar ragu. Decant for at least 1 hour to enhance its complexity. Critic initials: RP 95."
    },
    "identity_flag": null
  },
  {
    "cellar_id": "1",
    "id": "1764117502289",
    "bottle": "Chateau Clerc Milon 2020",
    "vintage": 2020,
    "expected": {
      "drinking_window": "2027–2055",
      "peak_year": "2035"
    },
    "proposed": {
      "drinking_window": "2025-2035",
      "peak_year": "2029"
    },
    "identity_flag": null
  },
  {
    "cellar_id": "1",
    "id": "11",
    "bottle": "Château La Nerthe \"Clos de Beauvenir\"",
    "vintage": 2021,
    "expected": {},
    "proposed": {},
    "identity_flag": null
  },
  {
    "cellar_id": "1",
    "id": "1764117687338",
    "bottle": "Chateau La Tour Blanche 2016",
    "vintage": 2016,
    "expected": {
      "food_pairing_notes": "Sweet, botrytised Sauternes with honeyed fruit and balancing acidity. Pair with foie gras, blue cheese, or lightly sweet apricot, peach or citrus desserts. Keep the dessert no sweeter than the wine; very sugary or strongly chocolate-flavoured desserts can overwhelm its fruit."
    },
    "proposed": {
      "food_pairing_notes": "This Sauternes is rich and sweet with notes of honey, apricot, and citrus, making it a perfect match for desserts, foie gras, or blue cheese."
    },
    "identity_flag": null
  },
  {
    "cellar_id": "1",
    "id": "45",
    "bottle": "Château Suduiraut",
    "vintage": 2014,
    "expected": {
      "food_pairing_notes": "Sweet, botrytised Sauternes with honeyed fruit and balancing acidity. Pair with foie gras, blue cheese, or lightly sweet apricot, peach or citrus desserts. Keep the dessert no sweeter than the wine; very sugary or strongly chocolate-flavoured desserts can overwhelm its fruit."
    },
    "proposed": {
      "food_pairing_notes": "This sweet wine typically exhibits rich flavors of honey, apricot, and citrus with balanced acidity. It pairs well with desserts, foie gras, and blue cheese."
    },
    "identity_flag": null
  },
  {
    "cellar_id": "1",
    "id": "1770385391795",
    "bottle": "Clos du Lican",
    "vintage": 2021,
    "expected": {
      "drinking_window": "2029–2035",
      "peak_year": "2032",
      "food_pairing_notes": "Full-bodied Apalta Syrah with berry fruit, floral and peppery notes, abundant tannins and freshness. Pair with braised beef cheeks, roast lamb or venison with herbs and a savoury sauce. Its concentration suits slow-cooked meat; keep glazes and sauces low in sweetness."
    },
    "proposed": {
      "drinking_window": "2025-2035",
      "peak_year": "2028",
      "food_pairing_notes": "\"I've never before smelled a wine like this. The captivating aromas are amazing, with lavender, sage, dried potpourri, blackberries, tar, pepper and black licorice. Full-bodied with super tannins that fan out and caress the palate. It's ethereal and endless. A pure syrah from the owners of Clos Apalta, from unique mountain vineyards. Try to give this four or five years of bottle age. Best after 2028. Score - 100. (jamessuckling.com, Feb. 11, 2024)\""
    },
    "identity_flag": null
  },
  {
    "cellar_id": "1",
    "id": "8",
    "bottle": "Corton \"Le Clos du Roi\" Grand Cru (Domaine d'Ardhuy)",
    "vintage": 2018,
    "expected": {},
    "proposed": {},
    "identity_flag": null
  },
  {
    "cellar_id": "1",
    "id": "7",
    "bottle": "Domaine Huet – Clos du Bourg Moelleux",
    "vintage": 2018,
    "expected": {},
    "proposed": {},
    "identity_flag": null
  },
  {
    "cellar_id": "1",
    "id": "40",
    "bottle": "Domaine Labruyère Champ de Cour Moulin-à-Vent",
    "vintage": 2018,
    "expected": {},
    "proposed": {},
    "identity_flag": null
  },
  {
    "cellar_id": "1",
    "id": "12",
    "bottle": "Famille Perrin Château de Beaucastel Roussanne Vieilles Vignes",
    "vintage": 2021,
    "expected": {
      "drinking_window": "2036–2046",
      "peak_year": "2040",
      "food_pairing_notes": "Rich, dry old-vine Roussanne with ripe stone fruit, honeyed aromas, brioche and a full texture. Pair with butter-poached lobster, scallops in a cream sauce or poultry with morels. The producer recommends drinking this cuvee very young or after about 15 years; the cellar window shown targets its later mature phase."
    },
    "proposed": {
      "drinking_window": "2024–2034",
      "peak_year": "2028",
      "food_pairing_notes": "Complex, oak‑fermented Roussanne; pairs with lobster, scallops or creamy pasta."
    },
    "identity_flag": null
  },
  {
    "cellar_id": "1",
    "id": "27",
    "bottle": "Ferreira Vintage Port",
    "vintage": 2018,
    "expected": {},
    "proposed": {},
    "identity_flag": null
  },
  {
    "cellar_id": "1",
    "id": "6",
    "bottle": "Garage Wine Co. \"Truquilemu Vineyard\" Carignan Field Blend Lot 97",
    "vintage": 2019,
    "expected": {},
    "proposed": {},
    "identity_flag": "Check front/back label: 2018 Lot 97 or 2019 Lot 107? The supplied technical sheet is for Vigno. No fields in this row are changed."
  },
  {
    "cellar_id": "1",
    "id": "1",
    "bottle": "Gran Enemigo – Gualtallary",
    "vintage": 2019,
    "expected": {
      "food_pairing_notes": "Cabernet Franc-led blend (85% Cabernet Franc, 15% Malbec), with herbal and peppery notes, dark fruit and fine, chalky tannins. Pair with grilled beef, roast lamb, savoury mushroom dishes or aged cheeses. Argentine asado is a good match; keep sauces savoury rather than sweet."
    },
    "proposed": {
      "food_pairing_notes": "Structured, mineral Malbec with Cabernet Franc notes; great with grilled red meats and Argentine dishes."
    },
    "identity_flag": null
  },
  {
    "cellar_id": "1",
    "id": "2",
    "bottle": "Lorenzo Lo Sagrado Cabernet Franc",
    "vintage": 2019,
    "expected": {
      "meal_suggestion": "Roast duck with a savoury plum and thyme jus (no added sugar)."
    },
    "proposed": {
      "meal_suggestion": "Roast duck with plum sauce"
    },
    "identity_flag": null
  },
  {
    "cellar_id": "1",
    "id": "1788389989910",
    "bottle": "Luigi Baudana Barolo",
    "vintage": 2021,
    "expected": {},
    "proposed": {},
    "identity_flag": "Confirm whether the label says Serralunga, Baudana or Cerretta. No fields in this row are changed."
  },
  {
    "cellar_id": "1",
    "id": "20",
    "bottle": "Lungarotti Montefalco Sagrantino DOCG",
    "vintage": 2017,
    "expected": {
      "drinking_window": "2025–2035",
      "peak_year": "2029"
    },
    "proposed": {
      "drinking_window": "2027–2047",
      "peak_year": "2032"
    },
    "identity_flag": null
  },
  {
    "cellar_id": "1",
    "id": "1779157110325",
    "bottle": "Michel Guignier Morgon Canon",
    "vintage": 2023,
    "expected": {
      "food_pairing_notes": "Old-vine Morgon Gamay with freshness, spice and more concentration than a simple light Beaujolais. Pair with roast chicken, duck, pork or savoury mushroom dishes. Taste on opening and aerate only if needed; a fixed decanting time is not essential."
    },
    "proposed": {
      "food_pairing_notes": "The 2023 Michel Guignier Morgon Canon showcases bright acidity, soft tannins, and vibrant notes of cherry and raspberry. This profile makes it an excellent match for earthy dishes or light meats, such as roasted chicken with herbs and a side of sautéed mushrooms. Decant for 30 minutes to enhance its aromatic complexity. Critic score: RP 92."
    },
    "identity_flag": null
  },
  {
    "cellar_id": "1",
    "id": "678c0dfe-4b3d-4fb8-80ce-19722210ea93",
    "bottle": "Pian Cornello Rosso di Montalcino 2022",
    "vintage": 2022,
    "expected": {
      "food_pairing_notes": "Sangiovese with fresh red fruit, herbs and a firm tannic edge. Pair with tomato-based meat ragù, roast pork, veal or grilled lamb. Keep sauces savoury; the acidity works well with tomato and the tannins with meat and olive oil.",
      "meal_suggestion": "Rosemary-and-garlic grilled lamb chops with roasted vegetables and a savoury pan jus."
    },
    "proposed": {
      "food_pairing_notes": "This wine likely has bright acidity and moderate tannins, making it versatile for food pairings. It should complement rich dishes like pasta with tomato sauce, grilled meats, or aged cheeses.",
      "meal_suggestion": "Grilled lamb chops marinated in rosemary and garlic, served with roasted root vegetables and a balsamic reduction."
    },
    "identity_flag": null
  },
  {
    "cellar_id": "1",
    "id": "39",
    "bottle": "Primeira Estrada Gran Reserva Syrah Colheita de Inverno",
    "vintage": 2021,
    "expected": {},
    "proposed": {},
    "identity_flag": null
  },
  {
    "cellar_id": "1",
    "id": "28",
    "bottle": "Quinta da Manoella Vinhas Velhas",
    "vintage": 2019,
    "expected": {},
    "proposed": {},
    "identity_flag": null
  },
  {
    "cellar_id": "1",
    "id": "5",
    "bottle": "Santa Rita \"Casa Real\" Cabernet Sauvignon Reserva Especial",
    "vintage": 2018,
    "expected": {},
    "proposed": {},
    "identity_flag": null
  },
  {
    "cellar_id": "1",
    "id": "1764117575388",
    "bottle": "The Standish Wine Company The Schubert Theorem 2022",
    "vintage": 2022,
    "expected": {
      "drinking_window": "2024–2052",
      "peak_year": "2036",
      "food_pairing_notes": "Concentrated Barossa Shiraz with dark fruit and substantial, fine chalky tannins. Pair with roast lamb, braised beef, venison or a savoury mushroom-and-meat dish. Avoid very sweet glazes and fierce chilli; the wine has both concentration and considerable alcohol."
    },
    "proposed": {
      "drinking_window": "2024-2032",
      "peak_year": "2028",
      "food_pairing_notes": "This wine likely has rich fruit flavors and moderate tannins, making it suitable for pairing with hearty dishes. Ideal pairings include grilled meats or rich pasta dishes."
    },
    "identity_flag": null
  },
  {
    "cellar_id": "1",
    "id": "30",
    "bottle": "Torre Muga Rioja",
    "vintage": 2019,
    "expected": {},
    "proposed": {},
    "identity_flag": null
  },
  {
    "cellar_id": "1",
    "id": "34",
    "bottle": "Vi de Vila Gratallops",
    "vintage": 2022,
    "expected": {},
    "proposed": {},
    "identity_flag": "Confirm the producer on the label, especially whether it is Álvaro Palacios. No fields in this row are changed."
  },
  {
    "cellar_id": "1",
    "id": "22",
    "bottle": "Volpaia Coltassala",
    "vintage": 2019,
    "expected": {
      "food_pairing_notes": "Sangiovese-led Chianti Classico Gran Selezione with red fruit, floral notes, lively acidity and a firm tannic structure. Pair with Tuscan meat ragù, wild-boar pappardelle, roast lamb or aged Pecorino. Taste after opening and aerate if the wine remains closed."
    },
    "proposed": {
      "food_pairing_notes": "Volpaia Coltassala 2019 is a refined Gran Selezione Chianti that showcases the vibrant acidity and ripe red fruit profile typical of Sangiovese, complemented by the floral notes of Mammolo. This wine pairs beautifully with hearty Tuscan dishes, such as a rich Tuscan ragù or a succulent roast lamb with rosemary. For optimal enjoyment, decant for 1-2 hours to allow the flavors to open up. Critic: RP 93."
    },
    "identity_flag": null
  }
]
$review_data$::jsonb) as r(
  cellar_id text, id text, bottle text, vintage integer,
  expected jsonb, proposed jsonb, identity_flag text
);

-- Lock the known records before comparing values so concurrent edits cannot be lost.
do $lock_rows$
begin
  perform w.id from public.wines w
  join flint_wine_review r on r.cellar_id = w.cellar_id and r.id = w.id
  order by w.cellar_id, w.id for update of w;
end
$lock_rows$;

create temporary table flint_wine_review_plan on commit drop as
select r.*, to_jsonb(w) as current_row,
  case
    when w.id is null then 'skipped: record missing'
    when w.status <> 'in_cellar' or w.quantity <= 0 then 'skipped: no longer in stock'
    when (w.bottle, w.vintage) is distinct from (r.bottle, r.vintage) then 'conflict: identity changed'
    when r.identity_flag is not null then 'unchanged: confirm bottle label'
    when r.proposed = '{}'::jsonb then 'unchanged: reviewed'
    when exists (
      select 1 from jsonb_each(r.proposed) f
      where (to_jsonb(w) -> f.key) is distinct from (r.expected -> f.key)
        and (to_jsonb(w) -> f.key) is distinct from f.value
    ) then 'conflict: recommendation edited'
    when not exists (
      select 1 from jsonb_each(r.proposed) f
      where (to_jsonb(w) -> f.key) is distinct from f.value
    ) then 'unchanged: already matches'
    else 'ready'
  end as outcome
from flint_wine_review r
left join public.wines w on w.cellar_id = r.cellar_id and w.id = r.id;

do $guard$
declare conflicts text;
begin
  select string_agg(id || ' (' || bottle || '): ' || outcome, '; ' order by id)
  into conflicts from flint_wine_review_plan where outcome like 'conflict:%';
  if conflicts is not null then
    raise exception 'Review stopped; no changes committed. Re-export these records for review: %', conflicts;
  end if;
end
$guard$;

create temporary table flint_wine_review_changed on commit drop as
with changed as (
  update public.wines w set
    drinking_window = case when p.proposed ? 'drinking_window' then p.proposed ->> 'drinking_window' else w.drinking_window end,
    peak_year = case when p.proposed ? 'peak_year' then p.proposed ->> 'peak_year' else w.peak_year end,
    food_pairing_notes = case when p.proposed ? 'food_pairing_notes' then p.proposed ->> 'food_pairing_notes' else w.food_pairing_notes end,
    meal_suggestion = case when p.proposed ? 'meal_suggestion' then p.proposed ->> 'meal_suggestion' else w.meal_suggestion end
  from flint_wine_review_plan p
  where p.outcome = 'ready' and w.cellar_id = p.cellar_id and w.id = p.id
    and w.status = 'in_cellar' and w.quantity > 0
  returning w.cellar_id, w.id
)
select * from changed;

-- Final result includes every reviewed wine and any newly added, unreviewed wine.
select p.id, p.bottle, p.vintage,
  case when c.id is not null then 'restored' else p.outcome end as result,
  case when p.proposed <> '{}'::jsonb then p.expected else null end as expected_before,
  case when p.proposed <> '{}'::jsonb then p.proposed else null end as proposed_after,
  p.identity_flag as attention,
  (select count(*) from flint_wine_review_changed) as total_rows_changed
from flint_wine_review_plan p
left join flint_wine_review_changed c using (cellar_id, id)
union all
select w.id, w.bottle, w.vintage, 'unreviewed: added since export', null::jsonb, null::jsonb,
  'This wine needs a separate review.', (select count(*) from flint_wine_review_changed)
from public.wines w
where w.cellar_id = '1' and w.status = 'in_cellar' and w.quantity > 0
  and not exists (select 1 from flint_wine_review r where r.cellar_id = w.cellar_id and r.id = w.id)
order by bottle, vintage;

commit;
