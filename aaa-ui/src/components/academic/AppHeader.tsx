import type { ThemeMode } from "../../types";

interface AppHeaderProps {
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
}

export function AppHeader(props: AppHeaderProps) {
  function handleThemeSelect(event: React.ChangeEvent<HTMLSelectElement>): void {
    const value = event.target.value as ThemeMode;
    props.onThemeChange(value);
  }

  return (
    <header className="app-header">
      <div className="app-brand">
        <span className="brand-icon" aria-hidden="true">🎓</span>
        <span className="brand-name">Agentic Academic Assistant</span>
      </div>

      <div className="header-controls">
        <label className="theme-select-label" htmlFor="theme-select">
          <span aria-hidden="true">🎨</span>
          <span className="sr-only">Display mode</span>
        </label>
        <select
          id="theme-select"
          className="theme-select"
          value={props.themeMode}
          onChange={handleThemeSelect}
          aria-label="Display mode"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="high-contrast">High Contrast</option>
        </select>
      </div>
    </header>
  );
}
