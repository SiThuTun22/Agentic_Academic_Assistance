import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { DocumentAnnotationRead, DocumentRead } from "../../lib/apiTypes";
import { fetchDocumentBlobUrl, fetchDocumentFile } from "../../lib/api";

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

export function DocumentViewerPanel(props: DocumentViewerPanelProps) {
  const [pages, setPages] = useState<PageRenderState[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
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
      setImageUrl(null);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    let createdObjectUrl: string | null = null;

    async function loadDocument(): Promise<void> {
      setIsLoading(true);
      setLoadError(null);
      setPages([]);
      setImageUrl(null);

      const document = props.document!;
      const isImage = document.content_type === "image";

      try {
        if (isImage) {
          const objectUrl = await fetchDocumentBlobUrl(document.file_url);
          createdObjectUrl = objectUrl;
          if (cancelled) {
            URL.revokeObjectURL(objectUrl);
            return;
          }
          setImageUrl(objectUrl);
          return;
        }

        const fileBuffer = await fetchDocumentFile(document.file_url);
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
            error instanceof Error ? error.message : "Failed to load document.";
          setLoadError(message);
          setPages([]);
          setImageUrl(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadDocument();

    return () => {
      cancelled = true;
      if (createdObjectUrl !== null) {
        URL.revokeObjectURL(createdObjectUrl);
      }
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

  const isImageDocument = props.document.content_type === "image";
  let loadingLabel = "Loading PDF…";
  if (isImageDocument) {
    loadingLabel = "Loading image…";
  }

  return (
    <section className={columnClass} aria-label="Document viewer">
      <div className="column-header">
        <h2 className="column-title">{props.document.filename}</h2>
      </div>

      <div className="document-viewer-body" ref={containerRef}>
        {isLoading && <p className="column-status">{loadingLabel}</p>}
        {loadError !== null && (
          <p className="form-error" role="alert">
            {loadError}
          </p>
        )}

        {isImageDocument && imageUrl !== null && (
          <div className="document-image-wrap">
            <img
              src={imageUrl}
              alt={props.document.filename}
              className="document-image"
            />
          </div>
        )}

        {!isImageDocument &&
          pages.map((pageState) => {
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
