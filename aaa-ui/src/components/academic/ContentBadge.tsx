import type { ContentType } from "../../types";
import { getBadgeConfig } from "../../lib/contentStyles";

interface ContentBadgeProps {
  type: ContentType;
  customLabel?: string;
}

export function ContentBadge(props: ContentBadgeProps) {
  const config = getBadgeConfig(props.type);
  const label = props.customLabel ?? config.label;

  return (
    <span className={`content-badge ${config.className}`} aria-label={label}>
      <span className="badge-icon" aria-hidden="true">
        {config.icon}
      </span>
      <span className="badge-label">{label}</span>
    </span>
  );
}
