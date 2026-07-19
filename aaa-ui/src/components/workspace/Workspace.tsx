import { useCallback, useEffect, useRef, useState } from "react";

const PANEL_ANIMATION_MS = 220;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  return media.matches;
}
import {
  ApiRequestError,
  checkHealth,
  createMessage,
  createSession,
  deleteSession,
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
  CHAT_MIN_CHAT_WIDTH,
  CHAT_MIN_SESSIONS_WIDTH,
  DOCUMENT_MIN_CHAT_WIDTH,
  DOCUMENT_MIN_DOCUMENT_WIDTH,
  DOCUMENT_MIN_SESSIONS_WIDTH,
  RESIZE_HANDLE_WIDTH,
  SESSIONS_EXPANDED_MIN_WIDTH,
  clearActiveSessionId,
  getActiveSessionId,
  getDefaultChatColumnWidths,
  getDefaultDocumentColumnWidths,
  getInitialThemeMode,
  getStoredChatColumnWidths,
  getStoredDocumentColumnWidths,
  getStoredMobileTab,
  setActiveSessionId,
  setStoredChatColumnWidths,
  setStoredDocumentColumnWidths,
  setStoredMobileTab,
  setStoredThemeMode,
  type ChatColumnWidths,
  type DocumentColumnWidths,
  type LayoutMode,
  type MobileTab,
} from "../../lib/workspaceStorage";
import { AppHeader } from "./AppHeader";
import { DocumentViewerPanel } from "./DocumentViewerPanel";
import { MobileTabBar } from "./MobileTabBar";
import { ResizeHandle } from "./ResizeHandle";
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

function clamp(value: number, min: number, max: number): number {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

export function Workspace() {
  const { user, logout } = useAuth();
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const skipSessionHydrateRef = useRef(false);
  const panelAnimTimerRef = useRef<number | null>(null);

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
  const [documentPanelOpen, setDocumentPanelOpen] = useState(true);
  const [panelAnimating, setPanelAnimating] = useState(false);

  const [chatWidths, setChatWidths] = useState<ChatColumnWidths>(() =>
    getStoredChatColumnWidths(),
  );
  const [documentWidths, setDocumentWidths] = useState<DocumentColumnWidths>(
    () => getStoredDocumentColumnWidths(),
  );

  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [messageSending, setMessageSending] = useState(false);
  const [documentUploading, setDocumentUploading] = useState(false);

  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(
    null,
  );

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
        setDocumentPanelOpen(false);
        return;
      }
      setCurrentDocument(document);
      setDocumentPanelOpen(true);
    } catch {
      setCurrentDocument(null);
      setDocumentPanelOpen(false);
    }
  }, []);

  useEffect(() => {
    setStoredThemeMode(themeMode);
  }, [themeMode]);

  useEffect(() => {
    setStoredChatColumnWidths(chatWidths);
  }, [chatWidths]);

  useEffect(() => {
    setStoredDocumentColumnWidths(documentWidths);
  }, [documentWidths]);

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
      setDocumentPanelOpen(false);
      return;
    }

    if (skipSessionHydrateRef.current) {
      skipSessionHydrateRef.current = false;
      return;
    }

    loadMessages(activeSessionId);
    loadDocument(activeSessionId);
  }, [activeSessionId, loadDocument, loadMessages]);

  function upsertSession(session: ChatSessionRead): void {
    setSessions((prev) => {
      const index = prev.findIndex((item) => item.id === session.id);
      if (index === -1) {
        const withNew = [session, ...prev];
        return withNew;
      }
      const next = [...prev];
      next[index] = session;
      return next;
    });
  }

  async function ensureActiveSessionId(): Promise<string> {
    if (activeSessionId !== null) {
      return activeSessionId;
    }

    const created = await createSession({});
    upsertSession(created);
    skipSessionHydrateRef.current = true;
    setActiveSessionIdState(created.id);
    setActiveSessionId(created.id);
    return created.id;
  }

  function getLayoutWidth(): number {
    const layout = layoutRef.current;
    if (layout === null) {
      return 0;
    }
    return layout.clientWidth;
  }

  function handleChatSessionsDrag(deltaX: number): void {
    const layoutWidth = getLayoutWidth();
    if (layoutWidth <= 0) {
      return;
    }

    const maxSessions =
      layoutWidth - RESIZE_HANDLE_WIDTH - CHAT_MIN_CHAT_WIDTH;
    const nextSessions = clamp(
      chatWidths.sessions + deltaX,
      CHAT_MIN_SESSIONS_WIDTH,
      maxSessions,
    );
    const next: ChatColumnWidths = {
      sessions: nextSessions,
    };
    setChatWidths(next);
  }

  function resetChatSessionsWidth(): void {
    setChatWidths(getDefaultChatColumnWidths());
  }

  function handleDocumentSessionsDrag(deltaX: number): void {
    const layoutWidth = getLayoutWidth();
    if (layoutWidth <= 0) {
      return;
    }

    const maxSessions =
      layoutWidth -
      RESIZE_HANDLE_WIDTH * 2 -
      DOCUMENT_MIN_DOCUMENT_WIDTH -
      DOCUMENT_MIN_CHAT_WIDTH;
    const nextSessions = clamp(
      documentWidths.sessions + deltaX,
      DOCUMENT_MIN_SESSIONS_WIDTH,
      maxSessions,
    );
    const next: DocumentColumnWidths = {
      sessions: nextSessions,
      document: documentWidths.document,
    };
    setDocumentWidths(next);
  }

  function resetDocumentSessionsWidth(): void {
    const defaults = getDefaultDocumentColumnWidths();
    const next: DocumentColumnWidths = {
      sessions: defaults.sessions,
      document: documentWidths.document,
    };
    setDocumentWidths(next);
  }

  function handleDocumentChatDrag(deltaX: number): void {
    const layoutWidth = getLayoutWidth();
    if (layoutWidth <= 0) {
      return;
    }

    const maxDocument =
      layoutWidth -
      documentWidths.sessions -
      RESIZE_HANDLE_WIDTH * 2 -
      DOCUMENT_MIN_CHAT_WIDTH;
    const nextDocument = clamp(
      documentWidths.document + deltaX,
      DOCUMENT_MIN_DOCUMENT_WIDTH,
      maxDocument,
    );
    const next: DocumentColumnWidths = {
      sessions: documentWidths.sessions,
      document: nextDocument,
    };
    setDocumentWidths(next);
  }

  function resetDocumentChatWidth(): void {
    const layoutWidth = getLayoutWidth();
    const defaults = getDefaultDocumentColumnWidths();
    if (layoutWidth <= 0) {
      const next: DocumentColumnWidths = {
        sessions: documentWidths.sessions,
        document: defaults.document,
      };
      setDocumentWidths(next);
      return;
    }

    const available =
      layoutWidth - documentWidths.sessions - RESIZE_HANDLE_WIDTH * 2;
    const half = Math.floor(available / 2);
    const nextDocument = clamp(
      half,
      DOCUMENT_MIN_DOCUMENT_WIDTH,
      available - DOCUMENT_MIN_CHAT_WIDTH,
    );
    const next: DocumentColumnWidths = {
      sessions: documentWidths.sessions,
      document: nextDocument,
    };
    setDocumentWidths(next);
  }

  function handleSelectSession(sessionId: string): void {
    selectSession(sessionId, "chat");
  }

  function handleNewChat(): void {
    setActiveSessionIdState(null);
    clearActiveSessionId();
    setMessages([]);
    setCurrentDocument(null);
    setDocumentPanelOpen(false);
    setMessagesError(null);
    setActiveMobileTab("chat");
  }

  async function handleDeleteSession(sessionId: string): Promise<void> {
    const session = sessions.find((item) => item.id === sessionId);
    const title = session?.title ?? "this session";
    const confirmed = window.confirm(
      `Delete "${title}"? Messages and uploaded PDFs for this chat will be removed.`,
    );
    if (!confirmed) {
      return;
    }

    setDeletingSessionId(sessionId);
    setSessionsError(null);

    try {
      await deleteSession(sessionId);
      const remaining = sessions.filter((item) => item.id !== sessionId);
      setSessions(remaining);

      if (activeSessionId !== sessionId) {
        return;
      }

      if (remaining.length === 0) {
        setActiveSessionIdState(null);
        clearActiveSessionId();
        setMessages([]);
        setCurrentDocument(null);
        setDocumentPanelOpen(false);
        return;
      }

      selectSession(remaining[0].id, "chat");
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : "Failed to delete session.";
      setSessionsError(message);
    } finally {
      setDeletingSessionId(null);
    }
  }

  async function handleSendMessage(content: string): Promise<void> {
    setMessageSending(true);
    setMessagesError(null);

    try {
      const sessionId = await ensureActiveSessionId();
      const exchange = await createMessage(sessionId, {
        content,
      });
      upsertSession(exchange.session);
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
    setDocumentUploading(true);
    setMessagesError(null);

    try {
      const sessionId = await ensureActiveSessionId();
      const result = await uploadDocument(sessionId, file);
      upsertSession(result.session);
      if (!documentPanelOpen) {
        runPanelToggleAnimation(() => {
          setCurrentDocument(result.document);
          setDocumentPanelOpen(true);
        });
      } else {
        setCurrentDocument(result.document);
        setDocumentPanelOpen(true);
      }
      setMessages((prev) => [
        ...prev,
        result.user_message,
        result.assistant_message,
      ]);
      setActiveMobileTab("document");
    } catch (error) {
      let message = "Failed to upload file.";
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

  useEffect(() => {
    return () => {
      if (panelAnimTimerRef.current !== null) {
        window.clearTimeout(panelAnimTimerRef.current);
      }
    };
  }, []);

  function clearPanelAnimation(): void {
    if (panelAnimTimerRef.current !== null) {
      window.clearTimeout(panelAnimTimerRef.current);
      panelAnimTimerRef.current = null;
    }
    setPanelAnimating(false);
  }

  function runPanelToggleAnimation(applyToggle: () => void): void {
    if (prefersReducedMotion()) {
      applyToggle();
      return;
    }

    if (panelAnimTimerRef.current !== null) {
      window.clearTimeout(panelAnimTimerRef.current);
      panelAnimTimerRef.current = null;
    }

    setPanelAnimating(true);
    window.requestAnimationFrame(() => {
      applyToggle();
      panelAnimTimerRef.current = window.setTimeout(() => {
        setPanelAnimating(false);
        panelAnimTimerRef.current = null;
      }, PANEL_ANIMATION_MS);
    });
  }

  const hasDocument = currentDocument !== null;
  const showDocumentColumn = hasDocument && documentPanelOpen;
  const effectiveLayoutMode: LayoutMode = showDocumentColumn
    ? "document"
    : "chat";
  const mobileLayoutMode: LayoutMode = hasDocument ? "document" : "chat";

  function handleCloseDocumentPanel(): void {
    runPanelToggleAnimation(() => {
      setDocumentPanelOpen(false);
      if (activeMobileTab === "document") {
        setActiveMobileTab("chat");
      }
    });
  }

  function handleOpenDocumentPanel(): void {
    runPanelToggleAnimation(() => {
      setDocumentPanelOpen(true);
      setActiveMobileTab("document");
    });
  }

  function handleMobileTabChange(tab: MobileTab): void {
    if (tab === "document" && hasDocument && !documentPanelOpen) {
      runPanelToggleAnimation(() => {
        setDocumentPanelOpen(true);
        setActiveMobileTab(tab);
      });
      return;
    }
    if (tab === "document" && hasDocument) {
      setDocumentPanelOpen(true);
    }
    setActiveMobileTab(tab);
  }

  function handleResizeDragStart(): void {
    clearPanelAnimation();
  }

  const rootClass = `academic-app theme-${themeMode}`;
  let layoutClass = "workspace-layout workspace-layout--chat";
  if (hasDocument) {
    layoutClass = "workspace-layout workspace-layout--document";
    if (!documentPanelOpen) {
      layoutClass = `${layoutClass} workspace-layout--document-collapsed`;
    }
    if (panelAnimating) {
      layoutClass = `${layoutClass} workspace-layout--panel-animating`;
    }
  }

  let sessionsColumnWidth = chatWidths.sessions;
  if (hasDocument) {
    sessionsColumnWidth = documentWidths.sessions;
  }
  const sessionsCollapsed = sessionsColumnWidth < SESSIONS_EXPANDED_MIN_WIDTH;

  let gridTemplateColumns = `${chatWidths.sessions}px ${RESIZE_HANDLE_WIDTH}px minmax(${CHAT_MIN_CHAT_WIDTH}px, 1fr)`;
  if (hasDocument) {
    let documentTrackWidth = 0;
    let documentChatHandleWidth = 0;
    if (documentPanelOpen) {
      documentTrackWidth = documentWidths.document;
      documentChatHandleWidth = RESIZE_HANDLE_WIDTH;
    }
    gridTemplateColumns = `${documentWidths.sessions}px ${RESIZE_HANDLE_WIDTH}px ${documentTrackWidth}px ${documentChatHandleWidth}px minmax(${DOCUMENT_MIN_CHAT_WIDTH}px, 1fr)`;
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
          <span className="workspace-session-context">
            {activeSession !== null
              ? `${activeSession.title} · ${formatTone(activeSession.tutor_tone)} · ${formatAvatar(activeSession.tutor_avatar)}`
              : "Ask a question or upload a file to begin"}
          </span>
        </div>
      </div>

      <MobileTabBar
        activeTab={activeMobileTab}
        layoutMode={mobileLayoutMode}
        onTabChange={handleMobileTabChange}
      />

      <div
        ref={layoutRef}
        className={layoutClass}
        style={{ gridTemplateColumns }}
      >
        <SessionSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          collapsed={sessionsCollapsed}
          isLoading={sessionsLoading}
          error={sessionsError}
          deletingSessionId={deletingSessionId}
          displayName={user?.display_name ?? ""}
          email={user?.email ?? ""}
          onSelectSession={handleSelectSession}
          onDeleteSession={(sessionId) => {
            void handleDeleteSession(sessionId);
          }}
          onNewSession={handleNewChat}
          onRetry={() => {
            loadSessions();
          }}
          onLogout={logout}
          className={getMobileColumnClass(
            activeMobileTab,
            "sessions",
            effectiveLayoutMode,
          )}
        />

        {!hasDocument && (
          <ResizeHandle
            ariaLabel="Resize sessions and chat columns"
            onDrag={handleChatSessionsDrag}
            onReset={resetChatSessionsWidth}
            onDragStart={handleResizeDragStart}
          />
        )}

        {hasDocument && (
          <div className="column-divider">
            <ResizeHandle
              ariaLabel={
                showDocumentColumn
                  ? "Resize sessions and document columns"
                  : "Resize sessions and chat columns"
              }
              onDrag={handleDocumentSessionsDrag}
              onReset={resetDocumentSessionsWidth}
              onDragStart={handleResizeDragStart}
            />
            {!documentPanelOpen && (
              <button
                type="button"
                className="btn-document-edge-toggle"
                aria-label={`Show ${currentDocument.filename}`}
                title={`Show ${currentDocument.filename}`}
                onClick={handleOpenDocumentPanel}
              >
                <svg
                  className="panel-toggle-icon"
                  viewBox="0 0 16 16"
                  width="12"
                  height="12"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M6.22 3.22a.75.75 0 0 1 1.06 0l4 4a.75.75 0 0 1 0 1.06l-4 4a.75.75 0 1 1-1.06-1.06L9.44 8 6.22 4.28a.75.75 0 0 1 0-1.06z"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {hasDocument && (
          <DocumentViewerPanel
            document={currentDocument}
            onClosePanel={handleCloseDocumentPanel}
            className={
              documentPanelOpen
                ? getMobileColumnClass(
                    activeMobileTab,
                    "document",
                    "document",
                  )
                : "document-viewer-panel--collapsed hidden-mobile"
            }
          />
        )}

        {hasDocument && (
          <ResizeHandle
            ariaLabel="Resize document and chat columns"
            onDrag={handleDocumentChatDrag}
            onReset={resetDocumentChatWidth}
            onDragStart={handleResizeDragStart}
            className={
              showDocumentColumn ? undefined : "resize-handle--collapsed"
            }
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
          className={getMobileColumnClass(
            activeMobileTab,
            "chat",
            effectiveLayoutMode,
          )}
        />
      </div>
    </div>
  );
}
