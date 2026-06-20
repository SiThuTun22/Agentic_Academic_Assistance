import type { ContextPanelData } from "../../types";
import { MathBlock } from "./MathBlock";

interface ContextPanelProps {
  data: ContextPanelData;
  isOpen: boolean;
  onClose: () => void;
  onSuggestedQuestion: (question: string) => void;
}

function getStatusLabel(status: "mastered" | "learning" | "gap"): string {
  if (status === "mastered") {
    return "Mastered";
  }
  if (status === "learning") {
    return "In Progress";
  }
  return "Needs Review";
}

export function ContextPanel(props: ContextPanelProps) {
  const panelClass = props.isOpen ? "context-panel open" : "context-panel";

  return (
    <>
      {props.isOpen && (
        <button
          type="button"
          className="overlay"
          aria-label="Close context panel"
          onClick={props.onClose}
        />
      )}

      <aside className={panelClass} aria-label="Study context and suggestions">
        <div className="context-header">
          <h2 className="context-title">Context Panel</h2>
          <button
            type="button"
            className="icon-btn mobile-only"
            aria-label="Close context panel"
            onClick={props.onClose}
          >
            ✕
          </button>
        </div>

        <div className="context-body">
          <section className="context-section card">
            <h3 className="panel-section-title">
              <span aria-hidden="true">🗺</span> Concept Map
            </h3>
            <p className="active-concept">{props.data.activeConcept}</p>
            <ul className="concept-map">
              {props.data.conceptMap.map((node) => (
                <li key={node.id} className={`concept-node ${node.status}`}>
                  <span className="concept-status-icon" aria-hidden="true">
                    {node.status === "mastered" ? "✓" : node.status === "learning" ? "◐" : "○"}
                  </span>
                  <span className="concept-label">{node.label}</span>
                  <span className="concept-status">{getStatusLabel(node.status)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="context-section card">
            <h3 className="panel-section-title">
              <span aria-hidden="true">ƒ</span> Relevant Formulas
            </h3>
            {props.data.formulas.map((formula, index) => (
              <MathBlock key={`formula-${index}`} latex={formula.latex} label={formula.label} />
            ))}
          </section>

          <section className="context-section card proactive-section">
            <h3 className="panel-section-title">
              <span aria-hidden="true">💡</span> Proactive Suggestions
            </h3>
            <ul className="suggestion-list">
              {props.data.proactiveSuggestions.map((suggestion) => (
                <li key={suggestion.id} className="proactive-suggestion">
                  <span className="suggestion-icon" aria-hidden="true">
                    {suggestion.icon}
                  </span>
                  <span>{suggestion.text}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="context-section card">
            <h3 className="panel-section-title">
              <span aria-hidden="true">⚠</span> Knowledge Gaps
            </h3>
            <ul className="gap-list">
              {props.data.knowledgeGaps.map((gap) => (
                <li key={gap.id} className={`gap-item ${gap.level}`}>
                  <span className="gap-indicator" aria-hidden="true">●</span>
                  <span>{gap.topic}</span>
                  <span className="gap-level">{gap.level === "weak" ? "Weak" : "Moderate"}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="context-section card">
            <h3 className="panel-section-title">
              <span aria-hidden="true">📋</span> Study Plan
            </h3>
            <ul className="study-plan-list">
              {props.data.studyPlan.map((item) => (
                <li key={item.id} className={item.completed ? "plan-item done" : "plan-item"}>
                  <span className="plan-check" aria-hidden="true">
                    {item.completed ? "✓" : "○"}
                  </span>
                  <span className="plan-task">{item.task}</span>
                  <span className="plan-time">~{item.durationMinutes}m</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="context-section card">
            <h3 className="panel-section-title">
              <span aria-hidden="true">📌</span> Study Tips
            </h3>
            <ul className="tips-list">
              {props.data.studyTips.map((tip, index) => (
                <li key={`tip-${index}`}>{tip}</li>
              ))}
            </ul>
          </section>

          <section className="context-section card">
            <h3 className="panel-section-title">
              <span aria-hidden="true">❓</span> Suggested Questions
            </h3>
            <div className="suggested-questions">
              {props.data.suggestedQuestions.map((question, index) => (
                <button
                  key={`sq-${index}`}
                  type="button"
                  className="suggested-question-btn"
                  onClick={() => props.onSuggestedQuestion(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}
