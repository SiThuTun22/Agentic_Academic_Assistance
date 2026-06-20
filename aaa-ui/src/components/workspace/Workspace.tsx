import { useCallback, useEffect, useState } from "react";
import {
  ApiRequestError,
  checkHealth,
  createMessage,
  createSession,
  createSubmission,
  listMessages,
  listSessions,
} from "../../lib/api";
import type {
  ChatMessageRead,
  ChatSessionRead,
  SubmissionRead,
} from "../../lib/apiTypes";
import { useAuth } from "../../context/AuthContext";
import type { ThemeMode } from "../../types";
import {
  getActiveSessionId,
  getInitialThemeMode,
  getStoredMobileTab,
  getStoredSubmission,
  setActiveSessionId,
  setStoredMobileTab,
  setStoredSubmission,
  setStoredThemeMode,
  type MobileTab,
} from "../../lib/workspaceStorage";
import { AppHeader } from "../academic/AppHeader";
import { MobileTabBar } from "./MobileTabBar";
import { NewSessionModal, type NewSessionFormData } from "./NewSessionModal";
import { QuestionPanel } from "./QuestionPanel";
import { SessionSidebar } from "./SessionSidebar";
import { TutorChatPanel } from "./TutorChatPanel";

function formatTone(tone: ChatSessionRead["tutor_tone"]): string {
  if (tone === "strict_academic") {
    return "Strict academic";
  }
  return "Socratic";
}

function formatAvatar(avatar: ChatSessionRead["tutor_avatar"]): string {
  if (avatar === "male") {
    return "Male tutor";
  }
  return "Female tutor";
}

function getMobileColumnClass(tab: MobileTab, column: MobileTab): string {
  if (tab === column) {
    return "";
  }
  return "hidden-mobile";
}

export function Workspace() {
  const { user, logout } = useAuth();
  const [themeMode, setThemeMode] = useState<ThemeMode>(() =>
    getInitialThemeMode(),
  );

  const [sessions, setSessions] = useState<ChatSessionRead[]>([]);
  const [activeSessionId, setActiveSessionIdState] = useState<string | null>(
    null,
  );
  const [messages, setMessages] = useState<ChatMessageRead[]>([]);
  const [currentSubmission, setCurrentSubmission] =
    useState<SubmissionRead | null>(null);
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);

  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [submissionSubmitting, setSubmissionSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [messageSending, setMessageSending] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [activeMobileTab, setActiveMobileTabState] = useState<MobileTab>(() =>
    getStoredMobileTab(),
  );
  const [healthBannerDismissed, setHealthBannerDismissed] = useState(false);
  const [backendUnavailable, setBackendUnavailable] = useState(false);

  const activeSession =
    sessions.find((session) => session.id === activeSessionId) ?? null;

  const setActiveMobileTab = useCallback((tab: MobileTab) => {
    setActiveMobileTabState(tab);
    setStoredMobileTab(tab);
  }, []);

  const selectSession = useCallback(
    (sessionId: string, mobileTab: MobileTab = "question") => {
      setActiveSessionIdState(sessionId);
      setActiveSessionId(sessionId);
      setActiveMobileTab(mobileTab);
    },
    [setActiveMobileTab],
  );

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    setSessionsError(null);

    try {
      const result = await listSessions();
      setSessions(result);
      return result;
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : "Failed to load sessions.";
      setSessionsError(message);
      return [];
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (sessionId: string) => {
    setMessagesLoading(true);
    setMessagesError(null);

    try {
      const result = await listMessages(sessionId);
      setMessages(result);
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : "Failed to load messages.";
      setMessagesError(message);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    setStoredThemeMode(themeMode);
  }, [themeMode]);

  useEffect(() => {
    checkHealth()
      .then(() => {
        setBackendUnavailable(false);
      })
      .catch(() => {
        setBackendUnavailable(true);
      });
  }, []);

  useEffect(() => {
    loadSessions().then((result) => {
      if (result.length === 0) {
        return;
      }

      const storedSessionId = getActiveSessionId();
      const storedExists =
        storedSessionId !== null &&
        result.some((session) => session.id === storedSessionId);

      if (storedExists && storedSessionId !== null) {
        selectSession(storedSessionId, getStoredMobileTab());
      } else {
        selectSession(result[0].id, getStoredMobileTab());
      }
    });
  }, [loadSessions, selectSession]);

  useEffect(() => {
    if (activeSessionId === null) {
      setMessages([]);
      setCurrentSubmission(null);
      setActiveKeyword(null);
      return;
    }

    setActiveKeyword(null);
    setCurrentSubmission(getStoredSubmission(activeSessionId));
    loadMessages(activeSessionId);
  }, [activeSessionId, loadMessages]);

  function handleSelectSession(sessionId: string): void {
    selectSession(sessionId, "question");
  }

  async function handleCreateSession(data: NewSessionFormData): Promise<void> {
    setModalSubmitting(true);
    setModalError(null);

    try {
      const created = await createSession(data);
      setSessions((prev) => [created, ...prev]);
      selectSession(created.id, "question");
      setIsModalOpen(false);
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : "Failed to create session.";
      setModalError(message);
    } finally {
      setModalSubmitting(false);
    }
  }

  async function handleSubmitQuestion(
    questionText: string,
    referenceText: string | null,
  ): Promise<void> {
    if (activeSessionId === null) {
      return;
    }

    setSubmissionSubmitting(true);
    setSubmissionError(null);

    try {
      const submission = await createSubmission(activeSessionId, {
        question_text: questionText,
        reference_text: referenceText,
      });
      setCurrentSubmission(submission);
      setStoredSubmission(activeSessionId, submission);
      setActiveKeyword(null);
      setActiveMobileTab("question");
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : "Failed to submit question.";
      setSubmissionError(message);
      throw error;
    } finally {
      setSubmissionSubmitting(false);
    }
  }

  async function handleSendMessage(content: string): Promise<void> {
    if (activeSessionId === null) {
      return;
    }

    setMessageSending(true);
    setMessagesError(null);

    try {
      const message = await createMessage(activeSessionId, {
        content,
        keyword_context: activeKeyword,
      });
      setMessages((prev) => [...prev, message]);
      setActiveMobileTab("chat");
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : "Failed to send message.";
      setMessagesError(message);
      throw error;
    } finally {
      setMessageSending(false);
    }
  }

  const rootClass = `academic-app theme-${themeMode}`;

  return (
    <div className={rootClass}>
      <AppHeader themeMode={themeMode} onThemeChange={setThemeMode} />

      {backendUnavailable && !healthBannerDismissed && (
        <div className="health-banner" role="status">
          <span>Backend unavailable. Some actions may fail until it reconnects.</span>
          <button
            type="button"
            className="health-banner-dismiss"
            onClick={() => setHealthBannerDismissed(true)}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="workspace-toolbar">
        <div className="workspace-toolbar-left">
          <span className="workspace-user">
            Signed in as {user?.display_name ?? user?.email}
          </span>
          <span className="workspace-session-context">
            {activeSession !== null
              ? `${activeSession.title} · ${formatTone(activeSession.tutor_tone)} · ${formatAvatar(activeSession.tutor_avatar)}`
              : "Create a session to begin"}
          </span>
        </div>
        <button type="button" className="btn-secondary" onClick={logout}>
          Sign out
        </button>
      </div>

      <MobileTabBar
        activeTab={activeMobileTab}
        onTabChange={setActiveMobileTab}
      />

      <div className="workspace-layout">
        <SessionSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          isLoading={sessionsLoading}
          error={sessionsError}
          onSelectSession={handleSelectSession}
          onNewSession={() => {
            setModalError(null);
            setIsModalOpen(true);
          }}
          onRetry={() => {
            loadSessions();
          }}
          className={getMobileColumnClass(activeMobileTab, "sessions")}
        />

        <QuestionPanel
          sessionId={activeSessionId}
          submission={currentSubmission}
          activeKeyword={activeKeyword}
          isSubmitting={submissionSubmitting}
          error={submissionError}
          onSubmit={handleSubmitQuestion}
          onSelectKeyword={setActiveKeyword}
          className={getMobileColumnClass(activeMobileTab, "question")}
        />

        <TutorChatPanel
          sessionId={activeSessionId}
          messages={messages}
          activeKeyword={activeKeyword}
          isLoading={messagesLoading}
          isSending={messageSending}
          error={messagesError}
          onSend={handleSendMessage}
          onRetryMessages={() => {
            if (activeSessionId !== null) {
              loadMessages(activeSessionId);
            }
          }}
          className={getMobileColumnClass(activeMobileTab, "chat")}
        />
      </div>

      <NewSessionModal
        isOpen={isModalOpen}
        isSubmitting={modalSubmitting}
        error={modalError}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateSession}
      />
    </div>
  );
}
