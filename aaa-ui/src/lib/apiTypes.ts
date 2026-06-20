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
  title: string;
  tutor_tone?: TutorTone;
  tutor_avatar?: TutorAvatar;
  status?: ChatSessionStatus;
}

export interface ChatSessionRead {
  id: string;
  title: string;
  tutor_tone: TutorTone;
  tutor_avatar: TutorAvatar;
  status: ChatSessionStatus;
  owner_id: string;
}

export interface SubmissionCreate {
  question_text: string;
  reference_text?: string | null;
}

export interface SubmissionRead {
  id: string;
  chat_session_id: string;
  question_text: string;
  reference_text: string | null;
  keywords: string[];
}

export interface ChatMessageCreate {
  content: string;
  keyword_context?: string | null;
}

export interface ChatMessageRead {
  id: string;
  chat_session_id: string;
  role: MessageRole;
  content: string;
  keyword_context: string | null;
}

export interface ApiError {
  detail: string;
}
