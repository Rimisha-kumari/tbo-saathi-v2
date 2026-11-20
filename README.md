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
- **Lip-sync** (`src/lib/speech/useVoice.ts`). The mouth follows real audio loudness when cloud TTS is playing. With browser speech, it follows word-boundary events and a syllable rhythm. If no voice exists for the language, the mouth is timed to the text instead.
- **Languages.** English, Hindi (`hi-IN`), Hinglish, Tamil (`ta-IN`), Telugu (`te-IN`) and Bengali (`bn-IN`) are supported in the UI, the agent replies, speech recognition and speech output.
  - The reply language follows the script the user types in.
  - Voice status is known as soon as the page loads; it never shows "checking…".
- **Agent tools.** Both the LLM agents and the demo agent run the same tools in `src/lib/agent/tools.ts`: `searchFlights`, `searchHotels`, `checkAvailability`, `updateItinerary`, `bookTrip`, `handleDisruption`, `cancelBooking`, `setAgentMode` and `getWeather`.
- **Mock Indian inventory** (`src/data`), priced in INR (₹). It covers flights, hotels, transfers, sightseeing, weather and disruption reasons.
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
| `ANTHROPIC_API_KEY` (`ANTHROPIC_MODEL`, default `claude-opus-5-5`) | Claude runs the agent loop using the same tools. It's called through the Anthropic SDK with server-side refusal fallback turned on. |
| `OPENAI_API_KEY` (`OPENAI_MODEL`) | An alternative LLM agent. It also supplies cloud TTS and STT if Sarvam isn't set. |
| `SARVAM_API_KEY` (`SARVAM_TTS_SPEAKER`) | Indian-language TTS (`bulbul`) and STT (`saarika`). |
| `BHASHINI_INFERENCE_URL`, `BHASHINI_INFERENCE_KEY`, `BHASHINI_TTS_SERVICE_ID` (+ `BHASHINI_USER_ID`, `BHASHINI_API_KEY`) | TTS through the Bhashini ULCA pipeline. |

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
