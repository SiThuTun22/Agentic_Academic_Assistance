import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { DocumentAnnotationRead, DocumentRead } from "../../lib/apiTypes";
import { fetchDocumentFile } from "../../lib/api";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface PageRenderState {
  pageNumber: number;
  width: number;
  height: number;
  scale: number;
}

interface DocumentViewerPanelProps {
  document: DocumentRead | null;
  className?: string;
}

function getSessionInitial(title: string): string {
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    return "?";
  }
  return trimmed.charAt(0).toUpperCase();
}

export function DocumentViewerPanel(props: DocumentViewerPanelProps) {
  const [pages, setPages] = useState<PageRenderState[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredAnnotation, setHoveredAnnotation] =
    useState<DocumentAnnotationRead | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());

  useEffect(() => {
    if (props.document === null) {
      setPages([]);
      setLoadError(null);
      return;
    }

    let cancelled = false;

    async function loadPdf(): Promise<void> {
      setIsLoading(true);
      setLoadError(null);

      try {
        const fileBuffer = await fetchDocumentFile(props.document!.file_url);
        const loadingTask = pdfjsLib.getDocument({ data: fileBuffer });
        const pdf = await loadingTask.promise;
        const nextPages: PageRenderState[] = [];
        const containerWidth = containerRef.current?.clientWidth ?? 640;
        const targetWidth = Math.max(containerWidth - 40, 320);

        let pageIndex = 1;
        while (pageIndex <= pdf.numPages) {
          const page = await pdf.getPage(pageIndex);
          const viewport = page.getViewport({ scale: 1 });
          const scale = targetWidth / viewport.width;
          const scaledViewport = page.getViewport({ scale });
          const pageState: PageRenderState = {
            pageNumber: pageIndex,
            width: scaledViewport.width,
            height: scaledViewport.height,
            scale,
          };
          nextPages.push(pageState);
          pageIndex = pageIndex + 1;
        }

        if (cancelled) {
          return;
        }

        setPages(nextPages);

        await new Promise<void>((resolve) => {
          window.requestAnimationFrame(() => {
            resolve();
          });
        });

        if (cancelled) {
          return;
        }

        let renderIndex = 1;
        while (renderIndex <= pdf.numPages) {
          const page = await pdf.getPage(renderIndex);
          const pageState = nextPages[renderIndex - 1];
          const scaledViewport = page.getViewport({ scale: pageState.scale });
          const canvas = canvasRefs.current.get(renderIndex);
          if (canvas !== undefined) {
            const context = canvas.getContext("2d");
            if (context !== null) {
              canvas.width = scaledViewport.width;
              canvas.height = scaledViewport.height;
              const renderContext = {
                canvasContext: context,
                viewport: scaledViewport,
                canvas,
              };
              await page.render(renderContext).promise;
            }
          }
          renderIndex = renderIndex + 1;
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "Failed to load PDF.";
          setLoadError(message);
          setPages([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      cancelled = true;
    };
  }, [props.document]);

  function handleAnnotationEnter(
    annotation: DocumentAnnotationRead,
    event: React.MouseEvent<HTMLSpanElement>,
  ): void {
    setHoveredAnnotation(annotation);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  }

  function handleAnnotationMove(event: React.MouseEvent<HTMLSpanElement>): void {
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  }

  function handleAnnotationLeave(): void {
    setHoveredAnnotation(null);
  }

  const columnClass = props.className
    ? `workspace-column document-viewer-panel ${props.className}`
    : "workspace-column document-viewer-panel";

  if (props.document === null) {
    return (
      <section className={columnClass} aria-label="Document viewer">
        <div className="column-header">
          <h2 className="column-title">Document</h2>
        </div>
        <p className="column-empty">No document uploaded yet.</p>
      </section>
    );
  }

  const annotationsForPage = (pageNumber: number): DocumentAnnotationRead[] => {
    const filtered: DocumentAnnotationRead[] = [];
    for (const annotation of props.document!.annotations) {
      if (annotation.page === pageNumber) {
        filtered.push(annotation);
      }
    }
    return filtered;
  };

  return (
    <section className={columnClass} aria-label="Document viewer">
      <div className="column-header">
        <h2 className="column-title">{props.document.filename}</h2>
      </div>

      <div className="document-viewer-body" ref={containerRef}>
        {isLoading && <p className="column-status">Loading PDF…</p>}
        {loadError !== null && (
          <p className="form-error" role="alert">
            {loadError}
          </p>
        )}

        {pages.map((pageState) => {
          const pageAnnotations = annotationsForPage(pageState.pageNumber);

          return (
            <div
              key={pageState.pageNumber}
              className="document-page"
              style={{ width: pageState.width, height: pageState.height }}
            >
              <canvas
                ref={(element) => {
                  if (element !== null) {
                    canvasRefs.current.set(pageState.pageNumber, element);
                  }
                }}
                className="document-page-canvas"
              />
              <div className="document-annotation-layer">
                {pageAnnotations.map((annotation) => {
                  const left = annotation.x * pageState.scale;
                  const top = annotation.y * pageState.scale;
                  const width = annotation.width * pageState.scale;
                  const height = annotation.height * pageState.scale;
                  const key = `${annotation.page}-${annotation.term}-${left}`;

                  return (
                    <span
                      key={key}
                      className="annotation-highlight"
                      style={{
                        left,
                        top,
                        width,
                        height,
                      }}
                      onMouseEnter={(event) =>
                        handleAnnotationEnter(annotation, event)
                      }
                      onMouseMove={handleAnnotationMove}
                      onMouseLeave={handleAnnotationLeave}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {hoveredAnnotation !== null && (
        <div
          className="annotation-tooltip"
          style={{
            left: tooltipPosition.x + 12,
            top: tooltipPosition.y + 12,
          }}
          role="tooltip"
        >
          <strong>{hoveredAnnotation.term}</strong>
          <p>{hoveredAnnotation.definition}</p>
        </div>
      )}
    </section>
  );
}

export { getSessionInitial };
