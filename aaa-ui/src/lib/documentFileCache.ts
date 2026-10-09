const pdfBufferCache = new Map<string, ArrayBuffer>();
const imageUrlCache = new Map<string, string>();

export function getCachedPdfBuffer(documentId: string): ArrayBuffer | null {
  const cached = pdfBufferCache.get(documentId);
  if (cached === undefined) {
    return null;
  }
  return cached.slice(0);
}

export function setCachedPdfBuffer(
  documentId: string,
  buffer: ArrayBuffer,
): void {
  pdfBufferCache.set(documentId, buffer.slice(0));
}

export function getCachedImageUrl(documentId: string): string | null {
  const cached = imageUrlCache.get(documentId);
  if (cached === undefined) {
    return null;
  }
  return cached;
}

export function setCachedImageUrl(documentId: string, objectUrl: string): void {
  const previous = imageUrlCache.get(documentId);
  if (previous !== undefined && previous !== objectUrl) {
    URL.revokeObjectURL(previous);
  }
  imageUrlCache.set(documentId, objectUrl);
}
