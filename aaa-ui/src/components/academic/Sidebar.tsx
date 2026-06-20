import type {
  RecentSession,
  SavedResource,
  StudyTopic,
} from "../../types";
import { LearningAnalyticsView } from "./LearningAnalyticsView";
import type { LearningAnalytics } from "../../types";

interface SidebarProps {
  topics: StudyTopic[];
  resources: SavedResource[];
  sessions: RecentSession[];
  analytics: LearningAnalytics;
  activeSessionId: string;
  isOpen: boolean;
  onClose: () => void;
  onNewSession: () => void;
  onSelectSession: (sessionId: string) => void;
}

export function Sidebar(props: SidebarProps) {
  const sidebarClass = props.isOpen ? "sidebar open" : "sidebar";

  return (
    <>
      {props.isOpen && (
        <button
          type="button"
          className="overlay"
          aria-label="Close sidebar"
          onClick={props.onClose}
        />
      )}

      <aside className={sidebarClass} aria-label="Study navigation">
        <div className="sidebar-header">
          <h2 className="sidebar-title">Study Hub</h2>
          <button
            type="button"
            className="icon-btn mobile-only"
            aria-label="Close sidebar"
            onClick={props.onClose}
          >
            ✕
          </button>
        </div>

        <button type="button" className="btn-new-session" onClick={props.onNewSession}>
          <span aria-hidden="true">+</span> New Study Session
        </button>

        <section className="sidebar-section">
          <h3 className="section-heading">Study Topics</h3>
          <ul className="topic-list">
            {props.topics.map((topic) => (
              <li key={topic.id} className="topic-item card">
                <div className="topic-row">
                  <span className="topic-icon" aria-hidden="true">
                    {topic.icon}
                  </span>
                  <div className="topic-info">
                    <span className="topic-name">{topic.name}</span>
                    <span className="topic-time">~{topic.estimatedMinutes} min left</span>
                  </div>
                  <span className="topic-progress-label">{topic.progress}%</span>
                </div>
                <div
                  className="progress-bar thin"
                  role="progressbar"
                  aria-valuenow={topic.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${topic.name} progress`}
                >
                  <div
                    className="progress-fill topic"
                    style={{ width: `${topic.progress}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="sidebar-section">
          <h3 className="section-heading">Saved Resources</h3>
          <ul className="resource-list">
            {props.resources.map((resource) => (
              <li key={resource.id}>
                <button type="button" className="resource-item card">
                  <span className="resource-icon" aria-hidden="true">
                    {resource.type === "pdf" ? "📄" : resource.type === "link" ? "🔗" : "📝"}
                  </span>
                  <span className="resource-info">
                    <span className="resource-title">{resource.title}</span>
                    <span className="resource-date">{resource.updatedAt}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="sidebar-section">
          <h3 className="section-heading">Recent Sessions</h3>
          <ul className="session-list">
            {props.sessions.map((session) => {
              const isActive = session.id === props.activeSessionId;
              const itemClass = isActive ? "session-item active card" : "session-item card";

              return (
                <li key={session.id}>
                  <button
                    type="button"
                    className={itemClass}
                    onClick={() => props.onSelectSession(session.id)}
                  >
                    <span className="session-title">{session.title}</span>
                    <span className="session-meta">
                      {session.subject} · {session.lastActive}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <LearningAnalyticsView analytics={props.analytics} />
      </aside>
    </>
  );
}
