import { getToken } from "./auth";
import type {
  ChatMessageCreate,
  ChatMessageRead,
  ChatSessionCreate,
  ChatSessionRead,
  LoginRequest,
  RegisterRequest,
  SubmissionCreate,
  SubmissionRead,
  TokenResponse,
  UserMe,
} from "./apiTypes";

export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

export class NetworkError extends Error {
  constructor(message = "Cannot reach server. Is the backend running on port 8000?") {
    super(message);
    this.name = "NetworkError";
  }
}

export interface HealthResponse {
  status: string;
  version: string;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const token = getToken();
  if (token !== null) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(path, {
      ...options,
      headers,
    });
  } catch {
    throw new NetworkError();
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    if (body !== null && typeof body === "object" && "detail" in body) {
      const detail = (body as { detail: unknown }).detail;
      if (typeof detail === "string") {
        message = detail;
      }
    }
    throw new ApiRequestError(message, response.status);
  }

  return body as T;
}

export function login(data: LoginRequest): Promise<TokenResponse> {
  return request<TokenResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function register(data: RegisterRequest): Promise<UserMe> {
  return request<UserMe>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getMe(): Promise<UserMe> {
  return request<UserMe>("/api/auth/me");
}

export function checkHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/health");
}

export function listSessions(
  limit = 20,
  offset = 0,
): Promise<ChatSessionRead[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  return request<ChatSessionRead[]>(`/api/chat-sessions/?${params}`);
}

export function createSession(
  data: ChatSessionCreate,
): Promise<ChatSessionRead> {
  return request<ChatSessionRead>("/api/chat-sessions/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getSession(sessionId: string): Promise<ChatSessionRead> {
  return request<ChatSessionRead>(`/api/chat-sessions/${sessionId}`);
}

export function createSubmission(
  sessionId: string,
  data: SubmissionCreate,
): Promise<SubmissionRead> {
  return request<SubmissionRead>(
    `/api/chat-sessions/${sessionId}/submissions`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export function listMessages(
  sessionId: string,
  limit = 50,
  offset = 0,
): Promise<ChatMessageRead[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  return request<ChatMessageRead[]>(
    `/api/chat-sessions/${sessionId}/messages?${params}`,
  );
}

export function createMessage(
  sessionId: string,
  data: ChatMessageCreate,
): Promise<ChatMessageRead> {
  return request<ChatMessageRead>(
    `/api/chat-sessions/${sessionId}/messages`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}
