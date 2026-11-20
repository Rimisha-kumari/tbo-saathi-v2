import { NextResponse } from "next/server";
import { runDemoAgent } from "@/lib/agent/demoAgent";
import { runLLMAgent } from "@/lib/agent/llm";
import { flush, newContext } from "@/lib/agent/tools";
import { config, describeError, llmProvider } from "@/lib/config";
import { detectLang, NO, YES } from "@/lib/i18n";
import { extractPreferences } from "@/lib/memory";
import type { AnsweredBy, ChatRequest, ChatResponse } from "@/lib/types";

/** One unambiguous console line per turn: did the live LLM or the demo brain answer, and why? */
function logTurn(a: AnsweredBy, tools: string[]) {
  const t = `${(a.ms / 1000).toFixed(1)}s`;
  const tl = tools.length ? ` · tools: ${tools.join(", ")}` : "";
  if (a.mode === "live") console.info(`[saathi/chat] ✅ LIVE LLM answered – ${a.provider} (${a.model}) · ${t}${tl}`);
  else if (a.mode === "fallback") console.warn(`[saathi/chat] ⚠️  FALLBACK → demo brain – ${a.provider} (${a.model}) failed: ${a.reason} · ${t}${tl}`);
  else console.info(`[saathi/chat] ℹ️  DEMO brain answered – ${a.reason} · ${t}${tl}`);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Which brain is configured. Never exposes key values. */
export async function GET() {
  const provider = llmProvider();
  return NextResponse.json({
    provider: provider ?? "demo",
    model: provider === "anthropic" ? config.anthropic()?.model : provider === "openai" ? config.openai()?.model : null,
    configured: { anthropic: !!config.anthropic(), openai: !!config.openai() },
  });
}

export async function POST(req: Request) {
  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!Array.isArray(body.messages)) return NextResponse.json({ error: "messages[] required" }, { status: 400 });

  const last = [...body.messages].reverse().find((m) => m.role === "user")?.text?.trim() ?? "";
  // Reply in the language the user is writing in; Hinglish typed while Hindi is selected stays Hindi.
  const detected = detectLang(last) ?? (/^[\x00-\x7F₹]+$/.test(last) && last.split(/\s+/).length >= 4 ? "en" : null);
  const lang = detected && !(detected === "hinglish" && body.lang === "hi") ? detected : body.lang ?? "en";

  const prefs = extractPreferences(last, body.prefs ?? []);
  const added = prefs.filter((p) => !(body.prefs ?? []).some((q) => q.key === p.key));

  const base = {
    trip: body.trip ?? null, prefs, bookings: body.bookings ?? [], mode: body.mode ?? "b2c",
    markupPct: body.markupPct ?? 12, lang, pending: body.pending ?? null,
  } as const;

  let ctx = newContext({ ...base });
  let reply = "";
  const started = Date.now();
  const llm = llmProvider();
  const model = llm === "anthropic" ? config.anthropic()?.model : llm === "openai" ? config.openai()?.model : undefined;
  // Answers to the confirmation gate are always handled deterministically.
  const gateAnswer = !!body.pending && (YES.test(last) || NO.test(last));
  let answeredBy: Omit<AnsweredBy, "ms"> = { mode: "demo", provider: "demo", reason: llm ? "confirmation-gate answer (handled deterministically)" : "no LLM key configured (ANTHROPIC_API_KEY / OPENAI_API_KEY)" };

  if (llm && !gateAnswer) {
    try {
      reply = await runLLMAgent(llm, body.messages, ctx);
      if (!reply) throw new Error("empty reply from model");
      answeredBy = { mode: "live", provider: llm, model };
    } catch (err) {
      const reason = `${describeError(err)}`;
      answeredBy = { mode: "fallback", provider: llm, model, reason };
      ctx = newContext({ ...base }); // discard any partial tool effects from the failed run
      reply = "";
    }
  }
  if (!reply) reply = runDemoAgent(last, ctx, added);

  const effects = flush(ctx);
  if (lang !== body.lang) effects.unshift({ type: "lang", lang });

  const final: AnsweredBy = { ...answeredBy, ms: Date.now() - started };
  logTurn(final, ctx.traces.map((t) => t.name));
  const res: ChatResponse = {
    reply, lang, effects, prefs, tools: ctx.traces,
    provider: final.mode === "live" ? (final.provider as ChatResponse["provider"]) : "demo",
    fallbackReason: final.mode === "fallback" ? `${final.provider === "anthropic" ? "Claude" : "OpenAI"}: ${final.reason}` : undefined,
    answeredBy: final,
  };
  return NextResponse.json(res, {
    headers: {
      "x-saathi-answered-by": final.mode === "live" ? `${final.provider}:${final.model}` : "demo",
      "x-saathi-mode": final.mode,
      ...(final.reason ? { "x-saathi-reason": encodeURIComponent(final.reason) } : {}),
    },
  });
}
