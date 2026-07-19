import { useEffect, useRef, useState } from "react";

interface UserProfileMenuProps {
  displayName: string;
  email: string;
  onLogout: () => void;
  compact?: boolean;
}

function profileInitial(displayName: string, email: string): string {
  const source = displayName.trim() || email.trim();
  if (source.length === 0) {
    return "?";
  }
  return source.charAt(0).toUpperCase();
}

function profileLabel(displayName: string, email: string): string {
  const name = displayName.trim();
  if (name.length > 0) {
    return name;
  }
  const mail = email.trim();
  if (mail.length > 0) {
    return mail;
  }
  return "Account";
}

export function UserProfileMenu(props: UserProfileMenuProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [railStyle, setRailStyle] = useState<{ top: number; left: number } | null>(
    null,
  );
  const [menuStyle, setMenuStyle] = useState<{
    bottom: number;
    left: number;
  } | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const chipRef = useRef<HTMLButtonElement | null>(null);

  const compact = props.compact === true;
  const initial = profileInitial(props.displayName, props.email);
  const label = profileLabel(props.displayName, props.email);
  const showExpanded = isHovered || isMenuOpen;

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent): void {
      const root = rootRef.current;
      if (root === null) {
        return;
      }
      if (event.target instanceof Node && root.contains(event.target)) {
        return;
      }
      setIsMenuOpen(false);
      setMenuStyle(null);
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setMenuStyle(null);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  function updateRailPosition(): void {
    if (!compact) {
      return;
    }
    const chip = chipRef.current;
    if (chip === null) {
      return;
    }
    const rect = chip.getBoundingClientRect();
    const next = {
      top: rect.top,
      left: rect.left,
    };
    setRailStyle(next);
  }

  function updateMenuPosition(): void {
    const chip = chipRef.current;
    if (chip === null) {
      return;
    }
    const rect = chip.getBoundingClientRect();
    const next = {
      bottom: window.innerHeight - rect.top + 8,
      left: rect.left,
    };
    setMenuStyle(next);
  }

  function handleMouseEnter(): void {
    setIsHovered(true);
    updateRailPosition();
  }

  function handleMouseLeave(): void {
    setIsHovered(false);
    if (!isMenuOpen) {
      setRailStyle(null);
    }
  }

  let rootClass = "user-profile";
  if (compact) {
    rootClass = `${rootClass} user-profile--compact`;
  }
  if (showExpanded) {
    rootClass = `${rootClass} is-expanded`;
  }
  if (isMenuOpen) {
    rootClass = `${rootClass} is-open`;
  }

  let chipStyle: { top?: number; left?: number } | undefined;
  if (compact && showExpanded && railStyle !== null) {
    chipStyle = {
      top: railStyle.top,
      left: railStyle.left,
    };
  }

  return (
    <div
      ref={rootRef}
      className={rootClass}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={chipRef}
        type="button"
        className="user-profile-chip"
        style={chipStyle}
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        aria-label={label}
        title={label}
        onClick={() => {
          updateRailPosition();
          const nextOpen = !isMenuOpen;
          setIsMenuOpen(nextOpen);
          if (nextOpen) {
            updateMenuPosition();
          } else {
            setMenuStyle(null);
            if (!isHovered) {
              setRailStyle(null);
            }
          }
        }}
      >
        <span className="user-profile-avatar" aria-hidden="true">
          {initial}
        </span>
        <span className="user-profile-name">{label}</span>
      </button>

      {isMenuOpen && menuStyle !== null && (
        <div
          className="user-profile-menu"
          role="menu"
          style={{
            bottom: menuStyle.bottom,
            left: menuStyle.left,
          }}
        >
          <button
            type="button"
            className="user-profile-menu-item"
            role="menuitem"
            onClick={() => {
              setIsMenuOpen(false);
              setMenuStyle(null);
              setRailStyle(null);
              props.onLogout();
            }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
