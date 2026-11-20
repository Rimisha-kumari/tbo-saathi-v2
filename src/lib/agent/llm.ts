/**
 * Optional cloud LLM agents. Both run the same tool implementations as the Smart Demo
 * Agent, so the UI receives identical structured effects whichever brain is answering.
 */
import Anthropic from "@anthropic-ai/sdk";
import { cityName } from "@/data/cities";
import { config, ProviderError, type LLMProvider } from "@/lib/config";
import { costOf } from "@/lib/travel/engine";
import { LANGS } from "@/lib/i18n";
import type { ChatTurn } from "@/lib/types";
import { runTool, TOOL_DEFS, type ToolContext } from "./tools";

const MAX_STEPS = 6;

function systemPrompt(ctx: ToolContext) {
  const lang = LANGS.find((l) => l.id === ctx.lang)!;
  const trip = ctx.trip
    ? {
        origin: cityName(ctx.trip.origin), destination: cityName(ctx.trip.destination), startDate: ctx.trip.startDate,
        nights: ctx.trip.nights, travellers: ctx.trip.travellers, budget: ctx.trip.budget,
        flight: ctx.trip.flight?.flightNo, hotel: ctx.trip.hotel?.name, total: costOf(ctx.trip).total,
      }
    : null;
  return [
    "You are Saathi, a warm, concise Indian travel consultant for TBO (B2B travel distribution). You plan, compare, book and rescue trips using the provided tools, which are backed by live-like Indian inventory priced in INR (₹).",
    `Reply ONLY in ${lang.label}${ctx.lang === "hinglish" ? " (Hindi written in Roman script, mixed naturally with English)" : ` (${lang.native} script)`}. Keep replies to 2–4 short spoken-style sentences: they are read aloud by a voice avatar. No markdown, no bullet lists.`,
    "Always use tools rather than inventing flights, hotels or prices. Use updateItinerary to create/modify the plan (it also builds the day-by-day itinerary and budget). Use searchFlights/searchHotels when the user wants to compare options.",
    "STRICT CONFIRMATION GATE: bookTrip, handleDisruption and cancelBooking only open a confirmation card. Never say a booking, rebooking or cancellation is complete – ask the user to press Confirm.",
    "Factor in the traveller's remembered preferences automatically and mention them briefly when relevant.",
    ctx.mode === "b2b"
      ? `The user is a travel AGENT (B2B copilot mode). Agency markup is ${ctx.markupPct}%. Mention net vs client price when quoting.`
      : "The user is a traveller (B2C).",
    `Remembered preferences: ${ctx.prefs.map((p) => p.label).join(", ") || "none yet"}.`,
    `Current trip: ${trip ? JSON.stringify(trip) : "none"}.`,
    `Bookings: ${ctx.bookings.map((b) => `${b.ref} (${b.status})`).join(", ") || "none"}.`,
    `Today is ${new Date().toISOString().slice(0, 10)}. Default origin is Delhi if the user doesn't say.`,
  ].join("\n");
}

/* ─────────────────────────── Anthropic (Claude) ─────────────────────────── */

async function runAnthropic(history: ChatTurn[], ctx: ToolContext): Promise<string> {
  const cfg = config.anthropic();
  if (!cfg) throw new ProviderError("ANTHROPIC_API_KEY not configured");
  const client = new Anthropic({ apiKey: cfg.apiKey, timeout: config.timeoutMs(), maxRetries: 1 });
  const tools: Anthropic.Beta.BetaTool[] = TOOL_DEFS.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema as Anthropic.Beta.BetaTool.InputSchema,
  }));
  const messages: Anthropic.Beta.BetaMessageParam[] = history.slice(-12).map((m) => ({ role: m.role, content: m.text }));
  while (messages.length && messages[0].role !== "user") messages.shift();

  for (let step = 0; step < MAX_STEPS; step++) {
    const response = await client.beta.messages.create({
      model: cfg.model,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: systemPrompt(ctx),
      tools,
      messages,
    });

    if (response.stop_reason === "refusal") throw new Error("Model declined the request");

    const toolUses = response.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
    if (response.stop_reason !== "tool_use" || toolUses.length === 0) {
      return response.content
        .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
        .map((b) => b.text)
        .join(" ")
        .trim();
    }

    messages.push({ role: "assistant", content: response.content as Anthropic.Beta.BetaContentBlockParam[] });
    const results: Anthropic.Beta.BetaToolResultBlockParam[] = toolUses.map((tu) => {
      const result = runTool(tu.name, (tu.input ?? {}) as Record<string, unknown>, ctx);
      const isError = typeof result === "object" && result !== null && "error" in result;
      return { type: "tool_result", tool_use_id: tu.id, content: JSON.stringify(result), is_error: isError };
    });
    messages.push({ role: "user", content: results });
  }
  throw new Error("Tool loop exceeded");
}

/* ─────────────────────────── OpenAI (optional hook) ─────────────────────────── */

interface OAIMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
}

async function runOpenAI(history: ChatTurn[], ctx: ToolContext): Promise<string> {
  const cfg = config.openai();
  if (!cfg) throw new ProviderError("OPENAI_API_KEY not configured");
  const messages: OAIMessage[] = [
    { role: "system", content: systemPrompt(ctx) },
    ...history.slice(-12).map((m) => ({ role: m.role, content: m.text }) as OAIMessage),
  ];
  const tools = TOOL_DEFS.map((t) => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.input_schema } }));
  for (let step = 0; step < MAX_STEPS; step++) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({ model: cfg.model, messages, tools, tool_choice: "auto" }),
      signal: AbortSignal.timeout(config.timeoutMs()),
    });
    if (!res.ok) throw new ProviderError(`OpenAI HTTP ${res.status}`, res.status);
    const data = (await res.json()) as { choices: { message: OAIMessage }[] };
    const msg = data.choices[0].message;
    if (!msg.tool_calls?.length) return (msg.content ?? "").trim();
    messages.push(msg);
    for (const call of msg.tool_calls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        args = {};
      }
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(runTool(call.function.name, args, ctx)) });
    }
  }
  throw new Error("Tool loop exceeded");
}

export async function runLLMAgent(provider: LLMProvider, history: ChatTurn[], ctx: ToolContext) {
  return provider === "anthropic" ? runAnthropic(history, ctx) : runOpenAI(history, ctx);
}
