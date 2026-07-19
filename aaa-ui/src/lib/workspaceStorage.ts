export type LayoutMode = "chat" | "document";

export type MobileTab = "sessions" | "document" | "chat";

export interface ChatColumnWidths {
  sessions: number;
}

export interface DocumentColumnWidths {
  sessions: number;
  document: number;
}

const ACTIVE_SESSION_KEY = "aaa_active_session_id";
const THEME_KEY = "aaa_theme";
const LOGIN_EMAIL_KEY = "aaa_login_email";
const MOBILE_TAB_KEY = "aaa_mobile_tab";
const CHAT_WIDTHS_KEY = "aaa_chat_column_widths";
const DOCUMENT_WIDTHS_KEY = "aaa_document_column_widths";

export const CHAT_DEFAULT_SESSIONS_WIDTH = 260;
export const CHAT_MIN_SESSIONS_WIDTH = 180;
export const CHAT_MIN_CHAT_WIDTH = 280;

export const DOCUMENT_DEFAULT_SESSIONS_WIDTH = 56;
export const DOCUMENT_MIN_SESSIONS_WIDTH = 56;
export const DOCUMENT_MIN_DOCUMENT_WIDTH = 240;
export const DOCUMENT_MIN_CHAT_WIDTH = 280;
export const DOCUMENT_DEFAULT_DOCUMENT_WIDTH = 480;

/** Below this width the sessions column uses the compact rail UI. */
export const SESSIONS_EXPANDED_MIN_WIDTH = 180;

export const RESIZE_HANDLE_WIDTH = 6;

function isThemeMode(value: string): value is import("../types").ThemeMode {
  return value === "light" || value === "dark" || value === "high-contrast";
}

function isMobileTab(value: string): value is MobileTab {
  return value === "sessions" || value === "document" || value === "chat";
}

function parsePositiveNumber(value: unknown): number | null {
  if (typeof value !== "number") {
    return null;
  }
  if (!Number.isFinite(value)) {
    return null;
  }
  if (value <= 0) {
    return null;
  }
  return value;
}

export function getInitialThemeMode(): import("../types").ThemeMode {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored !== null && isThemeMode(stored)) {
    return stored;
  }

  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
}

export function setStoredThemeMode(theme: import("../types").ThemeMode): void {
  localStorage.setItem(THEME_KEY, theme);
}

export function getActiveSessionId(): string | null {
  return localStorage.getItem(ACTIVE_SESSION_KEY);
}

export function setActiveSessionId(sessionId: string): void {
  localStorage.setItem(ACTIVE_SESSION_KEY, sessionId);
}

export function clearActiveSessionId(): void {
  localStorage.removeItem(ACTIVE_SESSION_KEY);
}

export function getStoredLoginEmail(): string {
  return localStorage.getItem(LOGIN_EMAIL_KEY) ?? "";
}

export function setStoredLoginEmail(email: string): void {
  localStorage.setItem(LOGIN_EMAIL_KEY, email);
}

export function getStoredMobileTab(): MobileTab {
  const stored = sessionStorage.getItem(MOBILE_TAB_KEY);
  if (stored !== null && isMobileTab(stored)) {
    return stored;
  }
  return "sessions";
}

export function setStoredMobileTab(tab: MobileTab): void {
  sessionStorage.setItem(MOBILE_TAB_KEY, tab);
}

export function getDefaultChatColumnWidths(): ChatColumnWidths {
  const widths: ChatColumnWidths = {
    sessions: CHAT_DEFAULT_SESSIONS_WIDTH,
  };
  return widths;
}

export function getDefaultDocumentColumnWidths(): DocumentColumnWidths {
  const widths: DocumentColumnWidths = {
    sessions: DOCUMENT_DEFAULT_SESSIONS_WIDTH,
    document: DOCUMENT_DEFAULT_DOCUMENT_WIDTH,
  };
  return widths;
}

export function getStoredChatColumnWidths(): ChatColumnWidths {
  const defaults = getDefaultChatColumnWidths();
  const raw = localStorage.getItem(CHAT_WIDTHS_KEY);
  if (raw === null) {
    return defaults;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object") {
      return defaults;
    }
    const record = parsed as Record<string, unknown>;
    const sessions = parsePositiveNumber(record.sessions);
    if (sessions === null) {
      return defaults;
    }
    const widths: ChatColumnWidths = {
      sessions: sessions,
    };
    return widths;
  } catch {
    return defaults;
  }
}

export function setStoredChatColumnWidths(widths: ChatColumnWidths): void {
  const encoded = JSON.stringify(widths);
  localStorage.setItem(CHAT_WIDTHS_KEY, encoded);
}

export function getStoredDocumentColumnWidths(): DocumentColumnWidths {
  const defaults = getDefaultDocumentColumnWidths();
  const raw = localStorage.getItem(DOCUMENT_WIDTHS_KEY);
  if (raw === null) {
    return defaults;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object") {
      return defaults;
    }
    const record = parsed as Record<string, unknown>;
    const sessions = parsePositiveNumber(record.sessions);
    const document = parsePositiveNumber(record.document);
    if (sessions === null || document === null) {
      return defaults;
    }
    const widths: DocumentColumnWidths = {
      sessions: sessions,
      document: document,
    };
    return widths;
  } catch {
    return defaults;
  }
}

export function setStoredDocumentColumnWidths(
  widths: DocumentColumnWidths,
): void {
  const encoded = JSON.stringify(widths);
  localStorage.setItem(DOCUMENT_WIDTHS_KEY, encoded);
}
