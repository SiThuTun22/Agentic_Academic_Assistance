DOCUMENT_CONTEXT_MAX_CHARS = 4000


def truncate_document_context(extracted_text: str) -> str:
    if len(extracted_text) <= DOCUMENT_CONTEXT_MAX_CHARS:
        return extracted_text
    trimmed = extracted_text[:DOCUMENT_CONTEXT_MAX_CHARS]
    return trimmed
