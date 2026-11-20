# TBO Saathi

TBO Saathi is a voice-first travel consultant that speaks several Indian languages. It plans trips, compares flights and hotels, takes bookings only after you confirm them, and rebooks you when a flight is cancelled. It can also switch to a copilot mode for B2B travel agents.

It's built with Next.js 15 (App Router), TypeScript and Tailwind CSS v4. It has no WebGL and no `.vrm` model. The animated consultant is a single pre-rendered character image moved by CSS transforms, so it shows up on the first paint.

## Quick start

```bash
npm install
cp .env.example .env.local   # optional – every key is optional
npm run dev                  # http://localhost:3000
```

You don't need any API keys. Without them, Saathi uses the built-in **Smart Demo Agent** and the browser's speech engine (`SpeechRecognition` and `speechSynthesis`), and every feature still works.

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (Next.js core-web-vitals and TypeScript rules) |

## Features

- **Animated consultant stage** (`src/components/avatar/AvatarStage.tsx`). A single requestAnimationFrame loop drives five states:
  - `idle`: breathing, floating, blinking, and a parallax head tilt that follows the pointer
  - `listening`: an attentive tilt with pulse rings
  - `thinking`: a shimmer across the character plus orbiting dots
  - `speaking`: the jaw and mouth open in sync with the speech level, with head cadence and vocal pulse bars
  - `concerned`: a red alert aura, a lean and a softened smile
- **Lip-sync** (`src/lib/speech/visemes.ts`, `src/lib/speech/useVoice.ts`). Each reply is turned into a timeline of mouth shapes, one per vowel or consonant, for Latin and the Devanagari, Bengali, Tamil and Telugu scripts. Vowels set how far the mouth opens and whether the lips spread (e/i) or round (o/u). Bilabials (p/b/m) close it. Commas and full stops add pauses, and stressed syllables trigger small head nods.
  - With browser speech, the timeline is re-synced on every word-`boundary` event and learns each voice's real speed after the first sentence.
  - With cloud TTS, the timeline is stretched to the audio length and opens only as wide as the actual loudness allows.
  - Easing is faster opening than closing, and neighbouring sounds blend into each other, so the mouth doesn't bounce mechanically.
- **Micro-expressions** (`src/components/avatar/motion.ts`). Each state has its own head tilt, pitch, breathing rate and depth, small idle drift and blink cadence. Occasional double blinks and blinks during speech pauses are included.
  - While listening, Saathi gives small "mm-hm" nods.
  - When concerned, breathing turns to slower, deeper sighs, a pulsing alert frame appears and an "I'm on it" badge shows.
- **Microphone** (`useVoice().listen`).
  - Asks for mic permission explicitly and recognises speech in the selected language (`en-IN`, `hi-IN`, `ta-IN`, `te-IN` or `bn-IN`; Hinglish uses `en-IN`).
  - Shows the live transcript as you speak. With **Auto** on, the message sends itself when you stop talking. With Auto off, the transcript goes into the input box for you to review.
  - Permission denied, no microphone, no speech, network problems and unsupported browsers each show a status message that clears on its own.
  - Watchdogs end the session if recognition hasn't started after 5 s, if nothing is heard for 8 s, or after 20 s in total. If the speech engine stops responding, the app resets the mic itself, so it can never get stuck listening.
- **Languages.** English, Hindi (`hi-IN`), Hinglish, Tamil (`ta-IN`), Telugu (`te-IN`) and Bengali (`bn-IN`) are supported in the UI, the agent replies, speech recognition and speech output.
  - The reply language follows the script the user types in.
  - Voice status is known as soon as the page loads; it never shows "checking…".
- **Agent tools.** Both the LLM agents and the demo agent run the same tools in `src/lib/agent/tools.ts`: `searchFlights`, `searchHotels`, `checkAvailability`, `updateItinerary`, `bookTrip`, `handleDisruption`, `cancelBooking`, `setAgentMode` and `getWeather`.
- **Mock Indian inventory** (`src/data`), priced in INR (₹). It covers flights, transfers, weather and disruption reasons.
- **Destination knowledge base** (`src/data/destinations/`, planned by `src/lib/travel/planner.ts`). It has 28 Indian destinations, each with real named stops, local timings, hotels for each overnight base, cab tariffs, entry fees, food and practical tips.
  - Jharkhand is covered in depth: Ranchi (Hundru, Jonha and Sita Falls, Tagore Hill, Patratu Valley), Netarhat (Magnolia Point sunset, Sunrise Point, Upper and Lower Ghaghri) and Deoghar (Baidyanath Dham, Trikut ropeway, Basukinath). Deoghar is also available as a standalone trip.
  - States, regions and attractions are recognised in any supported script, e.g. "Jharkhand", "झारखंड", "নেতারহাট", "Deoghar".
  - The route is chosen by the number of nights, the traveller's interests (waterfalls, temples, heritage, beaches) and any places the user names. Naming Netarhat or Deoghar guarantees those days are included.
  - Sunrise and sunset stops are calculated for the actual date and location.
  - Multi-base trips get a hotel per base. A trip that ends somewhere else flies home from the nearest airport, e.g. Deoghar (DGH).
  - Per-vehicle costs scale to an SUV or tempo traveller for larger groups.
  - The budget meter adds up the actual itinerary items, so it always matches what's shown.
  - If you name a place the demo brain has no data for, it says so instead of inventing generic stops. With an LLM key, Claude or OpenAI can plan anywhere by supplying `customDays`, and can look places up with the `getDestinationGuide` tool.
- **Traveller memory bar.** Saathi picks up preferences from what you say in any of the six languages, such as window seat, veg or Jain meals, 4★ and above, budget, non-stop, beach or family. It applies them to its recommendations.
- **Compare tab.** Flights and hotels are shown side by side with cheapest, fastest, top-rated and best-price badges. One click puts an option into the itinerary.
- **Itinerary tab.** Shows the trip day by day with weather badges, a cost breakdown and a live budget meter.
- **Confirmation gate.** Booking, rebooking and cancelling each open a Confirm / Edit card. The tools themselves can't finish the action until you press Confirm or reply "yes", "हाँ", "ஆம்" and so on.
- **My Bookings tab.** Shows vouchers with PNR and confirmation codes, with print and download as HTML.
  - **Simulate flight cancellation** puts the avatar into `concerned`, finds a recovery flight and moves the airport pickup and hotel check-in to match. Changes apply only after you confirm.
- **B2B Agent Copilot.** Shows net price, agency markup % and client price, plus a clean English client itinerary you can print.
- **Demo chips** for a one-click hackathon run:
  - Plan Goa in Hindi (₹50k)
  - Compare Hotels
  - Make it Cheaper
  - Book it
  - Simulate Flight Cancellation
  - B2B Agent View
  - Kerala in Tamil
  - Jaipur family (EN)

## Optional cloud providers (`.env.local`)

| Variable | What it enables |
| --- | --- |
| `ANTHROPIC_API_KEY` (`ANTHROPIC_MODEL`; leave it unset for the default `claude-opus-5-5`) | Claude runs the agent loop using the same tools. It's called through the Anthropic SDK with server-side refusal fallback turned on. |
| `OPENAI_API_KEY` (`OPENAI_MODEL`) | An alternative LLM agent. It also supplies cloud TTS and STT if Sarvam isn't set. |
| `SARVAM_API_KEY` (`SARVAM_TTS_SPEAKER`) | Indian-language TTS (`bulbul`) and STT (`saarika`). |
| `BHASHINI_USER_ID` + `BHASHINI_API_KEY` (looks up the endpoint automatically), **or** `BHASHINI_INFERENCE_URL` + `BHASHINI_INFERENCE_KEY` + `BHASHINI_TTS_SERVICE_ID` | TTS through the Bhashini ULCA pipeline. |
| `PROVIDER_TIMEOUT_MS` | How long to wait for an external provider before falling back (default 25000). |

**Is the live LLM or the demo brain answering?** Every `/api/chat` turn logs a single line on the server:

```
[saathi/chat] ✅ LIVE LLM answered – anthropic (claude-opus-5-5) · 2.4s · tools: updateItinerary
[saathi/chat] ⚠️  FALLBACK → demo brain – anthropic (claude-opus-5-5) failed: insufficient credits / quota (HTTP 400) · 0.6s
[saathi/chat] ℹ️  DEMO brain answered – no LLM key configured (ANTHROPIC_API_KEY / OPENAI_API_KEY) · 0.0s
```

The same information appears in four other places:
- in the response as `answeredBy` (`mode`: live, fallback or demo, plus `provider`, `model`, `reason` and `ms`)
- in the `x-saathi-mode`, `x-saathi-answered-by` and `x-saathi-reason` response headers
- as a badge under each assistant message
- in the browser console

Empty values and placeholders such as `your-key-here` count as "not configured". Keys are only ever read on the server. `GET /api/chat` and `GET /api/speech` report which providers are configured, without revealing any key values. When a configured LLM fails, the reply carries a `fallbackReason` and the header badge changes to "Demo fallback".

The providers are tried in this order:

- **LLM:** Anthropic, then OpenAI, then the Smart Demo Agent. If an LLM call fails, that turn falls back to the demo agent.
- **TTS:** Sarvam, then Bhashini, then OpenAI, then the browser voice.

Answers to a confirmation gate ("yes" or "no") are always handled by the deterministic agent.

## Layout

```
src/app/api/chat     – agent endpoint (LLM or Smart Demo Agent → structured UI effects)
src/app/api/travel   – direct tool calls, confirmation-gate execution, read-only GET tool access
src/app/api/speech   – cloud TTS/STT hooks (Sarvam / Bhashini / OpenAI) with browser fallback
src/components       – avatar stage, chat, memory bar, gate, compare/itinerary/bookings panels
src/lib              – agent (tools, demo agent, LLM loop, phrases), travel engine, i18n, memory, speech
src/data             – cities, flights, hotels, transfers, sightseeing, weather, disruptions
public/avatar        – saathi-3d.png (consultant artwork, background removed)
```
