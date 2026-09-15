# Flint cellar design

## Layout

Warm paper, deep olive, muted burgundy, serif headings, and a sunlit wine still life. A compact table is the default collection view. Click a column heading to sort ascending; click it again to reverse. The active arrow and accessible `aria-sort` state indicate the current order. Bottle cards remain available through the grid toggle.

The table supports wine name, country, style, vintage, drinking window, peak year, quantity, rating, location, and journal date/status sorting. Unknown numeric values stay at the end. On narrow screens the table scrolls horizontally and the wine name stays visible.

The cellar and journal share search, filters, bottle details, editing, label scanning, and manual entry. Counts come from the selected cellar's inventory. Drinking readiness uses the recorded drinking window, with peak year as a fallback. Accounts and cellar permissions use the existing Supabase session and API routes.

## Original photography

- Asset: `public/images/flint-still-life.png`
- Method: OpenAI's built-in image generation tool.
- Uses: cellar hero and authentication pages.

### Final generation prompt

Use case: photorealistic-natural. Asset type: original editorial hero photograph for Flint, a personal wine cellar website. Create a sophisticated, tactile still life photographed on analog medium-format film, landscape 3:2 composition. On a warm travertine tabletop: one dark olive glass wine bottle with a beautifully simple unmarked ivory paper label, a delicate large stemmed glass with a small pour of translucent garnet-red wine, and a naturally curved olive branch at the edge. Background a sunlit, softly textured beige plaster wall, with bold diagonal late-afternoon window shadows. Bottle and wine glass occupy the right-center and middle of image, fully visible, balanced space around them. Intimate European wine bar, elegant and quietly cinematic, warm earthy cream and olive tones, subtle film grain, deep realistic glass reflections, impeccable photographic detail. No people, no letters, no lettering, no logos, no watermark, no printed words, no UI, no borders. This will be used as a right-hand hero photograph beside a separate serif headline, with a rounded crop; preserve generous margins around bottle top and glass base.
