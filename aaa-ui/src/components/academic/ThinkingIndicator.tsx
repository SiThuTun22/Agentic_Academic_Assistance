export function ThinkingIndicator() {
  return (
    <div className="thinking-indicator" role="status" aria-live="polite">
      <span className="thinking-label">
        <span className="thinking-icon" aria-hidden="true">
          ◉
        </span>
        AI is thinking
      </span>
      <span className="thinking-dots" aria-hidden="true">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </span>
    </div>
  );
}
