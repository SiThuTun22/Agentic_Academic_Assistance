import type { MobileTab } from "../../lib/workspaceStorage";

interface MobileTabBarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

const TABS: { id: MobileTab; label: string }[] = [
  { id: "sessions", label: "Sessions" },
  { id: "question", label: "Question" },
  { id: "chat", label: "Chat" },
];

export function MobileTabBar(props: MobileTabBarProps) {
  return (
    <nav
      className="mobile-tab-bar mobile-only"
      aria-label="Workspace sections"
    >
      {TABS.map((tab) => {
        const isActive = props.activeTab === tab.id;
        const tabClass = isActive ? "mobile-tab active" : "mobile-tab";

        return (
          <button
            key={tab.id}
            type="button"
            className={tabClass}
            aria-current={isActive ? "page" : undefined}
            onClick={() => props.onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
