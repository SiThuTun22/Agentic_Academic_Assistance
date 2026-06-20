import type { ChatMessage } from "../../types";
import { MessageBlockRenderer } from "./MessageBlockRenderer";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble(props: MessageBubbleProps) {
  const { message } = props;
  const isUser = message.role === "user";
  const bubbleClass = isUser ? "message-bubble user" : "message-bubble assistant";

  return (
    <article className={bubbleClass} aria-label={isUser ? "Your message" : "AI tutor response"}>
      <div className="bubble-header">
        <span className="bubble-role">{isUser ? "You" : "Academic Assistant"}</span>
        <time className="bubble-time">{message.timestamp}</time>
      </div>

      <div className="bubble-body">
        <p className="bubble-text">{message.content}</p>

        {message.blocks !== undefined && message.blocks.length > 0 && (
          <div className="bubble-blocks">
            {message.blocks.map((block, index) => (
              <MessageBlockRenderer key={`block-${index}`} block={block} />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
