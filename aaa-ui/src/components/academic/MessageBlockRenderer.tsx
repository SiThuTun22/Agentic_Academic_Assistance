import type { MessageBlock } from "../../types";
import { getBlockClassName } from "../../lib/contentStyles";
import { ContentBadge } from "./ContentBadge";
import { MathBlock } from "./MathBlock";

interface MessageBlockRendererProps {
  block: MessageBlock;
}

export function MessageBlockRenderer(props: MessageBlockRendererProps) {
  const { block } = props;
  const blockClass = getBlockClassName(block.type);

  if (block.type === "timeline" && block.items !== undefined) {
    return (
      <div className={`message-block ${blockClass}`}>
        <ContentBadge type={block.type} customLabel={block.label} />
        <ol className="timeline-list">
          {block.items.map((item, index) => (
            <li key={`tl-${index}`}>{item}</li>
          ))}
        </ol>
      </div>
    );
  }

  if (block.type === "formula" && block.latex !== undefined) {
    return (
      <div className={`message-block ${blockClass}`}>
        <ContentBadge type={block.type} customLabel={block.label} />
        {block.content !== undefined && block.content.length > 0 && (
          <p className="block-text">{block.content}</p>
        )}
        <MathBlock latex={block.latex} label={block.label} />
      </div>
    );
  }

  if (block.type === "code") {
    return (
      <div className={`message-block ${blockClass}`}>
        <ContentBadge type={block.type} customLabel={block.label} />
        <pre className="code-block">
          <code>{block.content}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className={`message-block ${blockClass}`}>
      <ContentBadge type={block.type} customLabel={block.label} />
      {block.content !== undefined && block.content.length > 0 && (
        <p className="block-text">{block.content}</p>
      )}
    </div>
  );
}
