# Flint cellar wine review — 17 September 2026

Reviewed all **29 wine records / 29 bottles** in the Supabase export supplied by you, restricted to cellar **1** and positive stock. The export supersedes the old repository inventory. All exported bottles have Coravin set to false.

**Result: 16 records have proposed changes; 13 are left unchanged, including three needing label confirmation.** 7 drinking windows and 6 peak targets change. Most meals were already suitable.

## How to interpret the review

- **Windows are estimates, not expiry dates.** They assume a sound, unopened bottle, roughly 750 ml, consistently cool storage, and no heat damage. The export does not establish bottle size, provenance, temperature history or condition.
- **No exact peak year was independently established.** Existing and proposed peaks are planning targets. They reflect an enjoyment stage rather than a measurable date. New mature-style targets are explicitly identified as estimates below; a wine may also be enjoyable young.
- **Sources disagree.** Where an existing range remains defensible, it is generally retained. “Retain provisionally” means there was insufficient evidence for a correction, not that every date was verified.
- **Pairings are culinary judgments.** Producer and vintage-specific descriptions establish the wine's profile; the dish matching is my reasoned inference unless a producer explicitly recommends it. Sweet sauces can make a dry wine seem less fruity and more bitter; salt and fat often soften the impression of tannin. These principles explain the two meal refinements. [WSET: pairing essentials](https://www.wsetglobal.com/knowledge-centre/blog/2023/july/13/four-rules-to-masterful-food-and-wine-pairing), [WSET: sweetness and wine](https://www.wsetglobal.com/knowledge-centre/blog/2020/december/21/winter-wine-and-food-matching).
- **Only four fields are changed.** Quantities, locations, wine identities, grapes, technical-sheet URLs, personal comments, scores and journals are preserved. Related metadata issues are called out below. The database's normal updated_at trigger still records the update.

## Apply the changes

1. Open [20260917-wine-audit.sql](20260917-wine-audit.sql), copy its entire contents into **Supabase → SQL Editor → New query**, and run it in your Flint project.
2. Check the result column. With the unchanged export, expect **16 updated records**. Missing or no-longer-stocked wines are skipped; the three identity questions are reported without edits. New wines are reported as unreviewed.
3. Refresh Flint. No app deployment or environment-variable change is needed.

The script includes both factual corrections and the planning/culinary refinements explained here. It checks the current bottle identity and each field it intends to change. A conflicting manual edit aborts the whole transaction rather than overwriting it. Unrelated fields can have changed safely. Rerunning produces no duplicate changes. If Supabase reports a conflict, re-export those rows instead of removing the guard. If a transaction remains open after an error, run ROLLBACK before trying again.

The paired [rollback script](20260917-wine-audit.rollback.sql) restores only the modified recommendation fields on matching, still-in-stock records. It also refuses to overwrite later conflicting edits. It does not restore old timestamps or modify journal records. The [audit JSON](20260917-wine-audit.json) preserves the supplied export and research decisions.

## Changes to drinking windows

| Wine | Previous window | Proposed window | Peak target |
| --- | --- | --- | --- |
| Casa Ferreirinha Quinta da Leda 2021 (2021) | 2023-2030 | 2025–2041 | 2025 → 2031 |
| Castello Banfi Poggio all'Oro Brunello di Montalcino Riserva (2016) | 2026–2046 | 2025–2043 | 2032 retained |
| Chateau Clerc Milon 2020 (2020) | 2025-2035 | 2027–2055 | 2029 → 2035 |
| Clos du Lican (2021) | 2025-2035 | 2029–2035 | 2028 → 2032 |
| Famille Perrin Château de Beaucastel Roussanne Vieilles Vignes (2021) | 2024–2034 | 2036–2046 | 2028 → 2040 |
| Lungarotti Montefalco Sagrantino DOCG (2017) | 2027–2047 | 2025–2035 | 2032 → 2029 |
| The Standish Wine Company The Schubert Theorem 2022 (2022) | 2024-2032 | 2024–2052 | 2028 → 2036 |

The detailed entries below identify the evidence and uncertainty for every change. In particular, the new **Lungarotti endpoint**, **Beaucastel later-phase endpoint**, and all new peak targets are estimates; they must not be presented as critic quotations.

## Bottle identities to confirm

- **Garage Wine Co. "Truquilemu Vineyard" Carignan Field Blend Lot 97 (2019), ID 6:** Check front/back label: 2018 Lot 97 or 2019 Lot 107? The supplied technical sheet is for Vigno. No fields in this row are changed.
- **Luigi Baudana Barolo (2021), ID 1788389989910:** Confirm whether the label says Serralunga, Baudana or Cerretta. No fields in this row are changed.
- **Vi de Vila Gratallops (2022), ID 34:** Confirm the producer on the label, especially whether it is Álvaro Palacios. No fields in this row are changed.

These checks do not prevent the other verified identities from receiving their proposed corrections.

## Wine-by-wine findings

### 1. Arzuaga Reserva Especial — 2019

ID: 31. **Changes proposed.**

**Drinking window — retain 2027–2042.** Retain 2027–2042 provisionally. The producer describes a rich wine aged 29 months in oak and suitable for service on release, but provides no end date. Neither a mandatory wait until 2027 nor longevity to 2042 is independently established; 2042 is an optimistic planning limit.

**Peak year (estimated) — retain 2031.** Retain 2031 as a plausible mature-style target, not a published or verified peak.

**Food pairing notes — revise.** The meat pairings are sound. Replace the incomplete blend description (the producer also lists Albillo Mayor), remove the unverified RP 94 attribution, and replace a compulsory one-hour decant with tasting-led aeration.

Proposed text: Tempranillo-led Ribera del Duero with dark fruit, spice and substantial oak aging. Its richness suits roast lamb, beef in a savoury sauce, game or roast pork. Taste after opening and allow air if the wine seems closed; serve around 16-18 C.

**Suggested meal — retain.** Keep the ribeye meal. Beef and fat suit the structure; use a savoury, mildly vinegared chimichurri. Asparagus as a side does not invalidate the whole pairing.

Retained meal: Grilled ribeye steak with chimichurri sauce, served with roasted asparagus and garlic mashed potatoes.

Sources: [Arzuaga producer: Reserva Especial 2019 technical sheet](https://arzuaganavarro.com/images/ARZUAGA/Fichas-PDF/Reserva_especial/Reserva_Especial_19.pdf).

### 2. Casa Ferreirinha Castas Escondidas Douro — 2019

ID: 24. **Changes proposed.**

**Drinking window — retain 2024–2034.** Retain 2024–2034 as a reasonable planning window. Wine Enthusiast prefers a start in 2025, a small difference that does not justify recasting the entire window; 2034 remains an estimate.

**Peak year (estimated) — retain 2028.** Retain 2028 as an estimated target within that window.

**Food pairing notes — revise.** Correct the misleading emphasis on Touriga Franca/Tinta Barroca: the importer lists an old-vine field blend plus Tinto Cão, Tinta Amarela, Touriga Fêmea, Tinta Francisca and other lesser-known varieties. The wine is fresher than the generic full-bodied description suggests. Remove the unverified RP 94 and fixed decanting requirement.

Proposed text: A fresh, structured Douro blend of lesser-known varieties and old-vine fruit, with red and black fruit and peppery spice. Pair with roast lamb, beef, game or a savoury stew; avoid very sweet barbecue glazes. Taste after opening and aerate if needed.

**Suggested meal — retain.** Keep rosemary lamb chops, potatoes and red-wine sauce: the savoury meat and sauce fit the fruit, freshness and tannins.

Retained meal: Grilled lamb chops with rosemary, served with garlic mashed potatoes and a red wine reduction sauce.

Sources: [Liberty Wines: Castas Escondidas 2019 technical sheet](https://media.libertywine.co.uk/Perfion/FactSheet.Report?id=173293); [Wine Enthusiast: Castas Escondidas 2019](https://www.wineenthusiast.com/buying-guide/casa-ferreirinha-2019-castas-escondidas-red-douro/).

### 3. Casa Ferreirinha Quinta da Leda — 2018

ID: 25. **No changes proposed.**

**Drinking window — retain 2024–2034.** Retain 2024–2034. The producer says the 2018 benefits from four to six years in bottle after its 2021 bottling and remains at its best for years; a merchant reproduces a Wine Spectator horizon to 2038. The existing end date is conservative, not demonstrably wrong.

**Peak year (estimated) — retain 2027.** Retain 2027: it falls within the producer’s suggested bottle-development period, although the producer does not nominate one peak year.

**Food pairing notes — retain.** Keep the description and meat pairings. The producer confirms acidity, tannins, fruit and spice. The separate grapes field does contain an error: its 2018 blend has Tinto Cão, not the listed Tinta Barroca; that field is outside this four-field script.

**Suggested meal — retain.** Keep Portuguese cozido. Its meat, sausage, salt and fat can suit this wine; roast kid would be an alternative, not a necessary correction.

Retained meal: Portuguese cozido

Sources: [Sogrape producer sheet: Quinta da Leda 2018](https://vinhosdeportugal.oglobo.com.br/wp-content/uploads/2022/04/QUINTA-DA-LEDA-2018.pdf); [Millesima: Quinta da Leda 2018 critic reviews](https://www.millesima.pt/casa-ferreirinha-quinta-da-leda-2018.html).

### 4. Casa Ferreirinha Quinta da Leda 2021 — 2021

ID: 2c2ebb2e-413f-4157-b432-dfa0553f00c6. **Changes proposed.**

**Drinking window — 2023-2030 → 2025–2041.** Replace 2023–2030 with 2025–2041. The producer sheet dates bottling to June 2024, so 2023 is too early for this bottled wine. It recommends starting about three to four years after harvest. The longer endpoint uses the approximately 20-year potential stated on the 2021 merchant listing; it is an estimate, not a producer-certified expiry date.

**Peak year (estimated) — 2025 → 2031.** Move 2025 → 2031. The 2021 merchant listing describes an estimated peak at about ten years of age. This fits the producer’s substantial structure and bottle-development potential; 2025 need not mean the wine has already peaked.

**Food pairing notes — revise.** Replace the speculative “likely” description with the producer-supported fruit, pepper, cedar, acidity and tannin profile. The basic pairings were already appropriate.

Proposed text: Structured Douro red with red and black fruit, pepper and cedar, supported by substantial tannins and fresh acidity. Pair with roast or grilled lamb, beef, game and aged cheeses. Rosemary lamb chops and a savoury red-wine sauce are a good match.

**Suggested meal — retain.** Keep lamb, ratatouille and red-wine sauce; their savoury flavours work with the wine’s fruit and structure.

Retained meal: Grilled lamb chops with rosemary, served with a side of ratatouille and a red wine reduction sauce.

Sources: [Sogrape producer sheet: Quinta da Leda 2021](https://vinhosdeportugal.com.br/wp-content/uploads/2025/04/Quinta-da-Leda-2021_PT.pdf); [Codibebe: 2021 aging guidance](https://www.codibebe.pt/index.php/pt/component/jshopping/product/view/72/269).

### 5. Castello Banfi Poggio all'Oro Brunello di Montalcino Riserva — 2016

ID: 21. **Changes proposed.**

**Drinking window — 2026–2046 → 2025–2043.** Replace 2026–2046 with the exact 2025–2043 Wine Spectator window reproduced by Banfi. This is a sourced planning update, not evidence that the wine fails in 2044.

**Peak year (estimated) — retain 2032.** Keep 2032 as an estimated target within that window; no source establishes a unique peak.

**Food pairing notes — revise.** The Sangiovese and meat pairings are right. Banfi lists Wine Advocate 96+ for this vintage, not the stored RP 95. Remove the score from a food field and make aeration conditional rather than mandatory.

Proposed text: Structured Sangiovese with cherry fruit, floral and savoury notes, lively acidity and firm tannins. Pair with bistecca alla Fiorentina, roast game or wild-boar ragù. Taste before decanting and give it air if the tannins and aromas remain closed.

**Suggested meal — retain.** Keep bistecca alla Fiorentina: salt, fat and savoury beef balance the tannin and acidity.

Retained meal: Bistecca alla Fiorentina

Sources: [Banfi: 2016 vintage and awards](https://www.banfi.it/poggio-all-oro/); [Banfi USA: exact 2016 Poggio all’Oro reviews (Wine Spectator, May 2, 2022)](https://banfiusa.com/reviews/).

### 6. Chateau Clerc Milon 2020 — 2020

ID: 1764117502289. **Changes proposed.**

**Drinking window — 2025-2035 → 2027–2055.** Extend 2025–2035 to 2027–2055 using William Kelley’s Wine Advocate window. The original actually matches Antonio Galloni’s shorter window, so it is not fabricated; the extension better represents the wine’s long aging potential. Jeb Dunnuck independently suggests 2030–2055 for mature drinking.

**Peak year (estimated) — 2029 → 2035.** Move 2029 → 2035 as an estimated mature-style target, allowing time beyond the suggested 2030 start for fuller development. Earlier enjoyment remains possible.

**Food pairing notes — retain.** Keep the dark-fruit, firm-tannin description and hearty-meat pairings; the reviewers support that structure.

**Suggested meal — retain.** Keep braised beef short ribs and mashed potatoes. Their richness and savoury sauce suit the tannin.

Retained meal: Braised beef short ribs with a red wine reduction, served with creamy mashed potatoes and sautéed green beans.

Sources: [Appellations: Kelley and Galloni reviews of Clerc Milon 2020](https://appellations.co.uk/product/10082122020-2020-clerc-milon); [Laguna Cellar: Dunnuck review of Clerc Milon 2020](https://www.lagunacellar.com/chateau-clerc-milon-2020).

### 7. Château La Nerthe "Clos de Beauvenir" — 2021

ID: 11. **No changes proposed.**

**Drinking window — retain 2024–2032.** Retain 2024–2032 as a conservative window. Berry Bros. & Rudd suggests 2023–2032, while Decanter gives 2024–2038. That spread is a reason to avoid pretending the endpoint is exact, not to force a longer hold.

**Peak year (estimated) — retain 2026.** Keep 2026 as a youthful enjoyment target. Later complexity is possible; there is no proven single peak.

**Food pairing notes — retain.** Keep: Kobrand confirms a Roussanne-led blend with peach, citrus, integrated oak and cellaring ability. Rich fish, poultry and truffle are reasonable matching inferences.

**Suggested meal — retain.** Keep roast chicken with truffle butter: the texture and savoury richness fit the wine.

Retained meal: Roast chicken with truffle butter

Sources: [Kobrand: Clos de Beauvenir 2021](https://www.kobrandwineandspirits.com/release/chateau-la-nerthe-clos-de-beauvenir-chateauneuf-du-pape-blanc-2021/); [Berry Bros. & Rudd: 2021 window](https://www.bbr.com/products-20218028974-2021-chateauneuf-du-pape-blanc-clos-de-beauvenir-chateau-la-nerthe-rhone); [Decanter: Southern Rhône 2021 table](https://www.decanter.com/southern-rhone-2021-score-table/).

### 8. Chateau La Tour Blanche 2016 — 2016

ID: 1764117687338. **Changes proposed.**

**Drinking window — retain 2023-2040.** Keep the existing window: published reviews support drinking into roughly 2040, with meaningful disagreement over the ideal starting year and longer horizons. No substantial correction is warranted.

**Peak year (estimated) — retain 2028.** Keep the existing peak year as an estimated point for developed fruit and honeyed complexity, not a uniquely verified peak.

**Food pairing notes — revise.** Foie gras and blue cheese are sound. Qualify the blanket “desserts” recommendation: sweetness level matters, and fruit-based desserts are a more reliable match than arbitrary sweets.

Proposed text: Sweet, botrytised Sauternes with honeyed fruit and balancing acidity. Pair with foie gras, blue cheese, or lightly sweet apricot, peach or citrus desserts. Keep the dessert no sweeter than the wine; very sugary or strongly chocolate-flavoured desserts can overwhelm its fruit.

**Suggested meal — retain.** Keep foie gras with fig compote and brioche. Use a modest amount of compote so it does not dominate the wine.

Retained meal: Seared foie gras with a fig compote and toasted brioche.

Sources: [Farr Vintners: La Tour Blanche 2016 dated critic reviews](https://www.farrvintners.com/wine.php?wine=46059).

### 9. Château Suduiraut — 2014

ID: 45. **Changes proposed.**

**Drinking window — retain 2025-2040.** Keep the existing window: published reviews support drinking into roughly 2040, with meaningful disagreement over the ideal starting year and longer horizons. No substantial correction is warranted.

**Peak year (estimated) — retain 2030.** Keep the existing peak year as an estimated point for developed fruit and honeyed complexity, not a uniquely verified peak.

**Food pairing notes — revise.** Foie gras and blue cheese are sound. Qualify the blanket “desserts” recommendation: sweetness level matters, and fruit-based desserts are a more reliable match than arbitrary sweets.

Proposed text: Sweet, botrytised Sauternes with honeyed fruit and balancing acidity. Pair with foie gras, blue cheese, or lightly sweet apricot, peach or citrus desserts. Keep the dessert no sweeter than the wine; very sugary or strongly chocolate-flavoured desserts can overwhelm its fruit.

**Suggested meal — retain.** Keep foie gras with fig compote and brioche. Use a modest amount of compote so it does not dominate the wine.

Retained meal: Foie gras torchon with a fig compote and toasted brioche

Sources: [Farr Vintners: Suduiraut 2014 dated critic reviews](https://www.farrvintners.com/wine.php?wine=40446).

### 10. Clos du Lican — 2021

ID: 1770385391795. **Changes proposed.**

**Drinking window — 2025-2035 → 2029–2035.** Move the start from 2025 to 2029 to follow the stored James Suckling recommendation of best after 2028; keep 2035 as a provisional endpoint. Wine Spectator instead prefers 2025–2030, so this is a mature-style choice, not consensus or proof of guaranteed longevity.

**Peak year (estimated) — 2028 → 2032.** Move 2028 → 2032 as an estimated target after the recommended waiting period. The previous peak contradicted its own “best after 2028” note.

**Food pairing notes — revise.** Replace the long critic quotation with actual pairing guidance based on the producer’s berry, spice, fresh and tannic profile.

Proposed text: Full-bodied Apalta Syrah with berry fruit, floral and peppery notes, abundant tannins and freshness. Pair with braised beef cheeks, roast lamb or venison with herbs and a savoury sauce. Its concentration suits slow-cooked meat; keep glazes and sauces low in sweetness.

**Suggested meal — retain.** Keep braised beef cheeks, polenta and greens; the slow-cooked richness fits the substantial tannins.

Retained meal: Braised beef cheeks with a red wine reduction, served alongside creamy polenta and sautéed seasonal greens.

Sources: [Clos du Lican: producer technical sheet 2021](https://www.closdulican.com/wp-content/uploads/2025/01/ClosduLican_FT_2021_EN.pdf); [JJ Buckley: dated 2021 Suckling and Wine Spectator reviews](https://www.jjbuckley.com/wine/2021-clos-du-lican-syrah/2021-290413-750/).

### 11. Corton "Le Clos du Roi" Grand Cru (Domaine d'Ardhuy) — 2018

ID: 8. **No changes proposed.**

**Drinking window — retain 2025–2040.** Retain 2025–2040 provisionally. The producer confirms an ageworthy, structured Grand Cru Pinot Noir, but I did not establish an exact 2018 drinking window. Do not interpret the unchanged end date as verified.

**Peak year (estimated) — retain 2030.** Keep 2030 as a plausible estimate for developing savoury complexity; no exact peak is published in the source used.

**Food pairing notes — retain.** Keep duck, beef and mushrooms. The producer explicitly recommends braised meat, game in sauce and morel polenta.

**Suggested meal — retain.** Keep beef Bourguignon, a direct fit for the producer’s braised-meat recommendation.

Retained meal: Beef Bourguignon

Sources: [Domaine d’Ardhuy: cuvée technical sheet (not vintage-specific)](https://www.ardhuy.com/en/wines/corton-grand-cru-le-clos-du-roi?format=pdf).

### 12. Domaine Huet – Clos du Bourg Moelleux — 2018

ID: 7. **No changes proposed.**

**Drinking window — retain 2022–2040+.** Retain 2022–2040+. Lay & Wheeler suggests 2022–2036 for the regular Moelleux, while a Wine Advocate review reproduced by Comptoir des Millésimes gives 2020–2065. The existing open-ended window is plausible, but the upper horizon is uncertain. No Première Trie review was substituted.

**Peak year (estimated) — retain 2030.** Keep 2030 as an estimated target for some bottle development; this sweet Chenin can offer several enjoyable stages rather than one peak.

**Food pairing notes — retain.** Keep foie gras and blue cheese. The sweetness and acidity also suit moderately spicy Asian food; very hot chilli can still dominate.

**Suggested meal — retain.** Keep foie gras terrine, a coherent richness-and-acidity pairing.

Retained meal: Foie gras terrine

Sources: [Lay & Wheeler: regular Clos du Bourg Moelleux 2018](https://www.laywheeler.com/product-detail?id=1118012A); [Comptoir des Millésimes: regular Moelleux 2018 / Wine Advocate](https://www.comptoirdesmillesimes.com/clos-du-bourg-huet/clos-du-bourg-2018-moelleux-domaine-huet.html).

### 13. Domaine Labruyère Champ de Cour Moulin-à-Vent — 2018

ID: 40. **No changes proposed.**

**Drinking window — retain 2021–2035.** Retain 2021–2035 provisionally. The 2021 Revue du vin de France tasting says the 2018 Champ de Cour can be drunk for at least ten years. That supports longevity into the early 2030s; 2035 is a plausible extension, not a specifically verified end date.

**Peak year (estimated) — retain 2027.** Keep 2027 as an estimated mature-Gamay target.

**Food pairing notes — retain.** Keep the game, beef, poultry and veal pairings. Both the critic and estate tasting describe enough depth and tannin for savoury meat dishes.

**Suggested meal — retain.** Keep coq au vin: poultry, mushrooms and a savoury wine sauce are well matched to structured Gamay.

Retained meal: Coq au vin

Sources: [La Revue du vin de France: Champ de Cour 2018 comparative tasting](https://www.larvf.com/moulin-a-vent-des-terroirs-du-beaujolais-de-grande-classe,4773400.asp); [Burgundy-Report: Labruyère 2018 estate tasting](https://www.burgundy-report.com/burgundy-report-extra/02-2020/labruyere-2018/).

### 14. Famille Perrin Château de Beaucastel Roussanne Vieilles Vignes — 2021

ID: 12. **Changes proposed.**

**Drinking window — 2024–2034 → 2036–2046.** Replace 2024–2034 with a later-phase planning window of 2036–2046. The exact-vintage producer sheet recommends drinking within three years or after 15; for 2021 that points to a young phase around 2022–2024 and a later phase from about 2036. Critics/merchants sometimes recommend a continuous window (Berry Bros. & Rudd: 2026–2041). I favour the producer’s distinctive guidance here. The 2046 endpoint is an estimate, not supplied by the producer.

**Peak year (estimated) — 2028 → 2040.** Move 2028 → 2040 as an estimated target in that later phase. This is a chosen mature-style target, not evidence that every bottle is closed in 2028.

**Food pairing notes — revise.** Keep the rich-seafood logic, clarify that honeyed aromas do not mean a sweet wine, and include the unusual aging guidance. Avoid a precise oak percentage because the producer sheet’s summary and reproduced critic accounts differ.

Proposed text: Rich, dry old-vine Roussanne with ripe stone fruit, honeyed aromas, brioche and a full texture. Pair with butter-poached lobster, scallops in a cream sauce or poultry with morels. The producer recommends drinking this cuvee very young or after about 15 years; the cellar window shown targets its later mature phase.

**Suggested meal — retain.** Keep butter-poached lobster; the dish matches the dry wine’s full texture and richness.

Retained meal: Butter‑poached lobster

Sources: [Famille Perrin: exact 2021 producer sheet](https://m.familleperrin.com/GA15FE/get/print); [Berry Bros. & Rudd: 2021 alternative window](https://www.bbr.com/products-20211314885-2021-chateauneuf-du-pape-roussanne-vieilles-vignes-chateau-de-beaucastel-rhone).

### 15. Ferreira Vintage Port — 2018

ID: 27. **No changes proposed.**

**Drinking window — retain 2030–2075.** Keep 2030–2075 as a long-term potential window. Wine Enthusiast explicitly says from 2030 and the producer/importer describes very long cellaring. The far endpoint 2075 is unverified and depends heavily on bottle size and storage; it is not a deadline or guarantee.

**Peak year (estimated) — retain 2045.** Keep 2045 as a plausible mature-port target, not an exact peak. There can be several decades of enjoyable development.

**Food pairing notes — retain.** Keep blue cheese, dark chocolate and dried fruit; the importer explicitly recommends strong blue cheese and chocolate/berry desserts.

**Suggested meal — retain.** Keep Stilton and fig tart, keeping pastry sweetness moderate. This is a cheese/dessert course, which is appropriate for Vintage Port.

Retained meal: Stilton cheese & fig tart

Sources: [Wine Enthusiast: Ferreira Vintage Port 2018](https://www.wineenthusiast.com/buying-guide/ferreira-2018-vintage-port/); [Evaton: Ferreira Vintage Port](https://evaton.com/product/vintage/).

### 16. Garage Wine Co. "Truquilemu Vineyard" Carignan Field Blend Lot 97 — 2019

ID: 6. **Identity unresolved — no changes.**

**Drinking window — retain 2024–2034.** Do not change the dates until the bottle identity is resolved. The producer maps Lot 97 to 2018 and Lot 107 to 2019; the export combines Lot 97 with 2019. The linked Vigno sheet also names another cuvée.

**Peak year (estimated) — retain 2028.** 2028 is not verified; retain it only as existing data pending the label check.

**Food pairing notes — retain.** The Carignan/game/stew pairing is broadly sensible for either candidate, but the exact cuvée’s profile cannot be certified from this conflicting record.

**Suggested meal — retain.** Venison stew is a reasonable provisional pairing; do not change it to disguise the identity problem.

Retained meal: Slow‑cooked venison stew

Sources: [Garage Wine Co: vintage-to-lot mapping](https://garagewine.company/wines/truquilemu/).

### 17. Gran Enemigo – Gualtallary — 2019

ID: 1. **Changes proposed.**

**Drinking window — retain 2023–2035.** Keep 2023–2035: it matches the Wine Advocate drinking window reproduced in Dunell’s 2023 offer.

**Peak year (estimated) — retain 2029.** Keep 2029 as an estimated target within the published window, not a critic-certified peak.

**Food pairing notes — revise.** Correct the Malbec-led description. The exact-vintage importer sheet confirms 85% Cabernet Franc and 15% Malbec and explicitly recommends grilled meat and cheeses.

Proposed text: Cabernet Franc-led blend (85% Cabernet Franc, 15% Malbec), with herbal and peppery notes, dark fruit and fine, chalky tannins. Pair with grilled beef, roast lamb, savoury mushroom dishes or aged cheeses. Argentine asado is a good match; keep sauces savoury rather than sweet.

**Suggested meal — retain.** Keep Argentine asado with steak and chorizo. The fat, salt and char suit the wine’s tannins and herbal profile.

Retained meal: Argentine asado (steak, chorizo)

Sources: [Winebow: Gran Enemigo Gualtallary 2019 sheet](https://winebow-files.s3.amazonaws.com/public/vintage/techsheets/606119_El-Enemigo_Gran-Enemigo-Gualtallary_2019.pdf?VersionId=vzUjKD.W.qAA0w8dHPfjjufYCMo0gUf9); [Dunell’s: 2019 Wine Advocate window](https://www.dunells.com/media/ie2lwu3l/pre-release-wines-full-list-30-05-23.pdf).

### 18. Lorenzo Lo Sagrado Cabernet Franc — 2019

ID: 2. **Changes proposed.**

**Drinking window — retain 2024–2032.** Keep 2024–2032 provisionally. The producer confirms fresh acidity and oak aging but gives no precise 2019 endpoint. There is insufficient evidence to replace one speculative window with another.

**Peak year (estimated) — retain 2027.** Keep 2027 as a plausible estimate; it is not independently verified.

**Food pairing notes — retain.** Keep the red-fruit, herb and pepper description and poultry/pork/lamb pairings; these agree with the producer’s Cabernet Franc profile.

**Suggested meal — revise.** Refine the plum sauce to a savoury jus. A sweet plum sauce could make dry Cabernet Franc taste harsher; duck itself is a sound choice. This is a culinary refinement, not a claim the original meal always fails.

Proposed text: Roast duck with a savoury plum and thyme jus (no added sugar).

Sources: [Lorenzo: Lo Sagrado Cabernet Franc](https://lorenzowines.com.ar/producto/lorenzo/lorenzo-cabernet-franc/); [Lorenzo: exact 2019 cuvée discussed](https://lorenzowines.com.ar/lorenzo-de-agrelo-un-homenaje-a-la-amistad/).

### 19. Luigi Baudana Barolo — 2021

ID: 1788389989910. **Identity unresolved — no changes.**

**Drinking window — retain 2028-2040.** Hold the current 2028–2040 pending the cuvée name. Luigi Baudana makes Serralunga, Baudana and Cerretta Barolos; the 2021 Baudana cru has a much longer published window than the more approachable Serralunga blend. Producer name alone is not enough to select one.

**Peak year (estimated) — retain 2035.** 2035 is a plausible general Nebbiolo target but cannot be verified for the unspecified cuvée.

**Food pairing notes — retain.** Keep the high-acid, tannic Nebbiolo description and rich-food pairing as style-based guidance.

**Suggested meal — retain.** Keep braised lamb and polenta, which provide salt and fat for the tannins.

Retained meal: Braised lamb shanks with rosemary and garlic, served with creamy polenta and sautéed seasonal vegetables.

Sources: [Beaune Imports: 2021 Serralunga bottling](https://www.beauneimports.com/product/2021-barolo-serralunga-docg/); [Berry Bros. & Rudd: 2021 Baudana cru](https://www.bbr.com/products-20218170181-2021-barolo-baudana-luigi-baudana-piedmont-italy).

### 20. Lungarotti Montefalco Sagrantino DOCG — 2017

ID: 20. **Changes proposed.**

**Drinking window — 2027–2047 → 2025–2035.** Replace 2027–2047 with a conservative estimated 2025–2035 window. Wine Enthusiast says after 2024; the producer’s vintage report describes hot, concentrated 2017 fruit. I found no evidence for treating this specific bottling as a guaranteed 30-year wine. The new 2035 endpoint is my planning estimate, not a published critic date.

**Peak year (estimated) — 2032 → 2029.** Move 2032 → 2029 as a conservative estimated target to enjoy mature tannins while retaining fruit, rather than relying on very long storage.

**Food pairing notes — retain.** Keep the powerful Sagrantino description and lamb pairing; the producer also recommends roast meat and game.

**Suggested meal — retain.** Keep braised lamb shank with mushrooms: salt and the rich braise help with the tannic structure.

Retained meal: Braised lamb shank with mushrooms

Sources: [Wine Enthusiast: Lungarotti Sagrantino 2017](https://www.wineenthusiast.com/buying-guide/lungarotti-2017-montefalco-sagrantino/); [Lungarotti: 2017 vintage report](https://lungarotti.it/eng/vintage-report/); [Lungarotti: cuvée and pairings](https://lungarotti.it/ita/montefalcosagrantino/).

### 21. Michel Guignier Morgon Canon — 2023

ID: 1779157110325. **Changes proposed.**

**Drinking window — retain 2024-2032.** Keep 2024–2032 provisionally. The producer describes old-vine concentration and ten months in oak; an exact 2023 end date was not established.

**Peak year (estimated) — retain 2028.** Keep 2028 as a reasonable estimated target for a few years of development.

**Food pairing notes — revise.** The producer describes Canon as dense and full-bodied, so the blanket soft-tannin/light-fruit wording underplays the cuvée. Remove the unverified RP 92 claim and compulsory 30-minute decant. LCBO’s broad style category is lighter, reinforcing the need to avoid overly precise texture claims.

Proposed text: Old-vine Morgon Gamay with freshness, spice and more concentration than a simple light Beaujolais. Pair with roast chicken, duck, pork or savoury mushroom dishes. Taste on opening and aerate only if needed; a fixed decanting time is not essential.

**Suggested meal — retain.** Keep the roast chicken meal: it remains appropriate for either youthful or more developed Gamay.

Retained meal: Roasted herb-marinated chicken thighs, served with garlic mashed potatoes and roasted seasonal vegetables.

Sources: [Michel Guignier: Morgon Canon cuvée](https://morgon-michel-guignier.fr/produit/morgon-canon/); [LCBO: exact 2023 bottling](https://www.lcbo.com/en/michel-guignier-morgon-canon-51164).

### 22. Pian Cornello Rosso di Montalcino 2022 — 2022

ID: 678c0dfe-4b3d-4fb8-80ce-19722210ea93. **Changes proposed.**

**Drinking window — retain 2024-2030.** Keep 2024–2030 as a provisional near- to medium-term window. Falstaff found the 2022 already approachable in October 2024. The appellation consortium favours youthful consumption; 2030 is an estimated upper horizon, not a reason to wait.

**Peak year (estimated) — retain 2026.** Keep 2026 as a sensible near-term estimate for this Rosso, distinct from a long-aging Brunello.

**Food pairing notes — revise.** Replace the generic “likely” description with the exact-vintage review’s fruit, herbs and firmer tannins. The consortium supports meat-sauce pasta, pork and veal.

Proposed text: Sangiovese with fresh red fruit, herbs and a firm tannic edge. Pair with tomato-based meat ragù, roast pork, veal or grilled lamb. Keep sauces savoury; the acidity works well with tomato and the tannins with meat and olive oil.

**Suggested meal — revise.** Keep the lamb and vegetables but replace sweet balsamic reduction with pan jus. This reduces a potential sweetness clash with dry Sangiovese; it is a refinement, not an absolute pairing rule.

Proposed text: Rosemary-and-garlic grilled lamb chops with roasted vegetables and a savoury pan jus.

Sources: [Falstaff: Piancornello Rosso 2022](https://www.falstaff.com/en/wines/piancornello-2022-rosso-di-montalcino-doc); [Piancornello: Rosso cuvée](https://www.piancornello.it/en/rosso-di-montalcino/); [Brunello consortium: Rosso pairings and aging](https://www.consorziobrunellodimontalcino.it/en/587/il-rosso).

### 23. Primeira Estrada Gran Reserva Syrah Colheita de Inverno — 2021

ID: 39. **No changes proposed.**

**Drinking window — retain 2023–2032.** Keep 2023–2032 provisionally. The producer confirms the exact 2021 wine’s concentrated but fresh Syrah profile; no reliable vintage-specific aging range was found. Do not read the unchanged endpoint as certified.

**Peak year (estimated) — retain 2027.** Keep 2027 as a reasonable medium-term estimate; no unique peak is established.

**Food pairing notes — retain.** Keep barbecue, lamb and feijoada as style-based matches for peppery, full-bodied Syrah. Keep barbecue sauce low in sugar and chilli moderate with this 15% wine.

**Suggested meal — retain.** Keep charcoal-cooked lamb ribs; savoury smoke and fat are a good fit.

Retained meal: Brazilian lamb ribs slow-cooked on charcoal

Sources: [Estrada Real: exact Primeira Estrada Gran Reserva 2021 producer page](https://www.vinicolaestradareal.com/product-page/c%C3%B3pia-de-primeira-estrada-gran-reserva-syrah-2018-frete-gr%C3%A1tis).

### 24. Quinta da Manoella Vinhas Velhas — 2019

ID: 28. **No changes proposed.**

**Drinking window — retain 2025–2035.** Keep 2025–2035. Wine Spectator suggests drinking through 2034; Wine Enthusiast suggests from 2026. Those small differences support the overall planning range rather than a material correction.

**Peak year (estimated) — retain 2029.** Keep 2029 as a plausible estimated point between youthful fruit and more developed complexity.

**Food pairing notes — retain.** Keep the concentrated old-vine Douro profile and lamb/game/stew matches. Reviews also emphasise freshness and finesse; “concentrated” need not mean heavy.

**Suggested meal — retain.** Keep wild-boar ragù and tagliatelle; the dish has suitable depth, salt and richness.

Retained meal: Wild boar ragù with tagliatelle

Sources: [Winebow: Wine & Soul / exact 2019 Manoella reviews](https://www.winebow.com/our-brands/wine-soul); [Wine.com: Manoella Vinhas Velhas 2019](https://www.wine.com/product/wine-and-soul-quinta-da-manoella-vinhas-velhas-2019/1228793).

### 25. Santa Rita "Casa Real" Cabernet Sauvignon Reserva Especial — 2018

ID: 5. **No changes proposed.**

**Drinking window — retain 2024–2038.** Keep 2024–2038 provisionally. Santa Rita describes its flagship Casa Real Cabernet as capable of more than 20 years of aging. That supports the broad scale of the existing window, but is not an exact 2018 start/end recommendation. Do not confuse this wine with the separate Casa Real Escudo de Familia range.

**Peak year (estimated) — retain 2030.** Keep 2030 as an estimated mature-Cabernet target, not a verified peak.

**Food pairing notes — retain.** Keep cassis, cedar, mint and steak/lamb/cheese matches as appropriate Cabernet guidance. “Needs” is stylistic language, not a requirement that it must be served with those foods.

**Suggested meal — retain.** Keep ribeye and rosemary potatoes; salt, fat and herb flavours fit the structure.

Retained meal: Ribeye steak with rosemary potatoes

Sources: [Santa Rita: flagship Casa Real and cellaring potential (general cuvée guidance)](https://santaritaonline.com/casa-real/).

### 26. The Standish Wine Company The Schubert Theorem 2022 — 2022

ID: 1764117575388. **Changes proposed.**

**Drinking window — 2024-2032 → 2024–2052.** Extend 2024–2032 to 2024–2052, the Wine Advocate window reproduced with Erin Larkin’s exact 2022 review. The Vinorium’s own 2024 tasting independently suggests 2050+. The former end date substantially understated the documented potential.

**Peak year (estimated) — 2028 → 2036.** Move 2028 → 2036 as an estimated mature-style target, allowing the dense tannins time to develop. Critics also permit youthful enjoyment, so waiting is optional.

**Food pairing notes — revise.** Replace “likely” and “moderate tannins” with the review-supported concentration and fine but substantial tannins. The wine is not simply a generic easy-drinking Shiraz.

Proposed text: Concentrated Barossa Shiraz with dark fruit and substantial, fine chalky tannins. Pair with roast lamb, braised beef, venison or a savoury mushroom-and-meat dish. Avoid very sweet glazes and fierce chilli; the wine has both concentration and considerable alcohol.

**Suggested meal — retain.** Keep rosemary lamb chops, polenta and roast vegetables; the meal has enough richness without sweet sauce.

Retained meal: Grilled lamb chops with rosemary, served with a side of creamy polenta and roasted seasonal vegetables.

Sources: [Fine Wine Library: Erin Larkin’s 2022 review and window](https://finewinelibrary.nl/en/product/standish-schubert-theorem-2022); [The Vinorium: exact 2022 independent tasting](https://www.thevinorium.co.uk/item/standish-wines/standish-the-schubert-theorem-2022-in-bond/1R1).

### 27. Torre Muga Rioja — 2019

ID: 30. **No changes proposed.**

**Drinking window — retain 2025–2040.** Keep 2025–2040 provisionally. Wine Spectator allows immediate enjoyment; James Suckling prefers from 2027. The existing window is compatible with youthful and later enjoyment, although 2040 remains an estimated endpoint.

**Peak year (estimated) — retain 2032.** Keep 2032 as an estimated target for oak and tannin integration.

**Food pairing notes — retain.** Keep the Tempranillo-led blend, dark-fruit/oak profile and lamb/ham/mushroom suggestions. Serve mushrooms as part of a seasoned, rich dish; plain umami-rich mushrooms alone can accentuate tannin.

**Suggested meal — retain.** Keep slow-cooked lamb shoulder, a strong match for this concentrated red.

Retained meal: Slow‑cooked lamb shoulder

Sources: [Wine Express: exact Torre Muga 2019 critic reviews](https://www.wineexpress.com/bodegas-muga-2019-torre-muga-rioja).

### 28. Vi de Vila Gratallops — 2022

ID: 34. **Identity unresolved — no changes.**

**Drinking window — retain 2025–2035.** Hold 2025–2035 pending the producer. “Vi de Vila Gratallops” describes village origin and does not uniquely identify a producer. Álvaro Palacios makes a likely matching 2022 wine, but that cannot be assumed from the export.

**Peak year (estimated) — retain 2028.** 2028 is only a provisional style-based estimate until the producer is confirmed.

**Food pairing notes — retain.** The Grenache/Carignan and savoury meat guidance is broadly plausible, but the exact blend/profile is unverified.

**Suggested meal — retain.** Keep grilled lamb chops as a sensible provisional Priorat pairing.

Retained meal: Grilled lamb chops

Sources: [Bodeboca: Álvaro Palacios Gratallops 2022, candidate only](https://www.bodeboca.com/vino/gratallops-2022).

### 29. Volpaia Coltassala — 2019

ID: 22. **Changes proposed.**

**Drinking window — retain 2025–2040.** Keep 2025–2040. Langton’s reproduces that window; Wine Spectator’s 2025–2043 recommendation on the LCBO listing is close enough that no meaningful correction is needed.

**Peak year (estimated) — retain 2032.** Keep 2032 as an estimated target within the supported window.

**Food pairing notes — revise.** The acidity, red-fruit and Tuscan-food logic are sound. Remove the unverified RP 93 attribution and fixed decanting time; preserve the useful pairing advice.

Proposed text: Sangiovese-led Chianti Classico Gran Selezione with red fruit, floral notes, lively acidity and a firm tannic structure. Pair with Tuscan meat ragù, wild-boar pappardelle, roast lamb or aged Pecorino. Taste after opening and aerate if the wine remains closed.

**Suggested meal — retain.** Keep pappardelle with wild-boar ragù: a savoury, regional match with sufficient richness for the tannin.

Retained meal: Pappardelle al ragù di cinghiale

Sources: [LCBO Vintages: Coltassala 2019 / Wine Spectator](https://www.vintagesshoponline.com/vintages/ProductInfo.aspx?item=0477653); [Langton’s: Coltassala 2019](https://www.langtons.com.au/p/castello-di-volpaia-coltassala-gran-selezione--chianti-classico-docg-2019-bottle/4011-2019-1.html).

