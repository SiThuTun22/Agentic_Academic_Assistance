import { useRef, type PointerEvent } from "react";

interface ResizeHandleProps {
  ariaLabel: string;
  onDrag: (deltaX: number) => void;
  onReset: () => void;
  className?: string;
}

export function ResizeHandle(props: ResizeHandleProps) {
  const lastXRef = useRef<number | null>(null);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>): void {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    lastXRef.current = event.clientX;
    document.body.classList.add("is-resizing-columns");
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>): void {
    if (lastXRef.current === null) {
      return;
    }

    const previousX = lastXRef.current;
    const deltaX = event.clientX - previousX;
    lastXRef.current = event.clientX;
    if (deltaX === 0) {
      return;
    }
    props.onDrag(deltaX);
  }

  function endDrag(event: PointerEvent<HTMLDivElement>): void {
    if (lastXRef.current === null) {
      return;
    }

    lastXRef.current = null;
    document.body.classList.remove("is-resizing-columns");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleDoubleClick(): void {
    props.onReset();
  }

  let handleClass = "resize-handle";
  if (props.className !== undefined && props.className.length > 0) {
    handleClass = `${handleClass} ${props.className}`;
  }

  return (
    <div
      className={handleClass}
      role="separator"
      aria-orientation="vertical"
      aria-label={props.ariaLabel}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={handleDoubleClick}
    />
  );
}
