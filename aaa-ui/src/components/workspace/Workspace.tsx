import { useCallback, useEffect, useState } from "react";
import {
  ApiRequestError,
  checkHealth,
  createMessage,
  createSession,
  getLatestDocument,
  listMessages,
  listSessions,
  uploadDocument,
} from "../../lib/api";
import type {
  ChatMessageRead,
  ChatSessionRead,
  DocumentRead,
} from "../../lib/apiTypes";
import { useAuth } from "../../context/AuthContext";
import type { ThemeMode } from "../../types";
import {
  getActiveSessionId,
  getInitialThemeMode,
  getStoredMobileTab,
  setActiveSessionId,
  setStoredMobileTab,
  setStoredThemeMode,
  type LayoutMode,
  type MobileTab,
} from "../../lib/workspaceStorage";
import { AppHeader } from "./AppHeader";
import { DocumentViewerPanel } from "./DocumentViewerPanel";
import { MobileTabBar } from "./MobileTabBar";
import { NewSessionModal, type NewSessionFormData } from "./NewSessionModal";
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

function getMobileColumnClass(
  tab: MobileTab,
  column: MobileTab,
  layoutMode: LayoutMode,
): string {
  if (layoutMode === "chat" && column === "document") {
    return "hidden-mobile hidden-desktop";
  }
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
  const [currentDocument, setCurrentDocument] = useState<DocumentRead | null>(
    null,
  );
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("chat");

  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [messageSending, setMessageSending] = useState(false);
  const [documentUploading, setDocumentUploading] = useState(false);

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
    (sessionId: string, mobileTab: MobileTab = "chat") => {
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

  const loadDocument = useCallback(async (sessionId: string) => {
    try {
      const document = await getLatestDocument(sessionId);
      if (document === null) {
        setCurrentDocument(null);
        setLayoutMode("chat");
        return;
      }
      setCurrentDocument(document);
      setLayoutMode("document");
    } catch {
      setCurrentDocument(null);
      setLayoutMode("chat");
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
      setCurrentDocument(null);
      setLayoutMode("chat");
      return;
    }

    loadMessages(activeSessionId);
    loadDocument(activeSessionId);
  }, [activeSessionId, loadDocument, loadMessages]);

  function handleSelectSession(sessionId: string): void {
    selectSession(sessionId, "chat");
  }

  async function handleCreateSession(data: NewSessionFormData): Promise<void> {
    setModalSubmitting(true);
    setModalError(null);

    try {
      const created = await createSession(data);
      setSessions((prev) => [created, ...prev]);
      selectSession(created.id, "chat");
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

  async function handleSendMessage(content: string): Promise<void> {
    if (activeSessionId === null) {
      return;
    }

    setMessageSending(true);
    setMessagesError(null);

    try {
      const exchange = await createMessage(activeSessionId, {
        content,
      });
      setMessages((prev) => [
        ...prev,
        exchange.user_message,
        exchange.assistant_message,
      ]);
      setActiveMobileTab("chat");
    } catch (error) {
      let message = "Failed to send message.";
      if (error instanceof ApiRequestError) {
        if (error.status === 503) {
          message = error.message || "Local AI (Ollama) is not running.";
        } else {
          message = error.message;
        }
      }
      setMessagesError(message);
      if (activeSessionId !== null) {
        loadMessages(activeSessionId);
      }
      throw error;
    } finally {
      setMessageSending(false);
    }
  }

  async function handleUploadPdf(file: File): Promise<void> {
    if (activeSessionId === null) {
      return;
    }

    setDocumentUploading(true);
    setMessagesError(null);

    try {
      const result = await uploadDocument(activeSessionId, file);
      setCurrentDocument(result.document);
      setLayoutMode("document");
      setMessages((prev) => [
        ...prev,
        result.user_message,
        result.assistant_message,
      ]);
      setActiveMobileTab("document");
    } catch (error) {
      let message = "Failed to upload PDF.";
      if (error instanceof ApiRequestError) {
        if (error.status === 503) {
          message = error.message || "Local AI (Ollama) is not running.";
        } else {
          message = error.message;
        }
      }
      setMessagesError(message);
      throw error;
    } finally {
      setDocumentUploading(false);
    }
  }

  const rootClass = `academic-app theme-${themeMode}`;
  let layoutClass = "workspace-layout workspace-layout--chat";
  if (layoutMode === "document") {
    layoutClass = "workspace-layout workspace-layout--document";
  }

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
        layoutMode={layoutMode}
        onTabChange={setActiveMobileTab}
      />

      <div className={layoutClass}>
        <SessionSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          collapsed={layoutMode === "document"}
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
          className={getMobileColumnClass(
            activeMobileTab,
            "sessions",
            layoutMode,
          )}
        />

        {layoutMode === "document" && (
          <DocumentViewerPanel
            document={currentDocument}
            className={getMobileColumnClass(
              activeMobileTab,
              "document",
              layoutMode,
            )}
          />
        )}

        <TutorChatPanel
          sessionId={activeSessionId}
          messages={messages}
          isLoading={messagesLoading}
          isSending={messageSending}
          isUploading={documentUploading}
          error={messagesError}
          onSend={handleSendMessage}
          onUploadPdf={handleUploadPdf}
          onRetryMessages={() => {
            if (activeSessionId !== null) {
              loadMessages(activeSessionId);
            }
          }}
          className={getMobileColumnClass(activeMobileTab, "chat", layoutMode)}
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
