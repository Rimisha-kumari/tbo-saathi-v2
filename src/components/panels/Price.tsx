import { inr } from "@/lib/format";
import { clientPrice } from "@/lib/travel/engine";
import type { Mode } from "@/lib/types";

/** Shows a single price for travellers, or net vs client (with markup) for agents. */
export default function Price({ net, mode, markupPct, suffix, big }: { net: number; mode: Mode; markupPct: number; suffix?: string; big?: boolean }) {
  if (mode === "b2b") {
    return (
      <div className="text-right leading-tight">
        <div className={`${big ? "text-base" : "text-[13px]"} font-bold text-violet-200`}>{inr(clientPrice(net, markupPct))}</div>
        <div className="text-[10px] text-white/45">
          net {inr(net)} · +{markupPct}%
        </div>
      </div>
    );
  }
  return (
    <div className="text-right leading-tight">
      <div className={`${big ? "text-base" : "text-[13px]"} font-bold text-white`}>{inr(net)}</div>
      {suffix && <div className="text-[10px] text-white/45">{suffix}</div>}
    </div>
  );
}
