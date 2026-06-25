import type { LayoutMode, MobileTab } from "../../lib/workspaceStorage";

interface MobileTabBarProps {
  activeTab: MobileTab;
  layoutMode: LayoutMode;
  onTabChange: (tab: MobileTab) => void;
}

export function MobileTabBar(props: MobileTabBarProps) {
  const tabs: { id: MobileTab; label: string }[] = [
    { id: "sessions", label: "Sessions" },
  ];

  if (props.layoutMode === "document") {
    tabs.push({ id: "document", label: "Document" });
  }

  tabs.push({ id: "chat", label: "Chat" });

  return (
    <nav
      className="mobile-tab-bar mobile-only"
      aria-label="Workspace sections"
    >
      {tabs.map((tab) => {
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
