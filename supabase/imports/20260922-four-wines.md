# Four additions to cellar 1 — researched 22 September 2026

Run the entire companion `20260922-four-wines.sql` in Supabase → SQL Editor → New query. No command-line generation is needed. It adds **one bottle of each**, leaves location unassigned, and omits prices and personal ratings. Les Sinards is assumed to be **Rouge**. Fixed import IDs make reruns harmless, including after a bottle has been consumed. Independently entered copies of these wines are not merged; this script represents four new bottles.

## Data and interpretation

| Wine | Suggested window | Planning peak* | WA / JS | Technical sheet | Bottle image |
|---|---|---|---|---|---|
| Les Sinards Rouge 2023 | 2026–2033* | 2029 | 92 / 94 | Producer, exact 2023 | Producer PNG, representative |
| Santa Margherita Valdadige Pinot Grigio 2025 | 2026–2028* | 2026 | Not verified | Producer, generic cuvée | Producer WebP, representative |
| Les Vénérables 2024 | 2026–2032* | 2028 | Not verified | Producer **2022 reference only** | Producer PNG, representative |
| CastelGiocondo 2021 | 2028–2042 | 2033 | 93 / 95 | Producer, exact 2021 | Producer PNG labelled 2021 |

\* Editorial planning estimates, assuming sound bottles and cool, stable storage. Peak years are convenient planning targets rather than objectively verified dates. Windows are not expiry dates. The Brunello window follows Vinous as reproduced by Woodland Hills. Service suggestions and meal ideas are identified in each wine's notes. Unknown ratings remain NULL, not zero. The displayed critic summary is the highest verified WA/JS score; individual scores and sources are retained.

## Sources and limitations

### Famille Perrin Les Sinards Rouge 2023

[Producer vintage page](https://m.familleperrin.com/1F6ZMF) and [2023 PDF](https://m.familleperrin.com/1F6ZMF/get/print) support the Grenache/Mourvèdre/Syrah blend, large-cask maturation, service temperature, food affinities and WA 92. The producer gives 5–10 years of ageing potential; its reproduced Jancis Robinson barrel-sample review extends to 2038. I chose the more conservative 2026–2033 planning window for this single bottle. [Millesima](https://www.millesima.fr/famille-perrin-les-sinards-2023-1.html) and [1jour1vin](https://www.1jour1vin.com/fr/guide-achat-vin/rhone/vins-chateauneuf-du-pape/perrin/28351-vin-rouge-les-sinards-famille-perrin-2023) corroborate JS 94 for the red 2023. No blend percentages were invented. The producer's PNG is a stock cuvée image, not confirmed 2023 label artwork.

### Santa Margherita Valdadige Pinot Grigio 2025

[Producer](https://www.santamargherita.com/it/vini/bianchi/wine/7) supplies the generic technical PDF and official WebP bottle image. It specifies Pinot Grigio, 12.5% ABV, stainless-steel production and seafood/white-meat pairings. [SAQ's 2025 listing](https://www.saq.com/en/12476073) corroborates the grape, appellation and alcohol (that listing is a half-bottle; no bottle volume is inferred for your purchase). The short window prioritizes youthful freshness. No exact-vintage WA/JS score was verified; retail customer ratings were excluded. The Valdadige wine was not confused with Santa Margherita's separate Alto Adige bottling.

### La Chablisienne Les Vénérables 2024

[Decanter's exact-vintage entry](https://www.decanter.com/wine-reviews/france/burgundy/la-chablisienne-les-venerables-chablis-burgundy-2024-103484/) establishes 100% Chardonnay, dry, medium-bodied and oaked. Its publicly available page did not expose a score or detailed tasting note. [Producer 2022 page](https://chablisienne.com/en/les-venerables-2022.html?___store=en) and [2022 technical sheet](https://chablisienne.com/media/wysiwyg/Chablis_Les_v_n_rables_2022.pdf) provide cuvée background only. The [producer's 2023 page](https://chablisienne.com/en/les-venerables-386.html?___store=en) exists, but its linked 2023 PDF returned 404. No 2024 producer sheet was found. The working **2022** PDF is included as a clearly disclosed reference, with no transfer of its tasting note to 2024. Window, peak, serving temperature and pairings are editorial suggestions. No exact-vintage WA/JS score was verified.

### Frescobaldi CastelGiocondo Brunello di Montalcino 2021

[Producer 2021 technical sheet](https://www.frescobaldi.com/en/pdf/castelgiocondo/2021) supplies the vintage, maturation and tasting information. The [producer page](https://www.frescobaldi.com/en/wines/castelgiocondo) identifies the linked PNG as 2021. [Mövenpick's 2021 listing](https://www.moevenpick-wein.de/2021-castelgiocondo-brunello-di-montalcino-docg-tenuta-di-castelgiocondo-frescobaldi.html) supports 100% Sangiovese and 14.5% ABV. [K&L](https://shop.klwines.com/products/details/2038415) lists WA 93 and JS 95; [Woodland Hills](https://whwc.com/frescobaldi-brunello-di-montalcino-castelgiocondo-2021/) reproduces JS 95 and Vinous's 2028–2042 window. An [isolated merchant listing](https://www.swipo.it/prodotto/castelgiocondo-2021-tenuta-castelgiocondo/) claims JS 97 without the corresponding dated review. That claim was not promoted over corroborated JS 95. The highest verified critic score stored is 95. Peak 2033 and meal/service suggestions are editorial estimates.

## Validation

The SQL was run against a local PostgreSQL-compatible PGlite database with all repository migrations. Verified four new entries, quantity one each, empty locations, NULL prices/personal ratings, no changes to another cellar, and no extra inserts or restocking on rerun. It has **not** been executed against your Supabase project.

All media URLs are external producer links; availability remains controlled by those producers. Three are PNGs and one WebP; none has been renamed or converted to pretend it is PNG.
