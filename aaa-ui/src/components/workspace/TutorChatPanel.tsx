import { useEffect, useRef, useState, type FormEvent } from "react";
import type {
  ChatMessageRead,
  TutorAvatar,
  TutorTone,
} from "../../lib/apiTypes";
import { fetchMessageSpeechUrl } from "../../lib/api";
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
  onUploadPdf: (file: File, question: string) => Promise<void>;
  onOpenDocument: (documentId: string) => Promise<void>;
  currentDocumentId?: string | null;
  onRetryMessages: () => void;
  className?: string;
}

function EarIcon() {
  return (
    <svg
      className="speech-ear-icon"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M12 2a7 7 0 0 0-7 7v4a3 3 0 0 0 3 3h1v-2H8a1 1 0 0 1-1-1V9a5 5 0 0 1 10 0v7a3 3 0 0 1-5.2 2.05L11 17.2V13h2v3.1A1 1 0 0 0 15 16V9a3 3 0 0 0-3-7z"
      />
    </svg>
  );
}

function TutorMessageBubble(props: {
  message: ChatMessageRead;
  isPlaying: boolean;
  isLoadingSpeech: boolean;
  onSpeak: (messageId: string) => void;
  onOpenDocument: (documentId: string) => Promise<void>;
  currentDocumentId?: string | null;
}) {
  const { message } = props;
  const isUser = message.role === "user";
  const bubbleClass = isUser
    ? "message-bubble user"
    : "message-bubble assistant";
  const documentId = message.document_id;
  const documentFilename = message.document_filename;
  const hasFile =
    documentId !== null &&
    documentId !== undefined &&
    documentFilename !== null &&
    documentFilename !== undefined;
  let fileChipClass = "bubble-file-chip";
  if (hasFile && documentId === props.currentDocumentId) {
    fileChipClass = `${fileChipClass} is-active`;
  }

  let speechLabel = "Play tutor reply";
  if (props.isLoadingSpeech) {
    speechLabel = "Loading speech";
  } else if (props.isPlaying) {
    speechLabel = "Stop speech";
  }

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
        {hasFile && (
          <div className="bubble-file">
            <button
              type="button"
              className={fileChipClass}
              aria-label={`Open ${documentFilename}`}
              onClick={() => {
                void props.onOpenDocument(documentId);
              }}
            >
              {documentFilename}
            </button>
          </div>
        )}
      </div>
      {!isUser && (
        <div className="bubble-speech">
          <button
            type="button"
            className={
              props.isPlaying || props.isLoadingSpeech
                ? "speech-ear-button is-active"
                : "speech-ear-button"
            }
            aria-label={speechLabel}
            title={speechLabel}
            onClick={() => props.onSpeak(message.id)}
          >
            <EarIcon />
          </button>
        </div>
      )}
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speakGenerationRef = useRef(0);
  const speechCacheRef = useRef<Map<string, string>>(new Map());
  const prefetchingRef = useRef<Set<string>>(new Set());
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [pausedMessageId, setPausedMessageId] = useState<string | null>(null);
  const [loadingSpeechId, setLoadingSpeechId] = useState<string | null>(null);

  const isBusy = props.isSending || props.isUploading;

  function stopSpeech(): void {
    speakGenerationRef.current = speakGenerationRef.current + 1;
    const audio = audioRef.current;
    if (audio !== null) {
      audio.pause();
      audio.src = "";
    }
    audioRef.current = null;
    setPlayingMessageId(null);
    setPausedMessageId(null);
    setLoadingSpeechId(null);
  }

  function pauseSpeech(messageId: string): void {
    const audio = audioRef.current;
    if (audio !== null) {
      audio.pause();
    }
    setPlayingMessageId(null);
    setPausedMessageId(messageId);
    setLoadingSpeechId(null);
  }

  async function ensureSpeechUrl(
    sessionId: string,
    messageId: string,
  ): Promise<string> {
    const cached = speechCacheRef.current.get(messageId);
    if (cached !== undefined) {
      return cached;
    }
    const objectUrl = await fetchMessageSpeechUrl(sessionId, messageId);
    const already = speechCacheRef.current.get(messageId);
    if (already !== undefined) {
      URL.revokeObjectURL(objectUrl);
      return already;
    }
    speechCacheRef.current.set(messageId, objectUrl);
    return objectUrl;
  }

  async function handleSpeak(messageId: string): Promise<void> {
    if (loadingSpeechId === messageId) {
      stopSpeech();
      return;
    }
    if (playingMessageId === messageId) {
      pauseSpeech(messageId);
      return;
    }
    const pausedAudio = audioRef.current;
    if (pausedMessageId === messageId && pausedAudio !== null) {
      setPlayingMessageId(messageId);
      setPausedMessageId(null);
      try {
        await pausedAudio.play();
      } catch {
        stopSpeech();
      }
      return;
    }
    const sessionId = props.sessionId;
    if (sessionId === null) {
      return;
    }
    stopSpeech();
    const spokenMessage = props.messages.find((item) => item.id === messageId);
    if (spokenMessage !== undefined && spokenMessage.role === "assistant") {
      const bubbleAvatar = spokenMessage.tutor_avatar;
      if (
        bubbleAvatar !== null &&
        bubbleAvatar !== undefined &&
        bubbleAvatar !== props.tutorAvatar
      ) {
        void props.onUpdateTutorSettings({
          tutor_tone: props.tutorTone,
          tutor_avatar: bubbleAvatar,
        });
      }
    }
    const generation = speakGenerationRef.current;
    setLoadingSpeechId(messageId);
    try {
      const objectUrl = await ensureSpeechUrl(sessionId, messageId);
      if (speakGenerationRef.current !== generation) {
        return;
      }
      const audio = new Audio(objectUrl);
      audioRef.current = audio;
      audio.onended = () => {
        stopSpeech();
      };
      setLoadingSpeechId(null);
      setPlayingMessageId(messageId);
      await audio.play();
    } catch {
      if (speakGenerationRef.current === generation) {
        stopSpeech();
      }
    }
  }

  useEffect(() => {
    if (messagesEndRef.current !== null) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [props.messages, props.isSending, props.isUploading, pendingUserContent]);

  useEffect(() => {
    stopSpeech();
  }, [props.sessionId]);

  useEffect(() => {
    const sessionId = props.sessionId;
    if (sessionId === null) {
      return;
    }
    for (const message of props.messages) {
      if (message.role !== "assistant") {
        continue;
      }
      if (speechCacheRef.current.has(message.id)) {
        continue;
      }
      if (prefetchingRef.current.has(message.id)) {
        continue;
      }
      prefetchingRef.current.add(message.id);
      const messageId = message.id;
      void ensureSpeechUrl(sessionId, messageId).finally(() => {
        prefetchingRef.current.delete(messageId);
      });
    }
  }, [props.messages, props.sessionId]);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio !== null) {
        audio.pause();
        audio.src = "";
      }
      const cachedUrls = speechCacheRef.current.values();
      for (const objectUrl of cachedUrls) {
        URL.revokeObjectURL(objectUrl);
      }
      speechCacheRef.current.clear();
    };
  }, []);

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

    const trimmedQuestion = inputValue.trim();
    let pendingLabel = `Uploaded "${file.name}"`;
    if (trimmedQuestion.length > 0) {
      pendingLabel = trimmedQuestion;
    }
    setPendingUserContent(pendingLabel);

    try {
      await props.onUploadPdf(file, trimmedQuestion);
      if (trimmedQuestion.length > 0) {
        setInputValue("");
      }
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
          <TutorMessageBubble
            key={message.id}
            message={message}
            isPlaying={playingMessageId === message.id}
            isLoadingSpeech={loadingSpeechId === message.id}
            onSpeak={handleSpeak}
            onOpenDocument={props.onOpenDocument}
            currentDocumentId={props.currentDocumentId}
          />
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
