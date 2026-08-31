import { Scissors } from "lucide-react";

export function Monogram({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`monogram ${compact ? "monogram-compact" : ""}`} aria-label="Studio Capricho Hair">
      <span>CH</span>
      <Scissors aria-hidden="true" />
    </div>
  );
}
