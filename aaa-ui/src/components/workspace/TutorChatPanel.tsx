import { useEffect, useRef, useState, type FormEvent } from "react";
import type {
  ChatMessageRead,
  TutorAvatar,
  TutorTone,
} from "../../lib/apiTypes";
import { TutorMessageContent } from "./TutorMessageContent";
import { TutorSettingsMenu } from "./TutorSettingsMenu";
import { TutorThinkingIndicator } from "./TutorThinkingIndicator";

interface TutorChatPanelProps {
  sessionId: string | null;
  messages: ChatMessageRead[];
  isLoading: boolean;
  isSending: boolean;
  isUploading: boolean;
  error: string | null;
  tutorTone: TutorTone;
  tutorAvatar: TutorAvatar;
  isSavingTutorSettings?: boolean;
  onUpdateTutorSettings: (next: {
    tutor_tone: TutorTone;
    tutor_avatar: TutorAvatar;
  }) => Promise<void>;
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
        <TutorMessageContent content={message.content} isUser={isUser} />
      </div>
    </article>
  );
}

function PendingUserBubble(props: { content: string }) {
  return (
    <article className="message-bubble user" aria-label="Your message">
      <div className="bubble-header">
        <span className="bubble-role">You</span>
      </div>
      <div className="bubble-body">
        <TutorMessageContent content={props.content} isUser={true} />
      </div>
    </article>
  );
}

export function TutorChatPanel(props: TutorChatPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const [pendingUserContent, setPendingUserContent] = useState<string | null>(
    null,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBusy = props.isSending || props.isUploading;

  useEffect(() => {
    if (messagesEndRef.current !== null) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [props.messages, props.isSending, props.isUploading, pendingUserContent]);

  async function submitMessage(content: string): Promise<void> {
    if (content.length === 0 || isBusy) {
      return;
    }

    setPendingUserContent(content);
    setInputValue("");

    try {
      await props.onSend(content);
    } catch {
      setInputValue(content);
    } finally {
      setPendingUserContent(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmed = inputValue.trim();
    await submitMessage(trimmed);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const trimmed = inputValue.trim();
      submitMessage(trimmed);
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

    const uploadLabel = `Uploaded "${file.name}"`;
    setPendingUserContent(uploadLabel);

    try {
      await props.onUploadPdf(file);
    } catch {
      // Parent sets error state.
    } finally {
      setPendingUserContent(null);
    }
  }

  const columnClass = props.className
    ? `workspace-column tutor-chat-panel ${props.className}`
    : "workspace-column tutor-chat-panel";

  const showEmptyState =
    !props.isLoading &&
    props.messages.length === 0 &&
    pendingUserContent === null;

  let thinkingMode: "sending" | "uploading" = "sending";
  if (props.isUploading) {
    thinkingMode = "uploading";
  }

  return (
    <section className={columnClass} aria-label="Tutor chat">
      <div className="column-header">
        <h2 className="column-title">Tutor chat</h2>
        <TutorSettingsMenu
          tutorTone={props.tutorTone}
          tutorAvatar={props.tutorAvatar}
          disabled={props.sessionId === null}
          isSaving={props.isSavingTutorSettings === true}
          onChange={props.onUpdateTutorSettings}
        />
      </div>

      <div
        className="messages-container compact"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {props.isLoading && props.sessionId !== null && (
          <p className="column-status">Loading messages…</p>
        )}

        {showEmptyState && (
          <p className="column-empty">
            Ask a question or upload a PDF/image to start.
          </p>
        )}

        {props.messages.map((message) => (
          <TutorMessageBubble key={message.id} message={message} />
        ))}

        {pendingUserContent !== null && (
          <PendingUserBubble content={pendingUserContent} />
        )}

        {isBusy && <TutorThinkingIndicator mode={thinkingMode} />}

        <div ref={messagesEndRef} />
      </div>

      {props.error !== null && (
        <div className="column-error chat-error">
          <p className="form-error" role="alert">
            {props.error}
          </p>
          {props.sessionId !== null && (
            <button
              type="button"
              className="btn-secondary btn-retry"
              onClick={props.onRetryMessages}
            >
              Retry
            </button>
          )}
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
            accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
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
            {props.isUploading ? "Uploading…" : "Upload file"}
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
    </section>
  );
}
