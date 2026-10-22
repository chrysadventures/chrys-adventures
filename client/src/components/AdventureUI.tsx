import { Sparkles } from "lucide-react";

/** Decorative motion is deliberately restricted to navigation screens. */
export function AmbientWorld() {
  return <div className="adventure-ambient" aria-hidden="true">
    <span className="ambient-cloud ambient-cloud-one" />
    <span className="ambient-cloud ambient-cloud-two" />
    <Sparkles className="ambient-spark ambient-spark-one" />
    <Sparkles className="ambient-spark ambient-spark-two" />
  </div>;
}

export function AdventureProgress({ value, total, label, cyber = false }: {
  value: number; total: number; label: string; cyber?: boolean;
}) {
  const safeTotal = Math.max(1, total);
  const safeValue = Math.min(safeTotal, Math.max(0, value));
  return <div className={`adventure-progress ${cyber ? "adventure-progress-cyber" : ""}`}>
    <div className="adventure-progress-label"><span>{label}</span><span>{safeValue} / {safeTotal}</span></div>
    <div className="adventure-progress-track" role="progressbar" aria-label={label}
      aria-valuemin={0} aria-valuemax={safeTotal} aria-valuenow={safeValue}>
      <span style={{ width: `${safeValue / safeTotal * 100}%` }} />
    </div>
  </div>;
}
