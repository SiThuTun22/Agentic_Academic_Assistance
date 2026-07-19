export type TutorTone = "socratic" | "strict_academic";
export type TutorAvatar = "male" | "female";
export type ChatSessionStatus = "active" | "archived";
export type MessageRole = "user" | "assistant";

export interface UserMe {
  id: string;
  email: string;
  display_name: string;
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  display_name: string;
  password: string;
}

export interface ChatSessionCreate {
  title?: string;
  tutor_tone?: TutorTone;
  tutor_avatar?: TutorAvatar;
  status?: ChatSessionStatus;
}

export interface ChatSessionUpdate {
  tutor_tone?: TutorTone;
  tutor_avatar?: TutorAvatar;
}

export interface ChatSessionRead {
  id: string;
  title: string;
  tutor_tone: TutorTone;
  tutor_avatar: TutorAvatar;
  status: ChatSessionStatus;
  owner_id: string;
}

export interface ChatMessageCreate {
  content: string;
}

export interface ChatMessageRead {
  id: string;
  chat_session_id: string;
  role: MessageRole;
  content: string;
}

export interface ChatMessageExchangeRead {
  user_message: ChatMessageRead;
  assistant_message: ChatMessageRead;
  session: ChatSessionRead;
}

export interface DocumentAnnotationRead {
  term: string;
  definition: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DocumentRead {
  id: string;
  chat_session_id: string;
  filename: string;
  file_url: string;
  content_type: "pdf" | "image" | string;
  annotations: DocumentAnnotationRead[];
}

export interface DocumentUploadRead {
  document: DocumentRead;
  user_message: ChatMessageRead;
  assistant_message: ChatMessageRead;
  session: ChatSessionRead;
}

export interface ApiError {
  detail: string;
}
