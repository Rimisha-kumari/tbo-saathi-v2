/**
 * Server-side provider configuration. Every key is optional: a missing, empty or placeholder
 * value (e.g. "your-key-here") counts as "not configured", and the app falls back to the
 * Smart Demo Agent / browser Web Speech API.
 */
import "server-only";

const PLACEHOLDER = /^(your[-_ ]|<|xxx|changeme|replace|todo|sk-\.\.\.|\.\.\.)/i;

function read(name: string): string | undefined {
  const v = process.env[name]?.trim();
  if (!v || PLACEHOLDER.test(v)) return undefined;
  return v;
}

export const config = {
  anthropic: () => {
    const apiKey = read("ANTHROPIC_API_KEY");
    return apiKey ? { apiKey, model: read("ANTHROPIC_MODEL") ?? "claude-opus-5-5" } : null;
  },
  openai: () => {
    const apiKey = read("OPENAI_API_KEY");
    return apiKey ? { apiKey, model: read("OPENAI_MODEL") ?? "gpt-4o-mini", ttsModel: read("OPENAI_TTS_MODEL") ?? "gpt-4o-mini-tts", sttModel: read("OPENAI_STT_MODEL") ?? "whisper-1" } : null;
  },
  sarvam: () => {
    const apiKey = read("SARVAM_API_KEY");
    return apiKey ? { apiKey, speaker: read("SARVAM_TTS_SPEAKER") ?? "anushka", ttsModel: read("SARVAM_TTS_MODEL") ?? "bulbul:v2", sttModel: read("SARVAM_STT_MODEL") ?? "saarika:v2.5" } : null;
  },
  /**
   * Bhashini (ULCA). Two ways to configure:
   *  1. Direct: BHASHINI_INFERENCE_URL + BHASHINI_INFERENCE_KEY + BHASHINI_TTS_SERVICE_ID
   *  2. Discovery: BHASHINI_USER_ID + BHASHINI_API_KEY (the pipeline endpoint/key/service id are looked up)
   */
  bhashini: () => {
    const userId = read("BHASHINI_USER_ID");
    const apiKey = read("BHASHINI_API_KEY");
    const inferenceUrl = read("BHASHINI_INFERENCE_URL");
    const inferenceKey = read("BHASHINI_INFERENCE_KEY");
    const ttsServiceId = read("BHASHINI_TTS_SERVICE_ID");
    const direct = inferenceUrl && inferenceKey && ttsServiceId;
    const discovery = userId && apiKey;
    if (!direct && !discovery) return null;
    return {
      userId, apiKey, inferenceUrl, inferenceKey, ttsServiceId,
      pipelineId: read("BHASHINI_PIPELINE_ID") ?? "64392f96daac500b55c543cd",
      configUrl: read("BHASHINI_CONFIG_URL") ?? "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline",
    };
  },
  timeoutMs: () => Number(read("PROVIDER_TIMEOUT_MS") ?? 25000),
};

export type LLMProvider = "anthropic" | "openai";

export function llmProvider(): LLMProvider | null {
  if (config.anthropic()) return "anthropic";
  if (config.openai()) return "openai";
  return null;
}

export function ttsProvider(): "sarvam" | "bhashini" | "openai" | null {
  if (config.sarvam()) return "sarvam";
  if (config.bhashini()) return "bhashini";
  if (config.openai()) return "openai";
  return null;
}

export function sttProvider(): "sarvam" | "openai" | null {
  if (config.sarvam()) return "sarvam";
  if (config.openai()) return "openai";
  return null;
}

/** Short, secret-free description of a provider failure for logs and the UI badge. */
export function describeError(err: unknown): string {
  const status = typeof err === "object" && err && "status" in err ? (err as { status?: number }).status : undefined;
  const msg = err instanceof Error ? err.message : String(err ?? "");
  const tag = status ? ` (HTTP ${status})` : "";
  if (/credit balance is too low|insufficient[_ ]quota|exceeded your current quota|billing/i.test(msg)) return `insufficient credits / quota${tag}`;
  if (/model.*(not[_ ]found|does not exist)|not_found_error/i.test(msg) || status === 404) return `model not available${tag}`;
  if (status === 401 || status === 403) return `invalid or unauthorised API key${tag}`;
  if (status === 429) return `rate limited${tag}`;
  if (status === 529 || /overloaded/i.test(msg)) return `provider overloaded${tag}`;
  if (status && status >= 500) return `provider unavailable${tag}`;
  if (/ENOTFOUND|ECONNREFUSED|fetch failed|network/i.test(msg)) return "network error reaching the provider";
  if (err instanceof Error) {
    if (err.name === "AbortError" || err.name === "TimeoutError" || /timed? ?out/i.test(err.message)) return "request timed out";
    return (err.message.replace(/sk-[\w-]+/g, "sk-***").slice(0, 120) || "unknown error") + tag;
  }
  return "unknown error";
}

export class ProviderError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}
