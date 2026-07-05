interface TutorThinkingIndicatorProps {
  mode: "sending" | "uploading";
}

function getLabel(mode: TutorThinkingIndicatorProps["mode"]): string {
  if (mode === "uploading") {
    return "Analyzing document…";
  }
  return "Tutor is thinking…";
}

export function TutorThinkingIndicator(props: TutorThinkingIndicatorProps) {
  const label = getLabel(props.mode);

  return (
    <article
      className="message-bubble assistant thinking-indicator"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="bubble-header">
        <span className="bubble-role">Tutor</span>
      </div>
      <div className="thinking-indicator-body">
        <span className="thinking-label">{label}</span>
        <span className="thinking-dots" aria-hidden="true">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </span>
      </div>
    </article>
  );
}
