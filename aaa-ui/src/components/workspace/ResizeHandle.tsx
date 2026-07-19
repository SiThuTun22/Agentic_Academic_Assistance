import { useEffect, useRef, type PointerEvent } from "react";

interface ResizeHandleProps {
  ariaLabel: string;
  onDrag: (deltaX: number) => void;
  onReset: () => void;
  className?: string;
}

export function ResizeHandle(props: ResizeHandleProps) {
  const isDraggingRef = useRef(false);
  const lastXRef = useRef<number | null>(null);
  const onDragRef = useRef(props.onDrag);
  const activePointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    onDragRef.current = props.onDrag;
  }, [props.onDrag]);

  useEffect(() => {
    function handleWindowPointerMove(event: globalThis.PointerEvent): void {
      if (!isDraggingRef.current) {
        return;
      }
      if (activePointerIdRef.current !== event.pointerId) {
        return;
      }
      if (lastXRef.current === null) {
        return;
      }

      const previousX = lastXRef.current;
      const deltaX = event.clientX - previousX;
      lastXRef.current = event.clientX;
      if (deltaX === 0) {
        return;
      }
      onDragRef.current(deltaX);
    }

    function handleWindowPointerUp(event: globalThis.PointerEvent): void {
      if (!isDraggingRef.current) {
        return;
      }
      if (activePointerIdRef.current !== event.pointerId) {
        return;
      }
      stopDragging();
    }

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerUp);
      stopDragging();
    };
  }, []);

  function stopDragging(): void {
    if (!isDraggingRef.current) {
      return;
    }
    isDraggingRef.current = false;
    lastXRef.current = null;
    activePointerIdRef.current = null;
    document.body.classList.remove("is-resizing-columns");
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>): void {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    isDraggingRef.current = true;
    lastXRef.current = event.clientX;
    activePointerIdRef.current = event.pointerId;
    document.body.classList.add("is-resizing-columns");
  }

  function handleLostPointerCapture(): void {
    stopDragging();
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
      onLostPointerCapture={handleLostPointerCapture}
      onDoubleClick={handleDoubleClick}
    />
  );
}
