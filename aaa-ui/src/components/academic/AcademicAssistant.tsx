import { useCallback, useState } from "react";
import type { ChatMessage, ContextPanelData, ThemeMode } from "../../types";
import {
  DEFAULT_CONTEXT,
  DEFAULT_MESSAGES,
  QUICK_ACTIONS,
  RECENT_SESSIONS,
  SAVED_RESOURCES,
  STUDY_TOPICS,
  buildAssistantReply,
} from "../../lib/academicMockData";
import { AppHeader } from "./AppHeader";
import { Sidebar } from "./Sidebar";
import { ChatArea } from "./ChatArea";
import { ContextPanel } from "./ContextPanel";

function createUserMessage(content: string): ChatMessage {
  const timestamp = new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return {
    id: crypto.randomUUID(),
    role: "user",
    content,
    timestamp,
  };
}

export function AcademicAssistant() {
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [messages, setMessages] = useState<ChatMessage[]>(DEFAULT_MESSAGES);
  const [inputValue, setInputValue] = useState<string>("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [contextData] = useState<ContextPanelData>(DEFAULT_CONTEXT);
  const [activeSessionId, setActiveSessionId] = useState<string>("s1");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [contextOpen, setContextOpen] = useState<boolean>(false);

  const simulateReply = useCallback((userText: string) => {
    setIsThinking(true);

    window.setTimeout(() => {
      const reply = buildAssistantReply(userText);
      setMessages((prev) => [...prev, reply]);
      setIsThinking(false);
    }, 1400);
  }, []);

  function handleSend(): void {
    const trimmed = inputValue.trim();
    if (trimmed.length === 0 || isThinking) {
      return;
    }

    const userMessage = createUserMessage(trimmed);
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    simulateReply(trimmed);
  }

  function handleFileSelect(file: File): void {
    setUploadedFileName(file.name);

    const uploadMessage = createUserMessage(
      `Uploaded document: "${file.name}" — please analyze and provide feedback.`,
    );
    setMessages((prev) => [...prev, uploadMessage]);
    simulateReply("document upload feedback");
  }

  function handleQuickAction(actionId: string): void {
    if (isThinking) {
      return;
    }

    let prompt = "";

    if (actionId === "explain") {
      prompt = "Explain this concept step by step with examples.";
    } else if (actionId === "quiz") {
      prompt = "Generate a quiz based on my recent study topics.";
    } else if (actionId === "plan") {
      prompt = "Create a study plan for today based on my knowledge gaps.";
    } else if (actionId === "upload") {
      const fileInput = document.querySelector<HTMLInputElement>(
        'input[type="file"]',
      );
      if (fileInput !== null) {
        fileInput.click();
      }
      return;
    }

    const userMessage = createUserMessage(prompt);
    setMessages((prev) => [...prev, userMessage]);
    simulateReply(prompt);
  }

  function handleSuggestedQuestion(question: string): void {
    if (isThinking) {
      return;
    }

    setInputValue(question);
    const userMessage = createUserMessage(question);
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    simulateReply(question);
  }

  function handleNewSession(): void {
    setMessages([]);
    setInputValue("");
    setUploadedFileName(null);
    setActiveSessionId(crypto.randomUUID());
    setSidebarOpen(false);
  }

  function handleSelectSession(sessionId: string): void {
    setActiveSessionId(sessionId);
    setSidebarOpen(false);

    if (sessionId === "s1") {
      setMessages(DEFAULT_MESSAGES);
    }
  }

  const rootClass = `academic-app theme-${themeMode}`;

  return (
    <div className={rootClass}>
      <AppHeader themeMode={themeMode} onThemeChange={setThemeMode} />

      <div className="academic-layout">
        <Sidebar
          topics={STUDY_TOPICS}
          resources={SAVED_RESOURCES}
          sessions={RECENT_SESSIONS}
          analytics={contextData.analytics}
          activeSessionId={activeSessionId}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNewSession={handleNewSession}
          onSelectSession={handleSelectSession}
        />

        <ChatArea
          messages={messages}
          inputValue={inputValue}
          uploadedFileName={uploadedFileName}
          isThinking={isThinking}
          quickActions={QUICK_ACTIONS}
          onInputChange={setInputValue}
          onSend={handleSend}
          onFileSelect={handleFileSelect}
          onQuickAction={handleQuickAction}
          onToggleSidebar={() => setSidebarOpen(true)}
          onToggleContext={() => setContextOpen(true)}
        />

        <ContextPanel
          data={contextData}
          isOpen={contextOpen}
          onClose={() => setContextOpen(false)}
          onSuggestedQuestion={handleSuggestedQuestion}
        />
      </div>
    </div>
  );
}
