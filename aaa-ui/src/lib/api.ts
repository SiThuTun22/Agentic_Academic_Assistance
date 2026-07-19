import { getToken } from "./auth";
import type {
  ChatMessageCreate,
  ChatMessageExchangeRead,
  ChatMessageRead,
  ChatSessionCreate,
  ChatSessionRead,
  ChatSessionUpdate,
  DocumentRead,
  DocumentUploadRead,
  LoginRequest,
  RegisterRequest,
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
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

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

export function updateSession(
  sessionId: string,
  data: ChatSessionUpdate,
): Promise<ChatSessionRead> {
  return request<ChatSessionRead>(`/api/chat-sessions/${sessionId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteSession(sessionId: string): Promise<void> {
  return request<void>(`/api/chat-sessions/${sessionId}`, {
    method: "DELETE",
  });
}

export function getLatestDocument(
  sessionId: string,
): Promise<DocumentRead | null> {
  return request<DocumentRead | null>(
    `/api/chat-sessions/${sessionId}/documents/latest`,
  );
}

export function uploadDocument(
  sessionId: string,
  file: File,
): Promise<DocumentUploadRead> {
  const formData = new FormData();
  formData.append("file", file);

  return request<DocumentUploadRead>(
    `/api/chat-sessions/${sessionId}/documents`,
    {
      method: "POST",
      body: formData,
    },
  );
}

export async function fetchDocumentFile(fileUrl: string): Promise<ArrayBuffer> {
  const headers = new Headers();
  const token = getToken();
  if (token !== null) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(fileUrl, { headers });
  } catch {
    throw new NetworkError();
  }

  if (!response.ok) {
    throw new ApiRequestError(
      `Failed to load document (${response.status})`,
      response.status,
    );
  }

  const buffer = await response.arrayBuffer();
  return buffer;
}

export async function fetchDocumentBlobUrl(fileUrl: string): Promise<string> {
  const headers = new Headers();
  const token = getToken();
  if (token !== null) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(fileUrl, { headers });
  } catch {
    throw new NetworkError();
  }

  if (!response.ok) {
    throw new ApiRequestError(
      `Failed to load document (${response.status})`,
      response.status,
    );
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  return objectUrl;
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
): Promise<ChatMessageExchangeRead> {
  return request<ChatMessageExchangeRead>(
    `/api/chat-sessions/${sessionId}/messages`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}
