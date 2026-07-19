DOCUMENT_CONTEXT_MAX_CHARS = 6000


def truncate_document_context(extracted_text: str) -> str:
    if len(extracted_text) <= DOCUMENT_CONTEXT_MAX_CHARS:
        return extracted_text
    trimmed = extracted_text[:DOCUMENT_CONTEXT_MAX_CHARS]
    return trimmed


def build_document_context(extracted_text: str, vision_description: str) -> str:
    text_part = extracted_text.strip()
    vision_part = vision_description.strip()
    sections: list[str] = []
    if len(text_part) > 0:
        sections.append('=== Document text ===\n' + text_part)
    if len(vision_part) > 0:
        sections.append('=== Visual content (from vision model) ===\n' + vision_part)
    if len(sections) == 0:
        return ''
    combined = '\n\n'.join(sections)
    truncated = truncate_document_context(combined)
    return truncated
