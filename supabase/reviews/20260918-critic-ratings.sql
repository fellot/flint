-- Flint critic ratings, researched 2026-09-18.
-- RUN THIS ENTIRE FILE in Supabase > SQL Editor > New query.
-- No command-line generation is needed. This file creates its own columns.
-- Targets the 29 exported entries in cellar 1; proposes scores for 22 entries.
-- Adds critic_rating (highest numeric score) and critic_ratings (per-critic evidence).
-- Does NOT overwrite wines.rating, user journal reviews, notes or food pairings.
-- Highest conflicting exact-match score wins: Coltassala JS 96; Manoella WA 95.
-- Range upper bounds are numeric SORTING scores; display_score preserves the range.
-- Unknown identities and missing ratings are skipped, not guessed or set to zero.
-- A final result table explains every update or skip. Rerunning makes no extra writes.
-- Database-only update: Flint's current UI does not yet display these new fields.
-- Details and sources: 20260918-critic-ratings.md.

begin;
set local standard_conforming_strings = on;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- Nullable regular columns remain compatible with existing consume/log RPCs,
-- which insert complete wine row values (including outside-cellar tastings).
alter table public.wines
  add column if not exists critic_rating numeric check (critic_rating between 0 and 100),
  add column if not exists critic_ratings jsonb check (jsonb_typeof(critic_ratings) = 'object');
comment on column public.wines.critic_rating is
  'Highest recorded WA/JS numeric score; range upper bounds are for sorting, not final point ratings. Separate from personal reviews.';
comment on column public.wines.critic_ratings is
  'Per-critic score, original display score/range, verification status and source URLs. Separate from personal reviews.';

create temporary table flint_critic_import (
  cellar_id text not null check (cellar_id = '1'), id text not null,
  bottle text not null, vintage integer not null, ratings jsonb, note text not null,
  primary key (cellar_id, id)
) on commit drop;

insert into flint_critic_import
select * from jsonb_to_recordset($critic_data$
[
  {
    "cellar_id": "1",
    "id": "31",
    "bottle": "Arzuaga Reserva Especial",
    "vintage": 2019,
    "ratings": {
      "james_suckling": {
        "score": 92,
        "display_score": "92",
        "score_kind": "point",
        "verification": "provisional",
        "source_urls": [
          "https://solowine.es/shop/arzuaga-reserva-especial-2019/"
        ],
        "researched_on": "2026-09-18"
      }
    },
    "note": "JS 92 is provisional: one exact-vintage merchant badge. Uncorroborated WA 97 excluded; choosing the highest does not resolve source verification."
  },
  {
    "cellar_id": "1",
    "id": "24",
    "bottle": "Casa Ferreirinha Castas Escondidas Douro",
    "vintage": 2019,
    "ratings": {
      "wine_advocate": {
        "score": 93,
        "display_score": "93",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://www.millesima.com/casa-ferreirinha-castas-escondidas-2019.html"
        ],
        "researched_on": "2026-09-18"
      },
      "james_suckling": {
        "score": 94,
        "display_score": "94",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://www.millesima.com/casa-ferreirinha-castas-escondidas-2019.html"
        ],
        "researched_on": "2026-09-18"
      }
    },
    "note": "Exact wine/vintage match. Highest of the recorded critics supplies the summary score."
  },
  {
    "cellar_id": "1",
    "id": "25",
    "bottle": "Casa Ferreirinha Quinta da Leda",
    "vintage": 2018,
    "ratings": {
      "wine_advocate": {
        "score": 90,
        "display_score": "90",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://www.millesima.com/casa-ferreirinha-quinta-da-leda-2018.html"
        ],
        "researched_on": "2026-09-18"
      },
      "james_suckling": {
        "score": 94,
        "display_score": "94",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://www.millesima.com/casa-ferreirinha-quinta-da-leda-2018.html"
        ],
        "researched_on": "2026-09-18"
      }
    },
    "note": "Exact wine/vintage match. Highest of the recorded critics supplies the summary score."
  },
  {
    "cellar_id": "1",
    "id": "2c2ebb2e-413f-4157-b432-dfa0553f00c6",
    "bottle": "Casa Ferreirinha Quinta da Leda 2021",
    "vintage": 2021,
    "ratings": {
      "wine_advocate": {
        "score": 93,
        "display_score": "93",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://www.wine.com/product/casa-ferreirinha-quinta-da-leda-2021/4121952"
        ],
        "researched_on": "2026-09-18"
      },
      "james_suckling": {
        "score": 94,
        "display_score": "94",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://www.wine.com/product/casa-ferreirinha-quinta-da-leda-2021/4121952"
        ],
        "researched_on": "2026-09-18"
      }
    },
    "note": "Exact wine/vintage match. Highest of the recorded critics supplies the summary score."
  },
  {
    "cellar_id": "1",
    "id": "21",
    "bottle": "Castello Banfi Poggio all'Oro Brunello di Montalcino Riserva",
    "vintage": 2016,
    "ratings": {
      "wine_advocate": {
        "score": 96,
        "display_score": "96+",
        "score_kind": "plus",
        "verification": "sourced",
        "source_urls": [
          "https://www.banfi.it/poggio-all-oro/"
        ],
        "researched_on": "2026-09-18"
      },
      "james_suckling": {
        "score": 97,
        "display_score": "97",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://www.banfi.it/poggio-all-oro/"
        ],
        "researched_on": "2026-09-18"
      }
    },
    "note": "Exact wine/vintage match. Highest of the recorded critics supplies the summary score."
  },
  {
    "cellar_id": "1",
    "id": "1764117502289",
    "bottle": "Chateau Clerc Milon 2020",
    "vintage": 2020,
    "ratings": {
      "wine_advocate": {
        "score": 94,
        "display_score": "94+",
        "score_kind": "plus",
        "verification": "sourced",
        "source_urls": [
          "https://www.wine.com/product/chateau-clerc-milon-2020/749385"
        ],
        "researched_on": "2026-09-18"
      },
      "james_suckling": {
        "score": 97,
        "display_score": "97",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://www.wine.com/product/chateau-clerc-milon-2020/749385"
        ],
        "researched_on": "2026-09-18"
      }
    },
    "note": "Exact wine/vintage match. Highest of the recorded critics supplies the summary score."
  },
  {
    "cellar_id": "1",
    "id": "11",
    "bottle": "Château La Nerthe \"Clos de Beauvenir\"",
    "vintage": 2021,
    "ratings": {
      "wine_advocate": {
        "score": 90,
        "display_score": "90",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://www.kobrandwineandspirits.com/release/chateau-la-nerthe-clos-de-beauvenir-chateauneuf-du-pape-blanc-2021/"
        ],
        "researched_on": "2026-09-18"
      }
    },
    "note": "Exact wine/vintage match. Highest of the recorded critics supplies the summary score."
  },
  {
    "cellar_id": "1",
    "id": "1764117687338",
    "bottle": "Chateau La Tour Blanche 2016",
    "vintage": 2016,
    "ratings": {
      "wine_advocate": {
        "score": 95,
        "display_score": "95",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://www.millesima.fr/chateau-la-tour-blanche-2016.html"
        ],
        "researched_on": "2026-09-18"
      },
      "james_suckling": {
        "score": 93,
        "display_score": "93",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://www.millesima.fr/chateau-la-tour-blanche-2016.html"
        ],
        "researched_on": "2026-09-18"
      }
    },
    "note": "Exact wine/vintage match. Highest of the recorded critics supplies the summary score."
  },
  {
    "cellar_id": "1",
    "id": "45",
    "bottle": "Château Suduiraut",
    "vintage": 2014,
    "ratings": {
      "wine_advocate": {
        "score": 93,
        "display_score": "93",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://www.wine.com/product/chateau-suduiraut-sauternes-2014/142902",
          "https://www.farrvintners.com/wine.php?wine=40446"
        ],
        "researched_on": "2026-09-18"
      },
      "james_suckling": {
        "score": 94,
        "display_score": "94",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://www.wine.com/product/chateau-suduiraut-sauternes-2014/142902",
          "https://www.farrvintners.com/wine.php?wine=40446"
        ],
        "researched_on": "2026-09-18"
      }
    },
    "note": "Exact wine/vintage match. Highest of the recorded critics supplies the summary score."
  },
  {
    "cellar_id": "1",
    "id": "1770385391795",
    "bottle": "Clos du Lican",
    "vintage": 2021,
    "ratings": {
      "james_suckling": {
        "score": 100,
        "display_score": "100",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://www.jamessuckling.com/wine-tasting-reports/chiles-2021-stunners-and-the-pfalzs-radical-terroir-wines-weekly-tasting-report",
          "https://www.closdulican.com/wp-content/uploads/2025/01/ClosduLican_FT_2021_EN.pdf"
        ],
        "researched_on": "2026-09-18"
      }
    },
    "note": "Only verified JS 100 included. WA 93 retailer badge lacks an exact-2021 review and remains unverified."
  },
  {
    "cellar_id": "1",
    "id": "8",
    "bottle": "Corton \"Le Clos du Roi\" Grand Cru (Domaine d'Ardhuy)",
    "vintage": 2018,
    "ratings": null,
    "note": "No verified exact-vintage WA/JS score found; skipped."
  },
  {
    "cellar_id": "1",
    "id": "7",
    "bottle": "Domaine Huet – Clos du Bourg Moelleux",
    "vintage": 2018,
    "ratings": {
      "wine_advocate": {
        "score": 95,
        "display_score": "95",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://www.comptoirdesmillesimes.com/clos-du-bourg-huet/clos-du-bourg-2018-moelleux-domaine-huet.html"
        ],
        "researched_on": "2026-09-18"
      }
    },
    "note": "Exact wine/vintage match. Highest of the recorded critics supplies the summary score."
  },
  {
    "cellar_id": "1",
    "id": "40",
    "bottle": "Domaine Labruyère Champ de Cour Moulin-à-Vent",
    "vintage": 2018,
    "ratings": {
      "wine_advocate": {
        "score": 92,
        "display_score": "92",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://u.wine/en/wines/beaujolais/moulin-a-vent/23397-domaine-labruyere-moulin-a-vent-champ-de-cour-2018"
        ],
        "researched_on": "2026-09-18"
      },
      "james_suckling": {
        "score": 94,
        "display_score": "94",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://u.wine/en/wines/beaujolais/moulin-a-vent/23397-domaine-labruyere-moulin-a-vent-champ-de-cour-2018"
        ],
        "researched_on": "2026-09-18"
      }
    },
    "note": "Exact wine/vintage match. Highest of the recorded critics supplies the summary score."
  },
  {
    "cellar_id": "1",
    "id": "12",
    "bottle": "Famille Perrin Château de Beaucastel Roussanne Vieilles Vignes",
    "vintage": 2021,
    "ratings": {
      "wine_advocate": {
        "score": 97,
        "display_score": "95–97",
        "score_kind": "range",
        "verification": "sourced",
        "source_urls": [
          "https://shop.klwines.com/products/details/1800190"
        ],
        "researched_on": "2026-09-18"
      },
      "james_suckling": {
        "score": 97,
        "display_score": "97",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://shop.klwines.com/products/details/1800190"
        ],
        "researched_on": "2026-09-18"
      }
    },
    "note": "WA 95–97 remains a range. The upper bound 97 is used only for the numeric sorting score. JS 97 is the final score rather than an older barrel estimate."
  },
  {
    "cellar_id": "1",
    "id": "27",
    "bottle": "Ferreira Vintage Port",
    "vintage": 2018,
    "ratings": {
      "wine_advocate": {
        "score": 96,
        "display_score": "94–96",
        "score_kind": "range",
        "verification": "sourced",
        "source_urls": [
          "https://www.winebid.com/BuyWine/Item/Auction/1578730/2018-Ferreira",
          "https://evaton.com/ratings/"
        ],
        "researched_on": "2026-09-18"
      },
      "james_suckling": {
        "score": 92,
        "display_score": "92",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://www.winebid.com/BuyWine/Item/Auction/1578730/2018-Ferreira",
          "https://evaton.com/ratings/"
        ],
        "researched_on": "2026-09-18"
      }
    },
    "note": "WA 94–96 remains a range. The upper bound 96 is used only for the numeric sorting score."
  },
  {
    "cellar_id": "1",
    "id": "6",
    "bottle": "Garage Wine Co. \"Truquilemu Vineyard\" Carignan Field Blend Lot 97",
    "vintage": 2019,
    "ratings": null,
    "note": "Skipped: 2019 vintage conflicts with Lot 97 (2018). Confirm bottle label."
  },
  {
    "cellar_id": "1",
    "id": "1",
    "bottle": "Gran Enemigo – Gualtallary",
    "vintage": 2019,
    "ratings": {
      "wine_advocate": {
        "score": 100,
        "display_score": "100",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://www.aponticia.es/vino/gran-enemigo-gualtallary-2019/",
          "https://www.dunells.com/media/ie2lwu3l/pre-release-wines-full-list-30-05-23.pdf"
        ],
        "researched_on": "2026-09-18"
      },
      "james_suckling": {
        "score": 100,
        "display_score": "100",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://www.aponticia.es/vino/gran-enemigo-gualtallary-2019/",
          "https://www.dunells.com/media/ie2lwu3l/pre-release-wines-full-list-30-05-23.pdf"
        ],
        "researched_on": "2026-09-18"
      }
    },
    "note": "Exact wine/vintage match. Highest of the recorded critics supplies the summary score."
  },
  {
    "cellar_id": "1",
    "id": "2",
    "bottle": "Lorenzo Lo Sagrado Cabernet Franc",
    "vintage": 2019,
    "ratings": null,
    "note": "No verified exact-vintage WA/JS score found; skipped."
  },
  {
    "cellar_id": "1",
    "id": "1788389989910",
    "bottle": "Luigi Baudana Barolo",
    "vintage": 2021,
    "ratings": null,
    "note": "Skipped: Luigi Baudana 2021 Barolo cuvee unspecified. Confirm Serralunga, Baudana or Cerretta."
  },
  {
    "cellar_id": "1",
    "id": "20",
    "bottle": "Lungarotti Montefalco Sagrantino DOCG",
    "vintage": 2017,
    "ratings": {
      "wine_advocate": {
        "score": 92,
        "display_score": "92",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://lungarotti.it/files/bds2024.pdf",
          "https://landofwines.com/vini/montefalco-sagrantino-docg-2017/"
        ],
        "researched_on": "2026-09-18"
      },
      "james_suckling": {
        "score": 93,
        "display_score": "93",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://lungarotti.it/files/bds2024.pdf",
          "https://landofwines.com/vini/montefalco-sagrantino-docg-2017/"
        ],
        "researched_on": "2026-09-18"
      }
    },
    "note": "Exact wine/vintage match. Highest of the recorded critics supplies the summary score."
  },
  {
    "cellar_id": "1",
    "id": "1779157110325",
    "bottle": "Michel Guignier Morgon Canon",
    "vintage": 2023,
    "ratings": {
      "james_suckling": {
        "score": 99,
        "display_score": "99",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://finewines.dk/products/michel-guignier-morgon-canon-2023",
          "https://www.jamessuckling.com/tasting-notes/294768/michel-guignier-morgon-canon"
        ],
        "researched_on": "2026-09-18"
      }
    },
    "note": "Exact wine/vintage match. Highest of the recorded critics supplies the summary score."
  },
  {
    "cellar_id": "1",
    "id": "678c0dfe-4b3d-4fb8-80ce-19722210ea93",
    "bottle": "Pian Cornello Rosso di Montalcino 2022",
    "vintage": 2022,
    "ratings": null,
    "note": "No verified exact-vintage WA/JS score found; skipped."
  },
  {
    "cellar_id": "1",
    "id": "39",
    "bottle": "Primeira Estrada Gran Reserva Syrah Colheita de Inverno",
    "vintage": 2021,
    "ratings": null,
    "note": "No verified exact-vintage WA/JS score found; skipped."
  },
  {
    "cellar_id": "1",
    "id": "28",
    "bottle": "Quinta da Manoella Vinhas Velhas",
    "vintage": 2019,
    "ratings": {
      "wine_advocate": {
        "score": 95,
        "display_score": "95",
        "score_kind": "point",
        "verification": "highest_conflicting_score",
        "source_urls": [
          "https://wineandsoul.com/project/vinhas-velhas/",
          "https://shop.klwines.com/products/details/1643038"
        ],
        "researched_on": "2026-09-18"
      }
    },
    "note": "Selected the higher WA score, 95, from the two different published assessments (95 and 94), per owner instruction."
  },
  {
    "cellar_id": "1",
    "id": "5",
    "bottle": "Santa Rita \"Casa Real\" Cabernet Sauvignon Reserva Especial",
    "vintage": 2018,
    "ratings": {
      "wine_advocate": {
        "score": 92,
        "display_score": "92",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://www.wine.com/product/santa-rita-casa-real-cabernet-sauvignon-2018/837788",
          "https://events.spectator.co.uk/events/santa-rita-grand-cru-wines-of-chile-lunch"
        ],
        "researched_on": "2026-09-18"
      },
      "james_suckling": {
        "score": 94,
        "display_score": "94",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://www.wine.com/product/santa-rita-casa-real-cabernet-sauvignon-2018/837788",
          "https://events.spectator.co.uk/events/santa-rita-grand-cru-wines-of-chile-lunch"
        ],
        "researched_on": "2026-09-18"
      }
    },
    "note": "Exact wine/vintage match. Highest of the recorded critics supplies the summary score."
  },
  {
    "cellar_id": "1",
    "id": "1764117575388",
    "bottle": "The Standish Wine Company The Schubert Theorem 2022",
    "vintage": 2022,
    "ratings": {
      "wine_advocate": {
        "score": 98,
        "display_score": "98+",
        "score_kind": "plus",
        "verification": "sourced",
        "source_urls": [
          "https://shop.klwines.com/products/details/2006787"
        ],
        "researched_on": "2026-09-18"
      },
      "james_suckling": {
        "score": 98,
        "display_score": "98",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://shop.klwines.com/products/details/2006787"
        ],
        "researched_on": "2026-09-18"
      }
    },
    "note": "Exact wine/vintage match. Highest of the recorded critics supplies the summary score."
  },
  {
    "cellar_id": "1",
    "id": "30",
    "bottle": "Torre Muga Rioja",
    "vintage": 2019,
    "ratings": {
      "wine_advocate": {
        "score": 95,
        "display_score": "95+",
        "score_kind": "plus",
        "verification": "sourced",
        "source_urls": [
          "https://www.wineexpress.com/bodegas-muga-2019-torre-muga-rioja"
        ],
        "researched_on": "2026-09-18"
      },
      "james_suckling": {
        "score": 97,
        "display_score": "97",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://www.wineexpress.com/bodegas-muga-2019-torre-muga-rioja"
        ],
        "researched_on": "2026-09-18"
      }
    },
    "note": "Exact wine/vintage match. Highest of the recorded critics supplies the summary score."
  },
  {
    "cellar_id": "1",
    "id": "34",
    "bottle": "Vi de Vila Gratallops",
    "vintage": 2022,
    "ratings": null,
    "note": "Skipped: Gratallops producer unspecified. Confirm producer."
  },
  {
    "cellar_id": "1",
    "id": "22",
    "bottle": "Volpaia Coltassala",
    "vintage": 2019,
    "ratings": {
      "wine_advocate": {
        "score": 94,
        "display_score": "94",
        "score_kind": "point",
        "verification": "sourced",
        "source_urls": [
          "https://www.millesima.com/castello-di-volpaia-coltassala-gran-selezione-2019.html",
          "https://volpaia.com/?jet_download=10645"
        ],
        "researched_on": "2026-09-18"
      },
      "james_suckling": {
        "score": 96,
        "display_score": "96",
        "score_kind": "point",
        "verification": "highest_conflicting_score",
        "source_urls": [
          "https://www.millesima.com/castello-di-volpaia-coltassala-gran-selezione-2019.html",
          "https://volpaia.com/?jet_download=10645"
        ],
        "researched_on": "2026-09-18"
      }
    },
    "note": "Selected the higher JS score, 96 from the producer sheet, over merchant listings of 95, per owner instruction."
  }
]
$critic_data$::jsonb) as r(cellar_id text, id text, bottle text, vintage integer, ratings jsonb, note text);

-- Prevent concurrent changes between identity checks and writes.
do $lock_rows$
begin
  perform w.id from public.wines w
  join flint_critic_import r on (w.cellar_id, w.id) = (r.cellar_id, r.id)
  order by w.cellar_id, w.id for update of w;
end
$lock_rows$;

create temporary table flint_critic_plan on commit drop as
select r.*, s.highest_score,
  case
    when w.id is null then 'skipped: record missing'
    when w.status <> 'in_cellar' or w.quantity <= 0 then 'skipped: no longer in stock'
    when w.bottle is distinct from r.bottle or w.vintage is distinct from r.vintage then 'skipped: wine identity changed'
    when r.ratings is null then 'skipped: no confirmed match or rating'
    when w.critic_ratings = r.ratings and w.critic_rating = s.highest_score then 'already applied'
    when (w.critic_ratings is not null and w.critic_ratings <> r.ratings)
      or (w.critic_rating is not null and w.critic_rating <> s.highest_score)
      then 'skipped: existing critic data differs; review before replacing'
    else 'updated'
  end as result
from flint_critic_import r
left join public.wines w on (w.cellar_id, w.id) = (r.cellar_id, r.id)
cross join lateral (
  select max((entry.value->>'score')::numeric) as highest_score
  from jsonb_each(coalesce(r.ratings, '{}'::jsonb)) entry
) s;

update public.wines w
set critic_rating = p.highest_score, critic_ratings = p.ratings
from flint_critic_plan p
where (w.cellar_id, w.id) = (p.cellar_id, p.id) and p.result = 'updated';

-- Existing wines RLS/membership permissions continue to protect these columns.
-- Show all 29 decisions plus any active wines added since the export.
select p.id, p.bottle, p.vintage, w.critic_rating as saved_highest_score,
  w.critic_ratings->'wine_advocate'->>'display_score' as saved_wine_advocate,
  w.critic_ratings->'james_suckling'->>'display_score' as saved_james_suckling,
  p.result, p.note
from flint_critic_plan p
left join public.wines w on (w.cellar_id, w.id) = (p.cellar_id, p.id)
union all
select w.id, w.bottle, w.vintage, w.critic_rating,
  w.critic_ratings->'wine_advocate'->>'display_score',
  w.critic_ratings->'james_suckling'->>'display_score',
  'skipped: added since export', 'Not researched in this batch.'
from public.wines w
where w.cellar_id = '1' and w.status = 'in_cellar' and w.quantity > 0
  and not exists (select 1 from flint_critic_import r where (r.cellar_id, r.id) = (w.cellar_id, w.id))
order by bottle, vintage;

commit;
