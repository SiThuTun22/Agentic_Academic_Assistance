import type { ChatSessionRead } from "../../lib/apiTypes";

interface SessionSidebarProps {
  sessions: ChatSessionRead[];
  activeSessionId: string | null;
  collapsed: boolean;
  isLoading: boolean;
  error: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onRetry: () => void;
  className?: string;
}

function sessionInitial(title: string): string {
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    return "?";
  }
  return trimmed.charAt(0).toUpperCase();
}

export function SessionSidebar(props: SessionSidebarProps) {
  const isEmpty = !props.isLoading && props.sessions.length === 0;
  const newSessionClass = isEmpty
    ? "btn-new-session btn-new-session-prominent"
    : "btn-new-session";

  let columnClass = "workspace-column session-sidebar";
  if (props.collapsed) {
    columnClass = `${columnClass} session-sidebar--collapsed`;
  }
  if (props.className) {
    columnClass = `${columnClass} ${props.className}`;
  }

  if (props.collapsed) {
    return (
      <aside className={columnClass} aria-label="Chat sessions">
        <button
          type="button"
          className="sidebar-rail-btn"
          onClick={props.onNewSession}
          title="New session"
          aria-label="New session"
        >
          +
        </button>

        <ul className="session-rail-list">
          {props.sessions.map((session) => {
            const isActive = session.id === props.activeSessionId;
            const itemClass = isActive
              ? "sidebar-rail-item active"
              : "sidebar-rail-item";

            return (
              <li key={session.id}>
                <button
                  type="button"
                  className={itemClass}
                  title={session.title}
                  aria-label={session.title}
                  onClick={() => props.onSelectSession(session.id)}
                >
                  {sessionInitial(session.title)}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
    );
  }

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
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
