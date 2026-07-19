import { useRef, useState, type FocusEvent, type MouseEvent } from "react";
import type { ChatSessionRead } from "../../lib/apiTypes";
import { UserProfileMenu } from "./UserProfileMenu";

interface SessionSidebarProps {
  sessions: ChatSessionRead[];
  activeSessionId: string | null;
  collapsed: boolean;
  isLoading: boolean;
  error: string | null;
  deletingSessionId: string | null;
  displayName: string;
  email: string;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onNewSession: () => void;
  onRetry: () => void;
  onLogout: () => void;
  className?: string;
}

interface RailExpandState {
  sessionId: string;
  top: number;
  left: number;
}

function sessionInitial(title: string): string {
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    return "?";
  }
  return trimmed.charAt(0).toUpperCase();
}

function TrashIcon() {
  return (
    <svg
      className="session-trash-icon"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M6 7h12v2H6V7zm2 3h2v8H8v-8zm3 0h2v8h-2v-8zm3 0h2v8h-2v-8zM9 4h6l1 2h4v2H4V6h4l1-2z"
      />
    </svg>
  );
}

export function SessionSidebar(props: SessionSidebarProps) {
  const [railExpand, setRailExpand] = useState<RailExpandState | null>(null);
  const closeTimerRef = useRef<number | null>(null);

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

  function clearCloseTimer(): void {
    if (closeTimerRef.current === null) {
      return;
    }
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  }

  function openRailExpand(sessionId: string, element: HTMLElement): void {
    clearCloseTimer();
    const rect = element.getBoundingClientRect();
    const next: RailExpandState = {
      sessionId: sessionId,
      top: rect.top,
      left: rect.left,
    };
    setRailExpand(next);
  }

  function scheduleCloseRailExpand(): void {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setRailExpand(null);
      closeTimerRef.current = null;
    }, 120);
  }

  function closeRailExpandNow(): void {
    clearCloseTimer();
    setRailExpand(null);
  }

  const profile = (
    <UserProfileMenu
      displayName={props.displayName}
      email={props.email}
      onLogout={props.onLogout}
      compact={props.collapsed}
    />
  );

  if (props.collapsed) {
    return (
      <aside className={columnClass} aria-label="Chat sessions">
        <div className="session-sidebar-main">
          <button
            type="button"
            className="sidebar-rail-btn"
            onClick={props.onNewSession}
            title="New chat"
            aria-label="New chat"
          >
            +
          </button>

          <ul className="session-rail-list">
            {props.sessions.map((session) => {
              const isActive = session.id === props.activeSessionId;
              const isDeleting = session.id === props.deletingSessionId;
              const isExpanded =
                railExpand !== null && railExpand.sessionId === session.id;

              let rowClass = "session-rail-row";
              if (isActive) {
                rowClass = `${rowClass} active`;
              }
              if (isExpanded) {
                rowClass = `${rowClass} is-expanded`;
              }

              let cardClass = "session-rail-card";
              if (isActive) {
                cardClass = `${cardClass} active`;
              }
              if (isExpanded) {
                cardClass = `${cardClass} is-expanded`;
              }

              let cardStyle: { top?: number; left?: number } | undefined;
              if (isExpanded && railExpand !== null) {
                cardStyle = {
                  top: railExpand.top,
                  left: railExpand.left,
                };
              }

              return (
                <li
                  key={session.id}
                  className={rowClass}
                  onMouseEnter={(event: MouseEvent<HTMLLIElement>) => {
                    openRailExpand(session.id, event.currentTarget);
                  }}
                  onMouseLeave={scheduleCloseRailExpand}
                  onFocus={(event: FocusEvent<HTMLLIElement>) => {
                    openRailExpand(session.id, event.currentTarget);
                  }}
                  onBlur={(event: FocusEvent<HTMLLIElement>) => {
                    const next = event.relatedTarget;
                    if (next instanceof Node && event.currentTarget.contains(next)) {
                      return;
                    }
                    scheduleCloseRailExpand();
                  }}
                >
                  <div
                    className={cardClass}
                    style={cardStyle}
                    onMouseEnter={clearCloseTimer}
                    onMouseLeave={scheduleCloseRailExpand}
                  >
                    <button
                      type="button"
                      className="session-rail-select"
                      title={session.title}
                      aria-label={session.title}
                      disabled={isDeleting}
                      onClick={() => props.onSelectSession(session.id)}
                    >
                      <span className="session-rail-initial" aria-hidden="true">
                        {sessionInitial(session.title)}
                      </span>
                      <span className="session-rail-title">{session.title}</span>
                    </button>
                    <button
                      type="button"
                      className="session-delete-btn session-delete-btn--rail"
                      title={`Delete ${session.title}`}
                      aria-label={`Delete ${session.title}`}
                      disabled={isDeleting}
                      onClick={() => {
                        props.onDeleteSession(session.id);
                        closeRailExpandNow();
                      }}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="session-sidebar-footer">{profile}</div>
      </aside>
    );
  }

  return (
    <aside className={columnClass} aria-label="Chat sessions">
      <div className="session-sidebar-main">
        <div className="column-header">
          <h2 className="column-title">Sessions</h2>
        </div>

        <button
          type="button"
          className={newSessionClass}
          onClick={props.onNewSession}
          title="New chat"
        >
          <span aria-hidden="true">+</span>
          <span className="btn-new-session-label">New chat</span>
        </button>

        {props.isLoading && (
          <p className="column-status">Loading sessions…</p>
        )}

        {props.error !== null && (
          <div className="column-error">
            <p className="form-error" role="alert">
              {props.error}
            </p>
            <button
              type="button"
              className="btn-secondary btn-retry"
              onClick={props.onRetry}
            >
              Retry
            </button>
          </div>
        )}

        {isEmpty && props.error === null && (
          <p className="column-empty">
            No chats yet. Ask a question or upload a file to start.
          </p>
        )}

        <ul className="session-list">
          {props.sessions.map((session) => {
            const isActive = session.id === props.activeSessionId;
            const isDeleting = session.id === props.deletingSessionId;
            const itemClass = isActive
              ? "session-item active card"
              : "session-item card";

            return (
              <li key={session.id} className="session-row">
                <div className={itemClass}>
                  <button
                    type="button"
                    className="session-select-btn"
                    disabled={isDeleting}
                    onClick={() => props.onSelectSession(session.id)}
                  >
                    <span className="session-title">{session.title}</span>
                  </button>
                  <button
                    type="button"
                    className="session-delete-btn"
                    title={`Delete ${session.title}`}
                    aria-label={`Delete ${session.title}`}
                    disabled={isDeleting}
                    onClick={() => props.onDeleteSession(session.id)}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="session-sidebar-footer">{profile}</div>
    </aside>
  );
}
