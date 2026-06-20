export type ContentType =
  | "text"
  | "concept"
  | "definition"
  | "example"
  | "warning"
  | "formula"
  | "correction"
  | "timeline"
  | "code"
  | "suggestion";

export type ThemeMode = "light" | "dark" | "high-contrast";

export interface MessageBlock {
  type: ContentType;
  content?: string;
  latex?: string;
  label?: string;
  items?: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  blocks?: MessageBlock[];
  timestamp: string;
}

export interface StudyTopic {
  id: string;
  name: string;
  icon: string;
  progress: number;
  estimatedMinutes: number;
}

export interface SavedResource {
  id: string;
  title: string;
  type: "pdf" | "notes" | "link";
  updatedAt: string;
}

export interface RecentSession {
  id: string;
  title: string;
  subject: string;
  lastActive: string;
}

export interface ConceptNode {
  id: string;
  label: string;
  status: "mastered" | "learning" | "gap";
}

export interface ProactiveSuggestion {
  id: string;
  text: string;
  icon: string;
}

export interface KnowledgeGap {
  id: string;
  topic: string;
  level: "weak" | "moderate";
}

export interface StudyPlanItem {
  id: string;
  task: string;
  durationMinutes: number;
  completed: boolean;
}

export interface LearningAnalytics {
  sessionProgress: number;
  topicsMastered: number;
  topicsTotal: number;
  focusMinutes: number;
  streakDays: number;
}

export interface ContextPanelData {
  activeConcept: string;
  conceptMap: ConceptNode[];
  formulas: { label: string; latex: string }[];
  studyTips: string[];
  suggestedQuestions: string[];
  proactiveSuggestions: ProactiveSuggestion[];
  knowledgeGaps: KnowledgeGap[];
  studyPlan: StudyPlanItem[];
  analytics: LearningAnalytics;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  description: string;
}
