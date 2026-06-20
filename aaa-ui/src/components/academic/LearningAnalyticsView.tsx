import type { LearningAnalytics } from "../../types";

interface LearningAnalyticsViewProps {
  analytics: LearningAnalytics;
}

export function LearningAnalyticsView(props: LearningAnalyticsViewProps) {
  const { analytics } = props;
  const masteryPercent = Math.round(
    (analytics.topicsMastered / analytics.topicsTotal) * 100,
  );

  return (
    <section className="analytics-panel" aria-label="Learning analytics">
      <h3 className="panel-section-title">
        <span aria-hidden="true">📊</span> Learning Progress
      </h3>

      <div className="analytics-grid">
        <div className="analytics-stat">
          <span className="stat-label">Session</span>
          <div className="progress-bar" role="progressbar" aria-valuenow={analytics.sessionProgress} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="progress-fill session"
              style={{ width: `${analytics.sessionProgress}%` }}
            />
          </div>
          <span className="stat-value">{analytics.sessionProgress}%</span>
        </div>

        <div className="analytics-stat">
          <span className="stat-label">Mastery</span>
          <div className="progress-bar" role="progressbar" aria-valuenow={masteryPercent} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="progress-fill mastery"
              style={{ width: `${masteryPercent}%` }}
            />
          </div>
          <span className="stat-value">
            {analytics.topicsMastered}/{analytics.topicsTotal} topics
          </span>
        </div>

        <div className="analytics-mini-stats">
          <div className="mini-stat">
            <span className="mini-stat-icon" aria-hidden="true">⏱</span>
            <span className="mini-stat-text">{analytics.focusMinutes} min focus</span>
          </div>
          <div className="mini-stat">
            <span className="mini-stat-icon" aria-hidden="true">🔥</span>
            <span className="mini-stat-text">{analytics.streakDays}-day streak</span>
          </div>
        </div>
      </div>
    </section>
  );
}
