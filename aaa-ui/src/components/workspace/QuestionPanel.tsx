import { useState, type FormEvent } from "react";
import type { SubmissionRead } from "../../lib/apiTypes";

interface QuestionPanelProps {
  sessionId: string | null;
  submission: SubmissionRead | null;
  activeKeyword: string | null;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (
    questionText: string,
    referenceText: string | null,
  ) => Promise<void>;
  onSelectKeyword: (keyword: string | null) => void;
  className?: string;
}

export function QuestionPanel(props: QuestionPanelProps) {
  const [questionText, setQuestionText] = useState("");
  const [referenceText, setReferenceText] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmedQuestion = questionText.trim();
    if (trimmedQuestion.length === 0 || props.sessionId === null) {
      return;
    }

    const trimmedReference = referenceText.trim();
    try {
      await props.onSubmit(
        trimmedQuestion,
        trimmedReference.length > 0 ? trimmedReference : null,
      );
      setQuestionText("");
      setReferenceText("");
    } catch {
      // Parent sets error state; keep form values for retry.
    }
  }

  const columnClass = props.className
    ? `workspace-column question-panel ${props.className}`
    : "workspace-column question-panel";

  return (
    <section className={columnClass} aria-label="Question reader">
      <div className="column-header">
        <h2 className="column-title">Question</h2>
        {props.activeKeyword !== null && (
          <span className="keyword-badge">
            Active keyword: {props.activeKeyword}
          </span>
        )}
      </div>

      {props.sessionId === null ? (
        <p className="column-empty">Select or create a session first.</p>
      ) : (
        <>
          <form className="question-form" onSubmit={handleSubmit}>
            <label className="form-label" htmlFor="question-text">
              Question text
            </label>
            <textarea
              id="question-text"
              className="form-textarea"
              rows={4}
              placeholder="Paste or type the question you want to study…"
              value={questionText}
              onChange={(event) => setQuestionText(event.target.value)}
              disabled={props.isSubmitting}
            />

            <label className="form-label" htmlFor="reference-text">
              Reference text (optional)
            </label>
            <textarea
              id="reference-text"
              className="form-textarea"
              rows={6}
              placeholder="Optional passage, code snippet, or context…"
              value={referenceText}
              onChange={(event) => setReferenceText(event.target.value)}
              disabled={props.isSubmitting}
            />

            {props.error !== null && (
              <p className="form-error" role="alert">
                {props.error}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={props.isSubmitting || questionText.trim().length === 0}
            >
              {props.isSubmitting ? "Submitting…" : "Submit question"}
            </button>
          </form>

          {props.submission !== null && (
            <div className="submission-display card">
              <h3 className="panel-section-title">Submitted question</h3>
              <p className="submission-question">
                {props.submission.question_text}
              </p>

              {props.submission.reference_text !== null && (
                <>
                  <h4 className="submission-label">Reference</h4>
                  <pre className="submission-reference">
                    {props.submission.reference_text}
                  </pre>
                </>
              )}

              <h4 className="submission-label">Keywords</h4>
              {props.submission.keywords.length === 0 ? (
                <p className="column-empty inline">
                  Key terms from your question will appear here for deep-dive
                  chat.
                </p>
              ) : (
                <div className="keyword-chips" role="list">
                  {props.submission.keywords.map((keyword) => {
                    const isActive = props.activeKeyword === keyword;
                    const chipClass = isActive
                      ? "keyword-chip active"
                      : "keyword-chip";

                    return (
                      <button
                        key={keyword}
                        type="button"
                        role="listitem"
                        className={chipClass}
                        onClick={() =>
                          props.onSelectKeyword(isActive ? null : keyword)
                        }
                      >
                        {keyword}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
