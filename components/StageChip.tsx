/** The tracker's status as the team wrote it, coloured by what it means (matching the sheet's dropdown chips). */
const TONE: Record<string, string> = {
  "Waiting for reply": "wait",
  "Follow-up pending": "wait",
  Connected: "conn",
  "Meeting scheduled": "meet",
  "Meeting done": "meet",
  "Data to be sent": "data",
  "Due diligence": "data",
  Interested: "data",
  "On hold": "hold",
  Converted: "won",
  "Not interested": "lost",
  "Do not contact": "lost",
  Inactive: "idle",
};

export function StageChip({ stage, raw }: { stage: string | null; raw?: string }) {
  const label = (raw?.trim() || stage || "Unsorted").replace(/\s+/g, " ");
  return (
    <span className={`stage stage-${TONE[stage ?? ""] ?? "idle"}`} title={stage && raw && raw.trim() !== stage ? `Counted as: ${stage}` : undefined}>
      {label.length > 28 ? label.slice(0, 27) + "…" : label}
    </span>
  );
}
