import { NextResponse } from "next/server";
import { runDemoAgent } from "@/lib/agent/demoAgent";
import { llmProvider, runLLMAgent } from "@/lib/agent/llm";
import { flush, newContext } from "@/lib/agent/tools";
import { detectLang, NO, YES } from "@/lib/i18n";
import { extractPreferences } from "@/lib/memory";
import type { ChatRequest, ChatResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ provider: llmProvider() ?? "demo" });
}

export async function POST(req: Request) {
  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const last = [...(body.messages ?? [])].reverse().find((m) => m.role === "user")?.text?.trim() ?? "";
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
  let provider: ChatResponse["provider"] = "demo";
  const llm = llmProvider();
  const gateAnswer = !!body.pending && (YES.test(last) || NO.test(last));

  if (llm && !gateAnswer) {
    try {
      reply = await runLLMAgent(llm, body.messages, ctx);
      provider = llm;
    } catch (err) {
      console.warn("[saathi] LLM failed, falling back to Smart Demo Agent:", err instanceof Error ? err.message : err);
      ctx = newContext({ ...base });
      reply = "";
    }
  }
  if (!reply) reply = runDemoAgent(last, ctx, added);

  const effects = flush(ctx);
  if (lang !== body.lang) effects.unshift({ type: "lang", lang });

  const res: ChatResponse = { reply, lang, effects, prefs, tools: ctx.traces, provider };
  return NextResponse.json(res);
}
