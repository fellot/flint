# A bottle for this moment

Implemented October 1, 2026. This documents repository behavior, not a verified deployment.

## User flow

- The main card displays an invitation without choosing a wine or making requests.
- **Set the scene** opens the dialog without calling AI or requesting location.
- **Surprise me** requests an AI recommendation. Optional occasion and scene text
  describe mood, food, plans, company, dietary constraints or anything else relevant.
- **Near me** asks the browser for location only when a recommendation is requested.
  On denial, unsupported geolocation or timeout, the request continues without weather.
- **Choose a city** searches after an explicit search click/Enter. The user selects
  a named region/country result; ambiguous names never silently use the first match.
- **Skip weather** makes no location or weather request.
- A successful pick shows a bottle, a visible **Why this wine** explanation, meal, conversation starter, drinking
  window, optional personal journal evidence, and the actual weather context used.
  The explanation connects the bottle to the strongest supported reasons for the
  choice (food, mood, weather, taste or drinking readiness) in two or three short
  sentences. Missing context is not invented. Sommelier chat uses the same prompt
  and labels the explanation too; this does not require another AI call.
- **Another idea · AI** makes a new request excluding the previous bottle. Input
  changes clear the old plan. Closing cancels pending work; switching cellars resets
  the entire component. Mobile scrolls to a completed result.
- AI errors leave an error and retry action; no random/local recommendation is substituted.
  Stock changes only through the existing explicit consumption workflow.

## Data and selection

The authenticated server verifies membership of the requested cellar before any
inventory read, weather lookup or model call. It loads fresh stock, the user's
permitted journal evidence and My palate settings. Browser-supplied inventory and
weather are ignored. The existing occasion filter reserves sweet wines for the
sweet occasion. Personal context includes up to 80 available candidates and 80
eligible journal records; explicit learning opt-out and dismissed patterns still apply.

The shared `gpt-6-luna` service uses strict Structured Outputs and validates bottle
IDs against available candidates. Foreign, consumed and zero-stock IDs cannot drive
a recommendation. Existing maturity ranking favours the best estimated maturity tier
among model-proposed suitable wines. Journal references must use real permitted IDs.

The additional prompt combines occasion, scene, local time, weather and taste.
Weather is a soft cue: rain is not a prohibition on Champagne, and warm weather is
not a prohibition on reds. Food and explicit preferences outrank those cues. Maturity
estimates are not guarantees. The model must not infer indoor conditions, feelings,
seasonal food availability or future weather from the current weather context.

## Location and weather

Exact GPS coordinates are rounded to one decimal (roughly 11 km north/south) before
the browser sends anything; the server rounds again. No reverse-geocoding or IP-based
location fallback is used. The geocoder returns only city IDs and labels to the UI;
the server resolves the selected ID itself. City choice does not require GPS permission.

Open-Meteo receives approximate coordinates or a city-search term/ID. OpenAI receives
only a bounded weather summary, local time/timezone and optional selected city label,
never GPS coordinates or an address. No location, weather or plan is written to
Supabase or browser storage. Request bodies should not be added to application logs.
The existing OpenAI call uses `store:false`; this is a request setting, not a promise
about every provider retention policy.

Current conditions include temperature, feels-like temperature, precipitation,
wind, WMO condition code and daylight. These are approximate weather-model data,
not station observations or a forecast for a later dinner. Units, values, timezone,
known condition codes and freshness (within two hours) are validated. Missing,
stale or unavailable weather is explicitly marked; AI is instructed not to invent it.
The response includes provider source, validity and retrieval timestamps. UI labels
show the weather/time used and attribution to Open-Meteo (and GeoNames for a city).

Geolocation requires HTTPS in deployment (localhost is allowed). Normal browser or
OS restrictions can prevent access; manual city selection and skipping still work.

## Configuration

- Existing server-only `OPENAI_API_KEY`, configured in local/Vercel environments.
- No additional SQL beyond the already-required personal-palate migration.
- No extra package or key needed for Open-Meteo's personal non-commercial service.
- Optional server-only `OPEN_METEO_API_KEY` switches forecast and geocoding URLs to
  the documented `customer-` endpoints for a paid/commercial deployment. Do not use
  a `NEXT_PUBLIC_` prefix. The paid endpoints were not live-tested with a subscription.

Timeouts: browser 50 seconds, including up to 10 seconds for permission/location;
weather lookup 8 seconds total; OpenAI 22 seconds; route maximum 60 seconds.
Abort signals propagate to provider requests. Best-effort per-user in-flight
suppression and a 1.5-second cooldown are local to a server instance, not a distributed
rate limit or cost quota. Production-scale centralized limits remain future work.

## Validation

Automated tests cover authorization before provider access, request bounds, rounded
coordinates, malformed/stale weather, explicit city choices, denied location,
cancellation, fresh stock, previous-pick exclusion, safe AI IDs and prompt context.
The full 123-test suite and production build passed. Desktop/mobile fixtures verify
zero initial calls, explicit generation, city selection, failure handling and fresh
alternatives. Fixtures simulate geolocation and AI; they do not access the user's GPS.

A live Open-Meteo city lookup and forecast for the public city of Toronto succeeded.
A paid OpenAI recommendation has not been tested locally because `OPENAI_API_KEY`
is not configured in this checkout. Live recommendation quality remains to be checked
with the deployed key. No deployment was performed.

## References

- [Open-Meteo current weather API](https://open-meteo.com/en/docs)
- [Open-Meteo geocoding and city IDs](https://open-meteo.com/en/docs/geocoding-api)
- [Open-Meteo usage plans](https://open-meteo.com/en/pricing)
- [Browser geolocation permission and secure contexts](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition)
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
