import { useEffect, useRef, useState } from "react";
import type { TutorAvatar, TutorTone } from "../../lib/apiTypes";

interface TutorSettingsMenuProps {
  tutorTone: TutorTone;
  tutorAvatar: TutorAvatar;
  disabled?: boolean;
  isSaving?: boolean;
  onChange: (next: {
    tutor_tone: TutorTone;
    tutor_avatar: TutorAvatar;
  }) => Promise<void>;
}

function avatarInitial(avatar: TutorAvatar): string {
  if (avatar === "male") {
    return "M";
  }
  return "F";
}

function avatarLabel(avatar: TutorAvatar): string {
  if (avatar === "male") {
    return "Male tutor";
  }
  return "Female tutor";
}

function toneLabel(tone: TutorTone): string {
  if (tone === "strict_academic") {
    return "Strict academic";
  }
  return "Socratic";
}

export function TutorSettingsMenu(props: TutorSettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftTone, setDraftTone] = useState<TutorTone>(props.tutorTone);
  const [draftAvatar, setDraftAvatar] = useState<TutorAvatar>(props.tutorAvatar);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDraftTone(props.tutorTone);
    setDraftAvatar(props.tutorAvatar);
  }, [props.tutorTone, props.tutorAvatar]);

  useEffect(() => {
    if (!isOpen) {
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
      setIsOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const disabled = props.disabled === true;
  const isSaving = props.isSaving === true;
  const initial = avatarInitial(props.tutorAvatar);
  const summary = `${toneLabel(props.tutorTone)} · ${avatarLabel(props.tutorAvatar)}`;

  let rootClass = "tutor-settings";
  if (isOpen) {
    rootClass = `${rootClass} is-open`;
  }

  async function handleSave(): Promise<void> {
    await props.onChange({
      tutor_tone: draftTone,
      tutor_avatar: draftAvatar,
    });
    setIsOpen(false);
  }

  return (
    <div ref={rootRef} className={rootClass}>
      <button
        type="button"
        className="tutor-settings-avatar"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`Tutor settings: ${summary}`}
        title={summary}
        disabled={disabled}
        onClick={() => {
          if (disabled) {
            return;
          }
          setDraftTone(props.tutorTone);
          setDraftAvatar(props.tutorAvatar);
          setIsOpen((prev) => !prev);
        }}
      >
        {initial}
      </button>

      {isOpen && (
        <div className="tutor-settings-panel" role="dialog" aria-label="Tutor settings">
          <p className="tutor-settings-heading">Tutor settings</p>

          <label className="form-label" htmlFor="tutor-settings-tone">
            Tone
          </label>
          <select
            id="tutor-settings-tone"
            className="form-input"
            value={draftTone}
            disabled={isSaving}
            onChange={(event) => {
              setDraftTone(event.target.value as TutorTone);
            }}
          >
            <option value="socratic">Socratic</option>
            <option value="strict_academic">Strict academic</option>
          </select>

          <label className="form-label" htmlFor="tutor-settings-avatar">
            Avatar
          </label>
          <select
            id="tutor-settings-avatar"
            className="form-input"
            value={draftAvatar}
            disabled={isSaving}
            onChange={(event) => {
              setDraftAvatar(event.target.value as TutorAvatar);
            }}
          >
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>

          <div className="tutor-settings-actions">
            <button
              type="button"
              className="btn-secondary"
              disabled={isSaving}
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={isSaving}
              onClick={() => {
                void handleSave();
              }}
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
