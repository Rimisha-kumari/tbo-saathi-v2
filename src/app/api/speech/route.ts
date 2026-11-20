import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Provider = "sarvam" | "bhashini" | "openai";

function ttsProvider(): Provider | null {
  if (process.env.SARVAM_API_KEY) return "sarvam";
  if (process.env.BHASHINI_INFERENCE_KEY && process.env.BHASHINI_INFERENCE_URL && process.env.BHASHINI_TTS_SERVICE_ID) return "bhashini";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}
function sttProvider(): Provider | null {
  if (process.env.SARVAM_API_KEY) return "sarvam";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

/** Which cloud voice providers are configured (the browser Web Speech API is always the fallback). */
export async function GET() {
  return NextResponse.json({ tts: ttsProvider(), stt: sttProvider() });
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
  try {
    if (body.action === "tts") return await tts(body);
    if (body.action === "stt") return await stt(body);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "speech failed", fallback: "browser" }, { status: 502 });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

async function tts({ text, lang }: TTSBody) {
  const provider = ttsProvider();
  const clean = text.slice(0, 1500);
  if (!provider) return NextResponse.json({ fallback: "browser" });

  if (provider === "sarvam") {
    const r = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: { "content-type": "application/json", "api-subscription-key": process.env.SARVAM_API_KEY! },
      body: JSON.stringify({ text: clean, target_language_code: lang, speaker: process.env.SARVAM_TTS_SPEAKER || "anushka", model: "bulbul:v2" }),
    });
    if (!r.ok) throw new Error(`Sarvam TTS ${r.status}`);
    const data = (await r.json()) as { audios: string[] };
    return NextResponse.json({ provider, audio: data.audios[0], mime: "audio/wav" });
  }

  if (provider === "bhashini") {
    const r = await fetch(process.env.BHASHINI_INFERENCE_URL!, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: process.env.BHASHINI_INFERENCE_KEY! },
      body: JSON.stringify({
        pipelineTasks: [{ taskType: "tts", config: { language: { sourceLanguage: lang.split("-")[0] }, serviceId: process.env.BHASHINI_TTS_SERVICE_ID, gender: "female" } }],
        inputData: { input: [{ source: clean }] },
      }),
    });
    if (!r.ok) throw new Error(`Bhashini TTS ${r.status}`);
    const data = (await r.json()) as { pipelineResponse: { audio: { audioContent: string }[] }[] };
    return NextResponse.json({ provider, audio: data.pipelineResponse[0].audio[0].audioContent, mime: "audio/wav" });
  }

  const r = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: "gpt-4o-mini-tts", voice: "shimmer", input: clean, response_format: "mp3" }),
  });
  if (!r.ok) throw new Error(`OpenAI TTS ${r.status}`);
  const audio = Buffer.from(await r.arrayBuffer()).toString("base64");
  return NextResponse.json({ provider, audio, mime: "audio/mpeg" });
}

async function stt({ audio, mime, lang }: STTBody) {
  const provider = sttProvider();
  if (!provider) return NextResponse.json({ fallback: "browser" });
  const blob = new Blob([Buffer.from(audio, "base64")], { type: mime });
  const form = new FormData();
  form.append("file", blob, `speech.${mime.includes("ogg") ? "ogg" : "webm"}`);

  if (provider === "sarvam") {
    form.append("model", "saarika:v2.5");
    form.append("language_code", lang);
    const r = await fetch("https://api.sarvam.ai/speech-to-text", { method: "POST", headers: { "api-subscription-key": process.env.SARVAM_API_KEY! }, body: form });
    if (!r.ok) throw new Error(`Sarvam STT ${r.status}`);
    const data = (await r.json()) as { transcript: string };
    return NextResponse.json({ provider, text: data.transcript });
  }

  form.append("model", "whisper-1");
  form.append("language", lang.split("-")[0]);
  const r = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: form });
  if (!r.ok) throw new Error(`OpenAI STT ${r.status}`);
  const data = (await r.json()) as { text: string };
  return NextResponse.json({ provider, text: data.text });
}
