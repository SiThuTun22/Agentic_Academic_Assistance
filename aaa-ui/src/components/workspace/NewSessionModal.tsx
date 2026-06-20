import { useEffect, useRef, useState, type FormEvent } from "react";
import type { TutorAvatar, TutorTone } from "../../lib/apiTypes";

export interface NewSessionFormData {
  title: string;
  tutor_tone: TutorTone;
  tutor_avatar: TutorAvatar;
}

interface NewSessionModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (data: NewSessionFormData) => void;
}

export function NewSessionModal(props: NewSessionModalProps) {
  const [title, setTitle] = useState("");
  const [tutorTone, setTutorTone] = useState<TutorTone>("socratic");
  const [tutorAvatar, setTutorAvatar] = useState<TutorAvatar>("female");
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!props.isOpen) {
      return;
    }

    setTitle("");
    setTutorTone("socratic");
    setTutorAvatar("female");

    const frame = window.requestAnimationFrame(() => {
      titleInputRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [props.isOpen]);

  useEffect(() => {
    if (!props.isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape" && !props.isSubmitting) {
        props.onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [props.isOpen, props.isSubmitting, props.onClose]);

  if (!props.isOpen) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      return;
    }

    props.onSubmit({
      title: trimmedTitle,
      tutor_tone: tutorTone,
      tutor_avatar: tutorAvatar,
    });
  }

  function handleOverlayClick(): void {
    if (!props.isSubmitting) {
      props.onClose();
    }
  }

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={handleOverlayClick}
    >
      <div
        className="modal-card card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-session-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="new-session-title" className="modal-title">
          New study session
        </h2>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label className="form-label" htmlFor="session-title">
            Title
          </label>
          <input
            ref={titleInputRef}
            id="session-title"
            type="text"
            className="form-input"
            placeholder="e.g. Quadratic equations review"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={props.isSubmitting}
            required
          />

          <label className="form-label" htmlFor="tutor-tone">
            Tutor tone
          </label>
          <select
            id="tutor-tone"
            className="form-input"
            value={tutorTone}
            onChange={(event) =>
              setTutorTone(event.target.value as TutorTone)
            }
            disabled={props.isSubmitting}
          >
            <option value="socratic">Socratic</option>
            <option value="strict_academic">Strict academic</option>
          </select>

          <label className="form-label" htmlFor="tutor-avatar">
            Tutor avatar
          </label>
          <select
            id="tutor-avatar"
            className="form-input"
            value={tutorAvatar}
            onChange={(event) =>
              setTutorAvatar(event.target.value as TutorAvatar)
            }
            disabled={props.isSubmitting}
          >
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>

          {props.error !== null && (
            <p className="form-error" role="alert">
              {props.error}
            </p>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={props.onClose}
              disabled={props.isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={props.isSubmitting || title.trim().length === 0}
            >
              {props.isSubmitting ? "Creating…" : "Create session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
