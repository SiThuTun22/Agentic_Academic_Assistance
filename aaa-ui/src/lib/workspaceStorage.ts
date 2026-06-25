export type LayoutMode = "chat" | "document";

export type MobileTab = "sessions" | "document" | "chat";

const ACTIVE_SESSION_KEY = "aaa_active_session_id";
const THEME_KEY = "aaa_theme";
const LOGIN_EMAIL_KEY = "aaa_login_email";
const MOBILE_TAB_KEY = "aaa_mobile_tab";

function isThemeMode(value: string): value is import("../types").ThemeMode {
  return value === "light" || value === "dark" || value === "high-contrast";
}

function isMobileTab(value: string): value is MobileTab {
  return value === "sessions" || value === "document" || value === "chat";
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
