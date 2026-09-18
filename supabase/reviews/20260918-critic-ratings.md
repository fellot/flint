# Active cellar: Wine Advocate and JamesSuckling.com ratings

Researched 18 September 2026. Scope: all 29 wine/vintage entries in the latest user-supplied Supabase export, preserved in `20260917-wine-audit.json`. This is a snapshot, not a fresh query of the live cellar. No database or application changes were made.

## Ready-to-run SQL update

Following the owner's instruction to choose the highest score in a mismatch, `20260918-critic-ratings.sql` is now ready to paste in full into **Supabase → SQL Editor → New query → Run**. No terminal commands are needed.

The script creates separate `wines.critic_rating` and `wines.critic_ratings` columns and proposes updates for 22 exact-match entries. It selects **Coltassala JS 96** and **Manoella WA 95**, retaining sources and the reason for the choice. The numeric summary is the highest of the stored critics; a range uses its upper bound for sorting while retaining the original range in `display_score`. Existing personal and historical ratings remain unchanged. Arzuaga JS 92 remains explicitly provisional; uncorroborated WA badges and ambiguous wine identities are excluded.

The result table reports updates, previously applied rows, missing/inactive wines, identity changes and conflicting later edits. Four wines without verified scores and three ambiguous identities are skipped. The script has been tested against a local PostgreSQL-compatible database, including repeat execution and the existing consumption/journal functions; it has not been executed against your Supabase project.

**This updates database data only. The website needs a separate UI change to display the new critic-rating fields.** The evidence below records the original research, including discrepancies that the owner's highest-score rule now resolves for this import.

## How to read this report

- **WA** means Robert Parker's Wine Advocate, including its team of reviewers; these scores are not necessarily awarded by Robert Parker personally. **JS** means JamesSuckling.com and its tasting team.
- All scores are out of 100. Preserve `+` and score ranges exactly. A range is not a final score equal to its upper endpoint.
- **—** means no sufficiently verified exact-vintage score found in the accessible sources, not that the wine has never been reviewed.
- Sources include producers, importers, critics' public pages and retailers reproducing reviews. Paid critic databases were not accessed. A source link documents the evidence available, not a guarantee that no later tasting exists.
- **Provisional** identifies a single retailer's unsupported score badge. **Conflict** identifies incompatible published values. These should not become definitive database ratings without further verification.

## Wine-by-wine results

| Wine | Vintage | WA | JS | Evidence / qualification |
|---|---:|---:|---:|---|
| Arzuaga Reserva Especial | 2019 | — | 92 provisional | [SoloWine](https://solowine.es/shop/arzuaga-reserva-especial-2019/); exact-vintage badge, no dated review. See note 1. |
| Casa Ferreirinha Castas Escondidas | 2019 | 93 | 94 | [Millesima](https://www.millesima.com/casa-ferreirinha-castas-escondidas-2019.html) |
| Casa Ferreirinha Quinta da Leda | 2018 | 90 | 94 | [Millesima](https://www.millesima.com/casa-ferreirinha-quinta-da-leda-2018.html); exact-vintage review text |
| Casa Ferreirinha Quinta da Leda | 2021 | 93 | 94 | [Wine.com](https://www.wine.com/product/casa-ferreirinha-quinta-da-leda-2021/4121952); exact-vintage review text |
| Banfi Poggio all'Oro Brunello di Montalcino Riserva | 2016 | 96+ | 97 | [Producer's vintage awards](https://www.banfi.it/poggio-all-oro/) |
| Château Clerc Milon | 2020 | 94+ | 97 | [Wine.com](https://www.wine.com/product/chateau-clerc-milon-2020/749385); WA review retains the plus sign below its numeric badge |
| Château La Nerthe Clos de Beauvenir Blanc | 2021 | 90 | — | [Kobrand importer](https://www.kobrandwineandspirits.com/release/chateau-la-nerthe-clos-de-beauvenir-chateauneuf-du-pape-blanc-2021/) |
| Château La Tour Blanche | 2016 | 95 | 93 | [Millesima](https://www.millesima.fr/chateau-la-tour-blanche-2016.html) |
| Château Suduiraut | 2014 | 93 | 94 | [WA: Wine.com](https://www.wine.com/product/chateau-suduiraut-sauternes-2014/142902), [JS: Farr Vintners](https://www.farrvintners.com/wine.php?wine=40446). See note 2. |
| Clos du Lican | 2021 | — | 100 | [JamesSuckling.com report](https://www.jamessuckling.com/wine-tasting-reports/chiles-2021-stunners-and-the-pfalzs-radical-terroir-wines-weekly-tasting-report), [producer's 2021 sheet](https://www.closdulican.com/wp-content/uploads/2025/01/ClosduLican_FT_2021_EN.pdf). See note 3. |
| Domaine d'Ardhuy Corton Le Clos du Roi Grand Cru | 2018 | — | — | No matching WA/JS score verified. [Exact-vintage independent tasting](https://www.burgundy-report.com/burgundy-report-extra/06-2020/ardhuy-2018/) is not a WA/JS rating. |
| Domaine Huet Clos du Bourg Moelleux | 2018 | 95 | — | [Comptoir des Millésimes](https://www.comptoirdesmillesimes.com/clos-du-bourg-huet/clos-du-bourg-2018-moelleux-domaine-huet.html); Stephan Reinhardt, May 2019. Regular Moelleux, not Première Trie. |
| Domaine Labruyère Champ de Cour Moulin-à-Vent | 2018 | 92 | 94 | [U'wine](https://u.wine/en/wines/beaujolais/moulin-a-vent/23397-domaine-labruyere-moulin-a-vent-champ-de-cour-2018) |
| Château de Beaucastel Roussanne Vieilles Vignes | 2021 | 95–97 range | 97 | [K&L, dated reviews](https://shop.klwines.com/products/details/1800190); WA October 2023, JS April 2023. See note 4. |
| Ferreira Vintage Port | 2018 | 94–96 range | 92 | [WineBid](https://www.winebid.com/BuyWine/Item/Auction/1578730/2018-Ferreira), [importer ratings](https://evaton.com/ratings/). See note 4. |
| Garage Wine Co. Truquilemu Vineyard, entered as Lot 97 | 2019 entered | Identity needed | Identity needed | Lot and vintage conflict; see identity A below. |
| Gran Enemigo Gualtallary | 2019 | 100 | 100 | [Aponticia](https://www.aponticia.es/vino/gran-enemigo-gualtallary-2019/), [Dunell's critic-review offer](https://www.dunells.com/media/ie2lwu3l/pre-release-wines-full-list-30-05-23.pdf) |
| Lorenzo Lo Sagrado Cabernet Franc | 2019 | — | — | No matching WA/JS score verified. [Fabricio Portelli's 2019 review](https://www.fabricioportelli.com/lorenzo-lo-sagrado-cabernet-franc-2019/) is from a different critic. |
| Luigi Baudana Barolo, cuvée unspecified | 2021 | Identity needed | Identity needed | Producer has multiple Barolos; see identity B below. |
| Lungarotti Montefalco Sagrantino | 2017 | 92 | 93 | [Producer's 2024 awards table](https://lungarotti.it/files/bds2024.pdf), [JS corroboration](https://landofwines.com/vini/montefalco-sagrantino-docg-2017/) |
| Michel Guignier Morgon Canon | 2023 | — | 99 | [FineWines reproduces the review](https://finewines.dk/products/michel-guignier-morgon-canon-2023), [critic's exact-vintage entry, 10 March 2025](https://www.jamessuckling.com/tasting-notes/294768/michel-guignier-morgon-canon) |
| Piancornello Rosso di Montalcino | 2022 | — | — | No matching WA/JS score verified. [Falstaff's exact-vintage review](https://www.falstaff.com/en/wines/piancornello-2022-rosso-di-montalcino-doc) is from a different publication. |
| Primeira Estrada Gran Reserva Syrah | 2021 | — | — | No matching WA/JS score verified. [Producer's exact-vintage page](https://www.vinicolaestradareal.com/product-page/c%C3%B3pia-de-primeira-estrada-gran-reserva-syrah-2018-frete-gr%C3%A1tis) (page content is 2021 despite the old URL). |
| Quinta da Manoella Vinhas Velhas | 2019 | 95 and 94, separate reviews | — | [Producer lists 95](https://wineandsoul.com/project/vinhas-velhas/), [Wine.com reproduces a 94-point review](https://www.wine.com/product/wine-and-soul-quinta-da-manoella-vinhas-velhas-2019/1228793). See note 5. |
| Santa Rita Casa Real Reserva Especial Cabernet Sauvignon | 2018 | 92 | 94 | [WA review](https://www.wine.com/product/santa-rita-casa-real-cabernet-sauvignon-2018/837788), [JS corroboration](https://events.spectator.co.uk/events/santa-rita-grand-cru-wines-of-chile-lunch). Flagship Casa Real, not Escudo de Familia. |
| Standish The Schubert Theorem | 2022 | 98+ | 98 | [K&L, full dated reviews](https://shop.klwines.com/products/details/2006787); WA May 2024, JS October 2024 |
| Torre Muga | 2019 | 95+ | 97 | [Wine Express reproduces both reviews](https://www.wineexpress.com/bodegas-muga-2019-torre-muga-rioja) |
| Vi de Vila Gratallops, producer unspecified | 2022 | Identity needed | Identity needed | See identity C below. |
| Volpaia Coltassala | 2019 | 94 | Conflict: 95 / 96 | [Millesima lists WA 94 and JS 95](https://www.millesima.com/castello-di-volpaia-coltassala-gran-selezione-2019.html); [producer's sheet lists JS 96](https://volpaia.com/?jet_download=10645). See note 6. |

## Notes on rating evidence

1. **Arzuaga:** JS 92 is a provisional merchant-reported value. Another merchant's generic page shows JS 93 alongside an image labelled 2015, so that does not securely establish 2019. A [Vinopremier listing](https://vinopremier.com/vino-tinto-arzuaga-reserva-especial.html) labels the wine 2019 and displays Parker 97, but provides no matching dated critic review; I could not independently corroborate it and have not accepted it as a verified score. The cellar's old RP 94 wording is not evidence for that rating either.
2. **Suduiraut:** the WA 93 review is attributed to Yohan Castaing, June 2024, by [Fine+Rare](https://www.frw.co.uk/product/612ec2800100000000032003/2014-suduiraut-suduiraut). JS 94 is a February 2017 tasting. The earlier April 2015 JS 97–98 barrel estimate is a separate assessment and should not be entered as a final 98.
3. **Clos du Lican:** a [single retailer lists WA 93](https://www.finewineshop.com/2021-Clos-du-Lican/806130) without the WA review. An accessible 93-point WA review explicitly concerns **2019**, so 93 is left unverified for 2021. JS 100 for 2021 has much stronger evidence, including the critic's public article and producer sheet.
4. **Ranges:** Beaucastel's WA text is reproduced as 95–97, even where retail badges display 97. Ferreira's importer and WineBid show 94–96; preserve that range rather than recording 96 as a verified final rating. For Beaucastel, the JS 97 in April 2023 supersedes the older 97–98 estimate reproduced in some producer materials. No later final WA score was verified in this research.
5. **Manoella:** [K&L dates Mark Squires's WA 95 to December 2021](https://shop.klwines.com/products/details/1643038). Wine.com reproduces a distinct 94-point assessment of the same 2019 wine; its publication date is not shown there. Keep the reviews separate rather than averaging them or treating 94–95 as a barrel range. I cannot establish the latest assessment solely from these pages.
6. **Coltassala:** the producer's 2019 PDF says JS 96; [Wine.com says JS 95](https://www.wine.com/product/castello-di-volpaia-coltassala-chianti-classico-gran-selezione-2019/1308515) and reproduces the same tasting-note opening. This appears to be a transcription discrepancy rather than an identified pair of differently dated reviews. The [critic's June 2022 entry](https://www.jamessuckling.com/tasting-notes/186097/volpaia-chianti-classico-gran-selezione-coltassala-2019) confirms the wine and vintage but hides the numerical rating in the accessible page. Leave JS unresolved pending authoritative confirmation; WA 94 is independently listed by multiple merchants.

## Wine identities to confirm

### A. Garage Wine Co. Truquilemu

The [producer's vintage list](https://garagewine.company/wines/truquilemu/) maps **Lot 97 to 2018** and **Lot 107 to 2019**. Your entry combines Lot 97 with 2019.

- If the label says **2019 / Lot 107 / Truquilemu Vineyard**, the matching WA review is **97** ([review reproduced by Cru World Wine](https://eu.cruworldwine.com/offers/rest-of-world/garage-wine-co-2019-range)); JS **95** is listed for Lot 107 by [Vila Viniteca](https://www.vilaviniteca.es/es/maule).
- If the label says **2018 / Lot 97**, the matching WA score is **98**, as listed in [Cru World Wine's producer inventory](https://eu.cruworldwine.com/producers/garage-wine-co/).
- Do not substitute **Cru Truquilemu** or **Vigno** scores. Some merchant pages themselves mix these cuvées or lot numbers; the body of the review and the actual bottle label matter.

### B. Luigi Baudana Barolo 2021

The exported name does not specify which bottling it is. Examples:

- **Barolo del Comune di Serralunga d'Alba 2021:** WA **94** ([exact-vintage review](https://www.wine.com/product/luigi-baudana-barolo-del-comune-di-serralunga-dalba-2021/3289838)).
- **Barolo Baudana 2021:** WA **95**, JS **97** ([exact-vintage reviews](https://www.voyageursduvin.com/luigi-baudana-barolo-baudana-2021-w17875)).

Cerretta is another distinct bottling. These are candidate matches, not ratings assigned to your unspecified entry.

### C. Vi de Vila Gratallops 2022

If your producer is **Álvaro Palacios**, the matching ratings are WA **95** and JS **94** ([Bodeboca, including the 2022-specific review](https://www.bodeboca.fr/vin/gratallops-2022), [corroboration](https://vinogrande.pt/en/products/gratallops-2022)). The export does not name the producer, so these remain conditional. “Vi de Vila” is an appellation category, not a unique producer identifier.

## If these ratings are added to Flint later

Keep external critic ratings separate from each user's journal score. Store the critic/publication, display score (including plus sign or range), source URL, review date when known, verification status and exact producer/cuvée/vintage. Unknown or unresolved values should remain empty rather than zero. Multiple dated reviews can coexist.
