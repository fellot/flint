# Sommelier avatars

Open the user/cellar-name menu → **Configuration** → choose **The original** or **Copper** → **Save avatar**. Portuguese labels are included. The selection updates both the draggable home-page launcher and the companion above the chat, without resetting the conversation or its position.

## Persistence and rollout

- The existing cat remains the default. Unknown, missing or malformed values resolve to that cat.
- The selection is saved for the signed-in user in Supabase Auth `user_metadata.flint_sommelier_avatar`. It follows that account across cellars and is loaded on later page visits or sign-ins on other devices. Other already-open tabs pick it up when reloaded.
- This uses Supabase's existing [user metadata update API](https://supabase.com/docs/reference/javascript/auth-updateuser). **No SQL migration, new table, API key or AI call is required.** Deploy the application and image asset together.
- `PUT /api/account/preferences` checks origin, authenticates the caller, validates a small request containing only a known avatar ID, and calls the session client's `auth.updateUser`. It does not accept a user ID, email, custom image URL or arbitrary metadata. Other Auth metadata is preserved by the single-key merge.
- `GET /api/auth/session` returns the authenticated user ID and normalized avatar ID, not the full metadata object. Both replies use private, no-store caching.
- The client provider is keyed by user ID. Selection changes are applied only after a successful save; a failure keeps the current avatar and the editable selection. Cancel closes without saving. Avatar artwork and IDs never influence permissions or recommendation prompts.
- The chooser uses native radio controls and the existing modal focus/Escape handling. Dragging, keyboard repositioning, chat expansion and reduced-motion behavior are preserved.

## Artwork

Created 2026-10-04 with the **built-in image-generation tool**, using three user-supplied photos of Copper as identity references and the existing cat as a style reference. The photos themselves are not bundled with the website.

Final asset: `public/images/sommelier-copper.png` (transparent RGBA PNG). Existing option: `public/images/sommelier-cat.png`.

### Generation prompt

Use case: stylized-concept.
Asset type: transparent PNG character for a small draggable sommelier avatar on a burgundy-and-ivory wine cellar website.
Primary request: create a charming illustrated dog sommelier recognisably based on the SAME real dog in reference images 1–3. Reference image 4 is the existing cat sommelier: match its polished, softly painterly storybook rendering and small-screen silhouette, but create a dog rather than copying the cat's anatomy.
Subject identity: warm caramel/apricot curly and shaggy coat, floppy long rounded ears slightly darker than the face, bushy brow, dark brown expressive eyes, long soft bearded muzzle, prominent black nose. Preserve this dog's friendly, slightly inquisitive expression and long muzzle; not a generic puppy, not a short-snouted teddy bear.
Composition: one full-body seated dog, front view with slight three-quarter head turn, both floppy ears and all paws inside frame. A small ivory collar and burgundy velvet bow tie make it a sommelier. One front paw holds a small elegant stemmed glass of burgundy red wine beside the chest, like the companion cat; the other paw rests naturally. Tail curves beside its body. Upright compact silhouette with a large readable head, suited to display around 96 x 112 CSS pixels. Entire figure centred, fills about 90% of the canvas height with a little clear padding, no cropped anatomy.
Style: warm, premium, whimsical hand-painted digital illustration with tactile curly fur, softly sculpted light and clear silhouette. Natural caramel fur, dark eyes/nose, ivory and burgundy accent. Friendly, soulful adult dog, not exaggerated cartoon grin.
Background: genuinely transparent alpha, clean edges, no background, no ground, no badge, no white rectangle, no checkerboard baked into pixels. No text or logo or watermark. Portrait composition. Single character only.
Input images: 1–3 subject identity references; 4 visual style reference only. Do not include photographic background scenery or any cat features.
