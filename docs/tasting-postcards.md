# Tasting postcards

From **My tasting journal**, choose **Create tasting postcard** in a table row, a card's actions menu, or the wine's details. The action is available for consumed wines in your own journal, including wines tasted outside the cellar.

The preview uses the wine's name, vintage and origin, your own score, tasting date, and a short excerpt of your personal comment. Edit the postcard note or hide the score/date before saving. These changes apply only to the image; your journal entry stays as saved. Historical cellar ratings, critic scores, price, storage location, and other participants are not included.

Choose **Add photo** in **The moment** to include a picture of the dinner, friends, or place alongside the bottle. You can change or remove it before exporting. The whole photo fits inside the frame by default; **Fill photo frame** crops it to fill the frame instead. Preview the result before saving or sharing.

Moment photos can be JPG, PNG, or WebP, up to 10 MB. They are oriented, resized, and converted locally before rendering. The photo belongs to the current postcard draft and is discarded when you close the editor; it is not uploaded or stored in the wine record. A failed replacement keeps the previous photo available.

**Save image** downloads a 1080 × 1350 PNG. **Share image** appears when the browser supports sharing that file through the device's share sheet. Cancelling the share sheet leaves the postcard open. The preview and both actions use the same prepared image, so changes must finish rendering before saving or sharing.

Stored bottle photos are loaded through an authenticated cellar endpoint and embedded in the postcard, including photos hosted on sites that do not support browser image export. When a photo is truly unavailable, unsafe, or in an unsupported format, the postcard uses a bottle illustration suited to the wine's style. Unknown vintages appear as NV; unavailable scores and dates are omitted. Long names and notes are fitted to the card.

Postcards are rendered in the browser. There is no AI request, new database table, public journal URL, or automatic posting. They need no new configuration or migration.

Implementation: `components/TastingPostcardDialog.tsx` provides the editor, `utils/tasting-postcard.ts` creates the self-contained artwork and PNG, and `components/CellarCollection.tsx` scopes the action to the current user's journal. Stored bottle photos use `/api/wines/[id]/postcard-photo`, with the current cellar passed as `dataSource` when selected. Export uses feature-detected [native file sharing](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share).
