import type { SubmissionRead } from "./apiTypes";
import type { ThemeMode } from "../types";

const ACTIVE_SESSION_KEY = "aaa_active_session_id";
const THEME_KEY = "aaa_theme";
const LOGIN_EMAIL_KEY = "aaa_login_email";
const MOBILE_TAB_KEY = "aaa_mobile_tab";

export type MobileTab = "sessions" | "question" | "chat";

function submissionKey(sessionId: string): string {
  return `aaa_submission_${sessionId}`;
}

function isThemeMode(value: string): value is ThemeMode {
  return value === "light" || value === "dark" || value === "high-contrast";
}

function isMobileTab(value: string): value is MobileTab {
  return value === "sessions" || value === "question" || value === "chat";
}

export function getInitialThemeMode(): ThemeMode {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored !== null && isThemeMode(stored)) {
    return stored;
  }

  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
}

export function setStoredThemeMode(theme: ThemeMode): void {
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

export function getStoredSubmission(sessionId: string): SubmissionRead | null {
  const raw = sessionStorage.getItem(submissionKey(sessionId));
  if (raw === null) {
    return null;
  }

  try {
    return JSON.parse(raw) as SubmissionRead;
  } catch {
    return null;
  }
}

export function setStoredSubmission(
  sessionId: string,
  submission: SubmissionRead,
): void {
  sessionStorage.setItem(submissionKey(sessionId), JSON.stringify(submission));
}

export function clearStoredSubmission(sessionId: string): void {
  sessionStorage.removeItem(submissionKey(sessionId));
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
