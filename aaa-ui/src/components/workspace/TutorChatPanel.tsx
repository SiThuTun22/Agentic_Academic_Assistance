import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ChatMessageRead } from "../../lib/apiTypes";

interface TutorChatPanelProps {
  sessionId: string | null;
  messages: ChatMessageRead[];
  isLoading: boolean;
  isSending: boolean;
  isUploading: boolean;
  error: string | null;
  onSend: (content: string) => Promise<void>;
  onUploadPdf: (file: File) => Promise<void>;
  onRetryMessages: () => void;
  className?: string;
}

function TutorMessageBubble(props: { message: ChatMessageRead }) {
  const { message } = props;
  const isUser = message.role === "user";
  const bubbleClass = isUser
    ? "message-bubble user"
    : "message-bubble assistant";

  return (
    <article
      className={bubbleClass}
      aria-label={isUser ? "Your message" : "Tutor response"}
    >
      <div className="bubble-header">
        <span className="bubble-role">{isUser ? "You" : "Tutor"}</span>
      </div>
      <div className="bubble-body">
        <p className="bubble-text">{message.content}</p>
      </div>
    </article>
  );
}

export function TutorChatPanel(props: TutorChatPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messagesEndRef.current !== null) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [props.messages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed.length === 0 || props.sessionId === null || props.isSending) {
      return;
    }

    try {
      await props.onSend(trimmed);
      setInputValue("");
    } catch {
      // Parent sets error state; keep input for retry.
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed.length > 0 && !props.isSending && !props.isUploading) {
        props
          .onSend(trimmed)
          .then(() => {
            setInputValue("");
          })
          .catch(() => {
            // Parent sets error state; keep input for retry.
          });
      }
    }
  }

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const fileList = event.target.files;
    if (fileList === null || fileList.length === 0) {
      return;
    }

    const file = fileList[0];
    event.target.value = "";

    try {
      await props.onUploadPdf(file);
    } catch {
      // Parent sets error state.
    }
  }

  const columnClass = props.className
    ? `workspace-column tutor-chat-panel ${props.className}`
    : "workspace-column tutor-chat-panel";

  const isBusy = props.isSending || props.isUploading;

  return (
    <section className={columnClass} aria-label="Tutor chat">
      <div className="column-header">
        <h2 className="column-title">Tutor chat</h2>
      </div>

      {props.sessionId === null ? (
        <p className="column-empty">Select or create a session first.</p>
      ) : (
        <>
          <div
            className="messages-container compact"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
          >
            {props.isLoading && (
              <p className="column-status">Loading messages…</p>
            )}

            {!props.isLoading && props.messages.length === 0 && (
              <p className="column-empty">
                Ask a question or upload a PDF to get started.
              </p>
            )}

            {props.messages.map((message) => (
              <TutorMessageBubble key={message.id} message={message} />
            ))}

            <div ref={messagesEndRef} />
          </div>

          {props.error !== null && (
            <div className="column-error chat-error">
              <p className="form-error" role="alert">
                {props.error}
              </p>
              <button
                type="button"
                className="btn-secondary btn-retry"
                onClick={props.onRetryMessages}
              >
                Retry
              </button>
            </div>
          )}

          <form className="tutor-input-form" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="tutor-input">
              Message the tutor
            </label>
            <textarea
              id="tutor-input"
              className="chat-input"
              rows={3}
              placeholder="Ask a question…"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isBusy}
            />
            <div className="tutor-input-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="sr-only"
                onChange={handleFileChange}
                disabled={isBusy}
              />
              <button
                type="button"
                className="btn-secondary btn-attach"
                disabled={isBusy}
                onClick={() => fileInputRef.current?.click()}
              >
                {props.isUploading ? "Uploading…" : "Upload PDF"}
              </button>
              <button
                type="submit"
                className="btn-send"
                disabled={isBusy || inputValue.trim().length === 0}
              >
                {props.isSending ? "Tutor is thinking…" : "Send"}
              </button>
            </div>
          </form>
        </>
      )}
    </section>
  );
}
