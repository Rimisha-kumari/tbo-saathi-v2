import { NextResponse } from "next/server";
import { config, describeError, markProviderDown, markProviderUp, ProviderError, providerDown, sttChain, sttProvider, ttsChain, ttsProvider } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cloud voice hooks. Responses with `{ fallback: "browser" }` tell the client to use the Web Speech
 * API (speechSynthesis / SpeechRecognition) instead – that happens whenever no server speech key
 * is configured or a provider call fails.
 */

const SUPPORTED = ["en-IN", "hi-IN", "ta-IN", "te-IN", "bn-IN"];
const MAX_TEXT = 1500;
const MAX_AUDIO_B64 = 8 * 1024 * 1024; // ~6 MB of audio

const browser = (reason?: string, status = 200) => NextResponse.json({ fallback: "browser", reason }, { status });

/** Which cloud voice providers are configured (the browser is always the fallback). */
export async function GET() {
  const b = config.bhashini();
  return NextResponse.json({
    tts: ttsProvider(),
    stt: sttProvider(),
    cooling: (["sarvam", "bhashini", "openai"] as const).flatMap((p) => {
      const d = providerDown(`tts:${p}`) ?? providerDown(`stt:${p}`);
      return d ? [{ provider: p, ...d }] : [];
    }),
    configured: {
      sarvam: !!config.sarvam(),
      bhashini: b ? (b.inferenceUrl && b.inferenceKey && b.ttsServiceId ? "direct" : "discovery") : false,
      openai: !!config.openai(),
    },
    languages: SUPPORTED,
  });
}

interface TTSBody { action: "tts"; text: string; lang: string }
interface STTBody { action: "stt"; audio: string; mime: string; lang: string }

export async function POST(req: Request) {
  let body: TTSBody | STTBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const lang = SUPPORTED.includes(body.lang) ? body.lang : "en-IN";
  try {
    if (body.action === "tts") {
      const text = String(body.text ?? "").trim().slice(0, MAX_TEXT);
      if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });
      return await tts(text, lang);
    }
    if (body.action === "stt") {
      if (!body.audio || body.audio.length > MAX_AUDIO_B64) return NextResponse.json({ error: "audio missing or too large" }, { status: 400 });
      return await stt(body.audio, body.mime || "audio/webm", lang);
    }
  } catch (e) {
    const reason = describeError(e);
    console.warn(`[saathi] speech provider failed (${reason}) – client will use the browser voice`);
    return browser(reason, 502);
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

const timeout = () => AbortSignal.timeout(Math.min(20000, config.timeoutMs()));

/* ───────────────────────────── Text-to-speech ───────────────────────────── */

async function tts(text: string, lang: string) {
  const chain = ttsChain();
  if (!chain.length) return browser(config.sarvam() || config.bhashini() || config.openai() ? "server voices cooling down after errors" : "no server TTS key configured");
  const errors: string[] = [];
  // Sarvam → Bhashini → OpenAI; a credit/quota failure cools that provider down and tries the next.
  for (const provider of chain) {
    try {
      const out = await ttsWith(provider, text, lang);
      markProviderUp(`tts:${provider}`);
      return NextResponse.json({ provider, ...out });
    } catch (e) {
      const reason = describeError(e);
      markProviderDown(`tts:${provider}`, reason);
      // an account out of credits can't transcribe either
      if (/credits|quota|unauthori/i.test(reason) && provider !== "bhashini") markProviderDown(`stt:${provider}`, reason);
      errors.push(`${provider}: ${reason}`);
      console.warn(`[saathi/speech] ⚠️  TTS ${provider} failed (${reason}) – trying next / browser voice`);
    }
  }
  return browser(errors.join(" · "), 502);
}

async function ttsWith(provider: "sarvam" | "bhashini" | "openai", text: string, lang: string): Promise<{ audio: string; mime: string }> {
  if (provider === "sarvam") {
    const cfg = config.sarvam()!;
    const r = await fetch(`${cfg.baseUrl}/text-to-speech`, {
      method: "POST",
      headers: { "content-type": "application/json", "api-subscription-key": cfg.apiKey },
      body: JSON.stringify({ text, target_language_code: lang, speaker: cfg.speaker, model: cfg.ttsModel }),
      signal: timeout(),
    });
    if (!r.ok) throw new ProviderError(`Sarvam TTS HTTP ${r.status}: ${(await r.text().catch(() => "")).slice(0, 200)}`, r.status);
    const data = (await r.json()) as { audios?: string[] };
    if (!data.audios?.[0]) throw new ProviderError("Sarvam TTS returned no audio");
    return { audio: data.audios[0], mime: "audio/wav" };
  }

  if (provider === "bhashini") return { audio: await bhashiniTTS(text, lang.split("-")[0]), mime: "audio/wav" };

  const cfg = config.openai()!;
  const r = await fetch(`${cfg.baseUrl}/audio/speech`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({ model: cfg.ttsModel, voice: "shimmer", input: text, response_format: "mp3" }),
    signal: timeout(),
  });
  if (!r.ok) throw new ProviderError(`OpenAI TTS HTTP ${r.status}: ${(await r.text().catch(() => "")).slice(0, 200)}`, r.status);
  return { audio: Buffer.from(await r.arrayBuffer()).toString("base64"), mime: "audio/mpeg" };
}

/* Bhashini: either a directly configured inference endpoint, or ULCA pipeline discovery (cached per language). */
const bhashiniCache = new Map<string, { url: string; key: string; serviceId: string; at: number }>();

async function bhashiniEndpoint(language: string) {
  const b = config.bhashini()!;
  if (b.inferenceUrl && b.inferenceKey && b.ttsServiceId) return { url: b.inferenceUrl, key: b.inferenceKey, serviceId: b.ttsServiceId };
  const hit = bhashiniCache.get(language);
  if (hit && Date.now() - hit.at < 3600_000) return hit;
  const r = await fetch(b.configUrl, {
    method: "POST",
    headers: { "content-type": "application/json", userID: b.userId!, ulcaApiKey: b.apiKey! },
    body: JSON.stringify({ pipelineTasks: [{ taskType: "tts", config: { language: { sourceLanguage: language } } }], pipelineRequestConfig: { pipelineId: b.pipelineId } }),
    signal: timeout(),
  });
  if (!r.ok) throw new ProviderError(`Bhashini config HTTP ${r.status}`, r.status);
  const d = (await r.json()) as {
    pipelineInferenceAPIEndPoint?: { callbackUrl: string; inferenceApiKey: { value: string } };
    pipelineResponseConfig?: { config: { serviceId: string }[] }[];
  };
  const url = d.pipelineInferenceAPIEndPoint?.callbackUrl;
  const key = d.pipelineInferenceAPIEndPoint?.inferenceApiKey?.value;
  const serviceId = d.pipelineResponseConfig?.[0]?.config?.[0]?.serviceId;
  if (!url || !key || !serviceId) throw new ProviderError("Bhashini returned no TTS service for this language");
  const entry = { url, key, serviceId, at: Date.now() };
  bhashiniCache.set(language, entry);
  return entry;
}

async function bhashiniTTS(text: string, language: string) {
  const ep = await bhashiniEndpoint(language);
  const r = await fetch(ep.url, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: ep.key },
    body: JSON.stringify({
      pipelineTasks: [{ taskType: "tts", config: { language: { sourceLanguage: language }, serviceId: ep.serviceId, gender: "female" } }],
      inputData: { input: [{ source: text }] },
    }),
    signal: timeout(),
  });
  if (!r.ok) throw new ProviderError(`Bhashini TTS HTTP ${r.status}`, r.status);
  const data = (await r.json()) as { pipelineResponse?: { audio?: { audioContent: string }[] }[] };
  const audio = data.pipelineResponse?.[0]?.audio?.[0]?.audioContent;
  if (!audio) throw new ProviderError("Bhashini TTS returned no audio");
  return audio;
}

/* ───────────────────────────── Speech-to-text ───────────────────────────── */

async function stt(audioB64: string, mime: string, lang: string) {
  const chain = sttChain();
  if (!chain.length) return browser(config.sarvam() || config.openai() ? "server transcription cooling down after errors" : "no server STT key configured");
  const errors: string[] = [];
  for (const provider of chain) {
    try {
      const text = await sttWith(provider, audioB64, mime, lang);
      markProviderUp(`stt:${provider}`);
      return NextResponse.json({ provider, text });
    } catch (e) {
      const reason = describeError(e);
      markProviderDown(`stt:${provider}`, reason);
      if (/credits|quota|unauthori/i.test(reason)) markProviderDown(`tts:${provider}`, reason);
      errors.push(`${provider}: ${reason}`);
      console.warn(`[saathi/speech] ⚠️  STT ${provider} failed (${reason})`);
    }
  }
  return browser(errors.join(" · "), 502);
}

async function sttWith(provider: "sarvam" | "openai", audioB64: string, mime: string, lang: string): Promise<string> {
  const ext = mime.includes("ogg") ? "ogg" : mime.includes("mp4") ? "m4a" : mime.includes("wav") ? "wav" : "webm";
  const form = new FormData();
  form.append("file", new Blob([Buffer.from(audioB64, "base64")], { type: mime }), `speech.${ext}`);

  if (provider === "sarvam") {
    const cfg = config.sarvam()!;
    form.append("model", cfg.sttModel);
    form.append("language_code", lang);
    const r = await fetch(`${cfg.baseUrl}/speech-to-text`, { method: "POST", headers: { "api-subscription-key": cfg.apiKey }, body: form, signal: timeout() });
    if (!r.ok) throw new ProviderError(`Sarvam STT HTTP ${r.status}: ${(await r.text().catch(() => "")).slice(0, 200)}`, r.status);
    return ((await r.json()) as { transcript?: string }).transcript ?? "";
  }

  const cfg = config.openai()!;
  form.append("model", cfg.sttModel);
  form.append("language", lang.split("-")[0]);
  const r = await fetch(`${cfg.baseUrl}/audio/transcriptions`, { method: "POST", headers: { authorization: `Bearer ${cfg.apiKey}` }, body: form, signal: timeout() });
  if (!r.ok) throw new ProviderError(`OpenAI STT HTTP ${r.status}: ${(await r.text().catch(() => "")).slice(0, 200)}`, r.status);
  return ((await r.json()) as { text?: string }).text ?? "";
}
