import { useEffect, useRef } from "react";
import type { ChatMessage } from "../../types";
import { MessageBubble } from "./MessageBubble";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { InputArea } from "./InputArea";
import type { QuickAction } from "../../types";

interface ChatAreaProps {
  messages: ChatMessage[];
  inputValue: string;
  uploadedFileName: string | null;
  isThinking: boolean;
  quickActions: QuickAction[];
  onInputChange: (value: string) => void;
  onSend: () => void;
  onFileSelect: (file: File) => void;
  onQuickAction: (actionId: string) => void;
  onToggleSidebar: () => void;
  onToggleContext: () => void;
}

export function ChatArea(props: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current !== null) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [props.messages, props.isThinking]);

  return (
    <main className="chat-area" aria-label="Academic tutor chat">
      <header className="chat-header">
        <div className="chat-header-left">
          <button
            type="button"
            className="icon-btn mobile-only"
            aria-label="Open sidebar"
            onClick={props.onToggleSidebar}
          >
            ☰
          </button>
          <div>
            <h1 className="chat-title">Academic Assistant</h1>
            <p className="chat-subtitle">
              AI tutor for studying, research, and problem-solving
            </p>
          </div>
        </div>
        <button
          type="button"
          className="icon-btn mobile-only"
          aria-label="Open context panel"
          onClick={props.onToggleContext}
        >
          ◫
        </button>
      </header>

      <div className="messages-container" role="log" aria-live="polite" aria-relevant="additions">
        {props.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {props.isThinking && <ThinkingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      <InputArea
        value={props.inputValue}
        uploadedFileName={props.uploadedFileName}
        onChange={props.onInputChange}
        onSend={props.onSend}
        onFileSelect={props.onFileSelect}
        onQuickAction={props.onQuickAction}
        quickActions={props.quickActions}
        disabled={props.isThinking}
      />
    </main>
  );
}
