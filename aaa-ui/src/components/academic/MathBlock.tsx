import "katex/dist/katex.min.css";
import katex from "katex";
import { useEffect, useRef } from "react";

interface MathBlockProps {
  latex: string;
  label?: string;
}

export function MathBlock(props: MathBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current === null) {
      return;
    }

    try {
      katex.render(props.latex, containerRef.current, {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      if (containerRef.current !== null) {
        containerRef.current.textContent = props.latex;
      }
    }
  }, [props.latex]);

  return (
    <div className="math-block" role="math" aria-label={props.label ?? "Formula"}>
      {props.label !== undefined && (
        <span className="math-block-label">{props.label}</span>
      )}
      <div ref={containerRef} className="math-block-content" />
    </div>
  );
}
