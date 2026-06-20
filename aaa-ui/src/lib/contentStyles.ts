import type { ContentType } from "../types";

export interface BadgeConfig {
  label: string;
  icon: string;
  className: string;
}

export function getBadgeConfig(type: ContentType): BadgeConfig {
  if (type === "concept") {
    return { label: "Concept", icon: "◆", className: "badge-concept" };
  }
  if (type === "definition") {
    return { label: "Definition", icon: "📖", className: "badge-definition" };
  }
  if (type === "example") {
    return { label: "Example", icon: "✓", className: "badge-example" };
  }
  if (type === "warning") {
    return { label: "Caution", icon: "⚠", className: "badge-warning" };
  }
  if (type === "formula") {
    return { label: "Formula", icon: "ƒ", className: "badge-formula" };
  }
  if (type === "correction") {
    return { label: "Correction", icon: "✎", className: "badge-correction" };
  }
  if (type === "timeline") {
    return { label: "Timeline", icon: "⏱", className: "badge-concept" };
  }
  if (type === "code") {
    return { label: "Code", icon: "{ }", className: "badge-code" };
  }
  if (type === "suggestion") {
    return { label: "Suggestion", icon: "→", className: "badge-suggestion" };
  }
  return { label: "Note", icon: "•", className: "badge-default" };
}

export function getBlockClassName(type: ContentType): string {
  if (type === "concept") {
    return "block-concept";
  }
  if (type === "definition") {
    return "block-definition";
  }
  if (type === "example") {
    return "block-example";
  }
  if (type === "warning") {
    return "block-warning";
  }
  if (type === "formula") {
    return "block-formula";
  }
  if (type === "correction") {
    return "block-correction";
  }
  if (type === "timeline") {
    return "block-timeline";
  }
  if (type === "code") {
    return "block-code";
  }
  if (type === "suggestion") {
    return "block-suggestion";
  }
  return "block-default";
}
