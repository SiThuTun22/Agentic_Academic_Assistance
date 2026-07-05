import type { Components } from "react-markdown";
import Markdown from "react-markdown";

interface TutorMessageContentProps {
  content: string;
  isUser: boolean;
}

const markdownComponents: Components = {
  h1: (props) => <h3 className="bubble-md-heading" {...props} />,
  h2: (props) => <h3 className="bubble-md-heading" {...props} />,
  h3: (props) => <h3 className="bubble-md-heading" {...props} />,
  h4: (props) => <h4 className="bubble-md-subheading" {...props} />,
  h5: (props) => <h4 className="bubble-md-subheading" {...props} />,
  h6: (props) => <h4 className="bubble-md-subheading" {...props} />,
  p: (props) => <p className="bubble-md-paragraph" {...props} />,
  ul: (props) => <ul className="bubble-md-list" {...props} />,
  ol: (props) => <ol className="bubble-md-list bubble-md-list-ordered" {...props} />,
  li: (props) => <li className="bubble-md-list-item" {...props} />,
  strong: (props) => <strong className="bubble-md-strong" {...props} />,
  em: (props) => <em className="bubble-md-emphasis" {...props} />,
  hr: () => <hr className="bubble-md-hr" />,
  code: (props) => {
    const { children, className } = props;
    const isBlock = className !== undefined && className.includes("language-");
    if (isBlock) {
      return <code className="bubble-md-code-block" {...props} />;
    }
    return <code className="bubble-md-code-inline" {...props}>{children}</code>;
  },
  pre: (props) => <pre className="bubble-md-pre" {...props} />,
};

export function TutorMessageContent(props: TutorMessageContentProps) {
  if (props.isUser) {
    return <p className="bubble-text">{props.content}</p>;
  }

  return (
    <div className="bubble-markdown">
      <Markdown components={markdownComponents}>{props.content}</Markdown>
    </div>
  );
}
