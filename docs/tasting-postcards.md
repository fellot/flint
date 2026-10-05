# Tasting postcards

From **My tasting journal**, choose **Create tasting postcard** in a table row, a card's actions menu, or the wine's details. The action is available for consumed wines in your own journal, including wines tasted outside the cellar.

The preview uses the wine's name, vintage and origin, your own score, tasting date, and a short excerpt of your personal comment. Edit the postcard note or hide the score/date before saving. These changes apply only to the image; your journal entry stays as saved. Historical cellar ratings, critic scores, price, storage location, and other participants are not included.

**Save image** downloads a 1080 × 1350 PNG. **Share image** appears when the browser supports sharing that file through the device's share sheet. Cancelling the share sheet leaves the postcard open. The preview and both actions use the same prepared image, so changes must finish rendering before saving or sharing.

When a bottle photo is missing or its host does not allow image export, the postcard uses a bottle illustration suited to the wine's style. Unknown vintages appear as NV; unavailable scores and dates are omitted. Long names and notes are fitted to the card.

Postcards are rendered in the browser. There is no AI request, new database table, public journal URL, or automatic posting. They need no new configuration or migration.

Implementation: `components/TastingPostcardDialog.tsx` provides the editor, `utils/tasting-postcard.ts` creates the self-contained artwork and PNG, and `components/CellarCollection.tsx` scopes the action to the current user's journal. Export uses [CORS-approved images](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image) and feature-detected [native file sharing](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share).
