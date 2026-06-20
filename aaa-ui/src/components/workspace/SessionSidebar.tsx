import type { ChatSessionRead } from "../../lib/apiTypes";

interface SessionSidebarProps {
  sessions: ChatSessionRead[];
  activeSessionId: string | null;
  isLoading: boolean;
  error: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onRetry: () => void;
  className?: string;
}

function formatTone(tone: ChatSessionRead["tutor_tone"]): string {
  if (tone === "strict_academic") {
    return "Strict";
  }
  return "Socratic";
}

export function SessionSidebar(props: SessionSidebarProps) {
  const isEmpty = !props.isLoading && props.sessions.length === 0;
  const newSessionClass = isEmpty
    ? "btn-new-session btn-new-session-prominent"
    : "btn-new-session";

  const columnClass = props.className
    ? `workspace-column session-sidebar ${props.className}`
    : "workspace-column session-sidebar";

  return (
    <aside className={columnClass} aria-label="Chat sessions">
      <div className="column-header">
        <h2 className="column-title">Sessions</h2>
      </div>

      <button
        type="button"
        className={newSessionClass}
        onClick={props.onNewSession}
      >
        <span aria-hidden="true">+</span> New session
      </button>

      {props.isLoading && (
        <p className="column-status">Loading sessions…</p>
      )}

      {props.error !== null && (
        <div className="column-error">
          <p className="form-error" role="alert">
            {props.error}
          </p>
          <button type="button" className="btn-secondary btn-retry" onClick={props.onRetry}>
            Retry
          </button>
        </div>
      )}

      {isEmpty && props.error === null && (
        <p className="column-empty">
          No sessions yet. Create your first session to start studying.
        </p>
      )}

      <ul className="session-list">
        {props.sessions.map((session) => {
          const isActive = session.id === props.activeSessionId;
          const itemClass = isActive
            ? "session-item active card"
            : "session-item card";

          return (
            <li key={session.id}>
              <button
                type="button"
                className={itemClass}
                onClick={() => props.onSelectSession(session.id)}
              >
                <span className="session-title">{session.title}</span>
                <span className="session-meta">
                  {formatTone(session.tutor_tone)} · {session.tutor_avatar}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
