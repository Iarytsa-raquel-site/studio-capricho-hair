import { Scissors } from "lucide-react";

export function Monogram({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`monogram ${compact ? "monogram-compact" : ""}`} aria-label="Studio Capricho Hair">
      <span>CH</span>
      <Scissors aria-hidden="true" />
    </div>
  );
}

export function StudioWordmark() {
  return (
    <div className="studio-wordmark" aria-label="Studio Capricho Hair">
      <span className="studio-wordmark-script">Studio</span>
      <span className="studio-wordmark-name">Capricho Hair</span>
      <i aria-hidden="true"><Scissors /></i>
    </div>
  );
}
