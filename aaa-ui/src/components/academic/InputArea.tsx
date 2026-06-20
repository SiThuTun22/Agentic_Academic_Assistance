import type { QuickAction } from "../../types";

interface InputAreaProps {
  value: string;
  uploadedFileName: string | null;
  onChange: (value: string) => void;
  onSend: () => void;
  onFileSelect: (file: File) => void;
  onQuickAction: (actionId: string) => void;
  quickActions: QuickAction[];
  disabled: boolean;
}

export function InputArea(props: InputAreaProps) {
  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      props.onSend();
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const fileList = event.target.files;
    if (fileList === null || fileList.length === 0) {
      return;
    }
    const file = fileList[0];
    props.onFileSelect(file);
    event.target.value = "";
  }

  return (
    <div className="input-area">
      <div className="quick-actions" role="toolbar" aria-label="Quick actions">
        {props.quickActions.map((action) => (
          <button
            key={action.id}
            type="button"
            className="quick-action-btn"
            title={action.description}
            onClick={() => props.onQuickAction(action.id)}
            disabled={props.disabled}
          >
            <span aria-hidden="true">{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>

      {props.uploadedFileName !== null && (
        <div className="upload-preview card" role="status">
          <span aria-hidden="true">📎</span>
          <span>Attached: {props.uploadedFileName}</span>
        </div>
      )}

      <div className="input-row">
        <label className="sr-only" htmlFor="chat-input">
          Message the academic assistant
        </label>
        <textarea
          id="chat-input"
          className="chat-input"
          rows={3}
          placeholder="Ask a question, type LaTeX like $x^2$, paste code, or request a quiz..."
          value={props.value}
          onChange={(event) => props.onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={props.disabled}
        />

        <div className="input-actions">
          <label className="upload-btn" aria-label="Upload document">
            <span aria-hidden="true">📎</span>
            <span className="upload-label">Upload</span>
            <input
              type="file"
              className="sr-only"
              accept=".pdf,.doc,.docx,.txt,.md"
              onChange={handleFileChange}
              disabled={props.disabled}
            />
          </label>

          <button
            type="button"
            className="btn-send"
            onClick={props.onSend}
            disabled={props.disabled || props.value.trim().length === 0}
          >
            Send
          </button>
        </div>
      </div>

      <p className="input-hint">
        Supports LaTeX math ($...$), code blocks, and document uploads. Press Enter to send, Shift+Enter for new line.
      </p>
    </div>
  );
}
