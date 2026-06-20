import type {
  ChatMessage,
  ContextPanelData,
  QuickAction,
  RecentSession,
  SavedResource,
  StudyTopic,
} from "../types";

export const STUDY_TOPICS: StudyTopic[] = [
  {
    id: "math",
    name: "Algebra & Calculus",
    icon: "∑",
    progress: 72,
    estimatedMinutes: 45,
  },
  {
    id: "history",
    name: "World History",
    icon: "📜",
    progress: 58,
    estimatedMinutes: 30,
  },
  {
    id: "writing",
    name: "Academic Writing",
    icon: "✎",
    progress: 85,
    estimatedMinutes: 20,
  },
  {
    id: "cs",
    name: "Computer Science",
    icon: "{ }",
    progress: 40,
    estimatedMinutes: 60,
  },
];

export const SAVED_RESOURCES: SavedResource[] = [
  {
    id: "r1",
    title: "Calculus Chapter 3 Notes",
    type: "pdf",
    updatedAt: "2 days ago",
  },
  {
    id: "r2",
    title: "WWII Primary Sources",
    type: "link",
    updatedAt: "Yesterday",
  },
  {
    id: "r3",
    title: "Essay Draft — Climate Policy",
    type: "notes",
    updatedAt: "Today",
  },
];

export const RECENT_SESSIONS: RecentSession[] = [
  {
    id: "s1",
    title: "Quadratic equations review",
    subject: "Math",
    lastActive: "10 min ago",
  },
  {
    id: "s2",
    title: "WWII causes timeline",
    subject: "History",
    lastActive: "Yesterday",
  },
  {
    id: "s3",
    title: "Essay grammar feedback",
    subject: "Writing",
    lastActive: "2 days ago",
  },
];

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "explain",
    label: "Explain Concept",
    icon: "💡",
    description: "Get a step-by-step breakdown",
  },
  {
    id: "quiz",
    label: "Generate Quiz",
    icon: "❓",
    description: "Test your understanding",
  },
  {
    id: "plan",
    label: "Study Plan",
    icon: "📋",
    description: "Build a personalized schedule",
  },
  {
    id: "upload",
    label: "Upload Document",
    icon: "📎",
    description: "Analyze notes or assignments",
  },
];

export const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    role: "user",
    content: "Can you explain the quadratic formula and when to use it?",
    timestamp: "2:14 PM",
  },
  {
    id: "m2",
    role: "assistant",
    content:
      "Great question! The quadratic formula solves any equation in the form ax² + bx + c = 0.",
    blocks: [
      {
        type: "concept",
        label: "Key Concept",
        content: "Quadratic Formula",
      },
      {
        type: "definition",
        label: "Definition",
        content:
          "A formula that finds the roots (solutions) of a quadratic equation when factoring is difficult or impossible.",
      },
      {
        type: "formula",
        label: "Formula",
        content: "For ax² + bx + c = 0, the solutions are:",
        latex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
      },
      {
        type: "example",
        label: "Example",
        content:
          "For x² − 5x + 6 = 0: a=1, b=−5, c=6. Substituting gives x = 2 or x = 3.",
      },
      {
        type: "warning",
        label: "Common Pitfall",
        content:
          "Always check that a ≠ 0. If a = 0, the equation is linear, not quadratic.",
      },
    ],
    timestamp: "2:14 PM",
  },
  {
    id: "m3",
    role: "user",
    content: "Can you show me a timeline of the main causes of World War II?",
    timestamp: "2:18 PM",
  },
  {
    id: "m4",
    role: "assistant",
    content:
      "Here's a structured timeline of the key causes leading to WWII:",
    blocks: [
      {
        type: "timeline",
        label: "Historical Timeline",
        items: [
          "1919 — Treaty of Versailles: Harsh terms on Germany create resentment",
          "1929 — Great Depression: Economic instability fuels extremism",
          "1933 — Hitler becomes Chancellor: Nazi party rises in Germany",
          "1936 — Remilitarization of Rhineland: Violation of Versailles",
          "1938 — Munich Agreement: Appeasement policy fails to prevent expansion",
          "1939 — Invasion of Poland: War officially begins in Europe",
        ],
      },
      {
        type: "concept",
        label: "Underlying Concept",
        content:
          "The interwar period shows how economic crisis + unresolved grievances + aggressive nationalism can combine into global conflict.",
      },
      {
        type: "definition",
        label: "Terminology",
        content:
          "Appeasement — A diplomatic policy of making concessions to an aggressive power to avoid conflict.",
      },
    ],
    timestamp: "2:18 PM",
  },
  {
    id: "m5",
    role: "user",
    content:
      "I uploaded my essay draft. Can you give me feedback on grammar and structure?",
    timestamp: "2:22 PM",
  },
  {
    id: "m6",
    role: "assistant",
    content: "I've reviewed your essay on climate policy. Here's my feedback:",
    blocks: [
      {
        type: "correction",
        label: "Grammar Issue",
        content:
          '"The government have failed" → "The government has failed" (collective noun takes singular verb)',
      },
      {
        type: "correction",
        label: "Grammar Issue",
        content:
          '"More better policies" → "Better policies" or "More effective policies" (avoid double comparatives)',
      },
      {
        type: "example",
        label: "Suggestion",
        content:
          "Your thesis is strong. Consider adding a transition sentence between paragraphs 2 and 3 to improve flow.",
      },
      {
        type: "example",
        label: "Suggestion",
        content:
          "The evidence in paragraph 4 is compelling — add a citation to strengthen credibility.",
      },
      {
        type: "warning",
        label: "Structure Note",
        content:
          "The conclusion restates the introduction too closely. Try synthesizing your key arguments instead.",
      },
    ],
    timestamp: "2:22 PM",
  },
];

export const DEFAULT_CONTEXT: ContextPanelData = {
  activeConcept: "Quadratic Equations",
  conceptMap: [
    { id: "c1", label: "Standard Form", status: "mastered" },
    { id: "c2", label: "Factoring", status: "mastered" },
    { id: "c3", label: "Quadratic Formula", status: "learning" },
    { id: "c4", label: "Discriminant", status: "gap" },
    { id: "c5", label: "Complex Roots", status: "gap" },
  ],
  formulas: [
    {
      label: "Quadratic Formula",
      latex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
    },
    {
      label: "Discriminant",
      latex: "\\Delta = b^2 - 4ac",
    },
  ],
  studyTips: [
    "Practice identifying a, b, c values before substituting",
    "Draw a number line to visualize roots",
    "Review factoring first — it's faster when possible",
  ],
  suggestedQuestions: [
    "What does the discriminant tell us about roots?",
    "When should I use factoring instead?",
    "Can you generate a practice quiz?",
  ],
  proactiveSuggestions: [
    {
      id: "ps1",
      text: "You haven't reviewed the discriminant yet — it's closely related to what you're studying.",
      icon: "💡",
    },
    {
      id: "ps2",
      text: "Based on your history session, a comparative essay outline might help connect causes.",
      icon: "📝",
    },
    {
      id: "ps3",
      text: "Your writing feedback suggests reviewing subject-verb agreement rules.",
      icon: "✎",
    },
  ],
  knowledgeGaps: [
    { id: "kg1", topic: "Discriminant interpretation", level: "weak" },
    { id: "kg2", topic: "Complex number roots", level: "weak" },
    { id: "kg3", topic: "Subject-verb agreement", level: "moderate" },
  ],
  studyPlan: [
    {
      id: "sp1",
      task: "Review discriminant concept",
      durationMinutes: 15,
      completed: false,
    },
    {
      id: "sp2",
      task: "Complete 5 practice problems",
      durationMinutes: 25,
      completed: false,
    },
    {
      id: "sp3",
      task: "Grammar exercises — collective nouns",
      durationMinutes: 10,
      completed: true,
    },
  ],
  analytics: {
    sessionProgress: 65,
    topicsMastered: 8,
    topicsTotal: 14,
    focusMinutes: 42,
    streakDays: 5,
  },
};

export function buildAssistantReply(userText: string): ChatMessage {
  const lower = userText.toLowerCase();
  const id = crypto.randomUUID();
  const timestamp = new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  if (lower.includes("quiz")) {
    return {
      id,
      role: "assistant",
      content: "Here's a quick quiz based on your recent topics:",
      blocks: [
        {
          type: "example",
          label: "Question 1",
          content: "Solve x² + 6x + 5 = 0 using the quadratic formula.",
        },
        {
          type: "example",
          label: "Question 2",
          content: "What year did WWII begin in Europe?",
        },
        {
          type: "example",
          label: "Question 3",
          content: 'Fix the error: "The team are winning."',
        },
        {
          type: "suggestion",
          label: "Next Step",
          content:
            "Try answering these, then ask me to check your work. I'll explain any mistakes gently.",
        },
      ],
      timestamp,
    };
  }

  if (lower.includes("study plan") || lower.includes("plan")) {
    return {
      id,
      role: "assistant",
      content: "I've drafted a study plan based on your knowledge gaps:",
      blocks: [
        {
          type: "timeline",
          label: "Today's Plan",
          items: [
            "15 min — Review discriminant (Δ = b² − 4ac)",
            "25 min — Practice quadratic problems (set of 5)",
            "10 min — Grammar: collective nouns drill",
            "20 min — WWII cause-and-effect summary",
          ],
        },
        {
          type: "warning",
          label: "Tip",
          content:
            "Break sessions into 25-minute blocks with 5-minute breaks for better retention.",
        },
      ],
      timestamp,
    };
  }

  return {
    id,
    role: "assistant",
    content:
      "I understand. Let me break this down step by step so you can build on what you already know.",
    blocks: [
      {
        type: "concept",
        label: "Approach",
        content:
          "I'll use the Socratic method — guiding you with questions rather than giving direct answers.",
      },
      {
        type: "suggestion",
        label: "Recommended Next Step",
        content:
          "Try explaining the concept in your own words first. I'll help fill in any gaps.",
      },
    ],
    timestamp,
  };
}
