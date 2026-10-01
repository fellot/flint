# Wine map: origin, coverage and storage

Updated 2026-10-01. No SQL migration or map API key is required for this update.

## Which wines appear

The default **Cellar + my journal** view shows positive-quantity stock and consumed
records where the signed-in user participated (`inMyJournal`). This includes
external tastings and journal records with zero remaining stock. **In cellar** and
**My journal** filter those groups independently. Sold/gifted records and other
people's private journal participation are not included as personal tastings.

The API remains `/api/wines?dataSource=<selected cellar id>`. It authenticates and
verifies cellar membership, then attaches the acting user's journal information.
The map page cancels obsolete requests and clears old data when the cellar changes;
failed requests show a retry state rather than stale or empty-success inventory.

Counts distinguish bottle quantities from journal entries and mapped wine records.
A partial consumption can legitimately leave a stock row and a separate tasting
row of the same wine; those count as two map records, not two stock bottles.

## How locations are stored

| Field | Stored in Supabase | Purpose |
| --- | --- | --- |
| `wines.country` | Text | Country of origin |
| `wines.region` | Text | Wine region/appellation of origin |
| `wines.location` | Text linked to `cellar_storage_locations` | Physical fridge/shelf label |
| `cellar_fridges` and `cellar_storage_locations` | Managed fridge names and levels | Cellar storage management |
| Latitude/longitude | **Not stored per wine** | Derived from the local region lookup |

`utils/regionCoordinates.ts` resolves country and region text to **approximate
regional anchors**. It normalizes case, accents and punctuation, with explicit
aliases for alternative names. Matching stays within the recorded country and
prefers the most specific known phrase. It does not use fridge location, bottle
name, AI geocoding or the user's physical location.

Unknown regions can use a known country's broad anchor. These are labelled
**Country only** and marked with dashed borders; they are not winery coordinates
or exact country centroids. Unrecognized countries/origins remain visible in the
register under **Show unmapped origins**, rather than disappearing or getting a
made-up coordinate. Co-located records share a marker so one cannot hide another.

To correct a recorded origin, edit Country/Region on the wine in the cellar or
journal. If the text is correct but unsupported, add a reviewed anchor/alias in
`utils/regionCoordinates.ts`. Exact vineyard geolocation and database-managed
geographic sources would be a separate feature, requiring structured precision
and source fields; changing the tile provider alone would not supply that data.

## Map rendering and network

Leaflet/react-leaflet renders the map. Browser verification found that the old
CARTO Voyager endpoint returned ‘API key required’ images with successful image
loads. The map now uses OpenStreetMap's standard tile endpoint with visible
OpenStreetMap attribution. Local CSS markers replace the
unnecessary external default-marker image URLs. No map API credentials are read.
Tiles are requested normally by the browser, with its default caching and Referer;
no bulk fetching, offline downloading or cache bypass is added. Follow the
[OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/).
This public service has no availability guarantee; larger deployments should use
a suitable commercial or self-hosted provider. Browser/network restrictions can still stop
those requests. A tile failure shows a reload action, and the wine register stays
usable even without the base map.

The map has an explicit responsive height, resizes with its container, caps the
initial zoom when a single point is present, and leaves ordinary page scrolling
available (mouse-wheel map zoom is disabled). Clicking a marker filters the register;
**Show all** restores the current filter's full list. Origins in the register can
also focus the map. See Leaflet's [container sizing requirement](https://leafletjs.com/examples/quick-start/)
and [map methods](https://leafletjs.com/reference.html#map-fitbounds).

## Geographic data notes

Most anchors are retained from the original lookup and represent regions broadly.
New rounded anchors for Chablis, the Motovun/Istria area and Bekaa are geographic
reference points, not producer/vineyard positions:

- [Chablis geographic reference](https://www.wikidata.org/wiki/Q1058259)
- [Motovun-area reference](https://www.wikidata.org/wiki/Q1499249)
- [Bekaa Valley geographic reference](https://www.wikidata.org/wiki/Q21576015)

Pauillac currently uses the broader Médoc anchor; Morgon uses Beaujolais; Barolo
uses Langhe. The register shows both the **recorded origin** and the **map placement**
so that this reduced precision is visible. Uncertainty labels such as “likely” and
stylistic comparisons such as “Bordeaux-style” do not establish a regional point.

## Verification

`tests/wine-map.test.ts` covers personal journal inclusion, external/zero-stock
entries, exclusion of unrelated participation, country/region normalization,
country-only and unknown origins, co-located markers, counts, and independent
cellar datasets. Browser checks use labelled sample wines with real map tiles,
not production inventory. The Supabase schema and production wine rows are unchanged.
