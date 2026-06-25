from __future__ import annotations

import json
import uuid
from pathlib import Path

import fitz
from langchain_core.prompts import ChatPromptTemplate

from app.ai.document_schemas import DocumentTerm, DocumentTermsResult
from app.ai.errors import LlmUnavailableError
from app.ai.llm import get_chat_model, invoke_ollama

DOCUMENT_CONTEXT_MAX_CHARS = 4000
TERM_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            'system',
            'Extract 8 to 15 important terms or names from the document text. '
            'Return a one-sentence definition for each term.',
        ),
        ('human', '{document_text}'),
    ]
)


class PdfWord:
    def __init__(self, page: int, text: str, x: float, y: float, width: float, height: float) -> None:
        self.page = page
        self.text = text
        self.x = x
        self.y = y
        self.width = width
        self.height = height


class DocumentAnnotation:
    def __init__(
        self,
        term: str,
        definition: str,
        page: int,
        x: float,
        y: float,
        width: float,
        height: float,
    ) -> None:
        self.term = term
        self.definition = definition
        self.page = page
        self.x = x
        self.y = y
        self.width = width
        self.height = height

    def to_dict(self) -> dict[str, str | int | float]:
        payload: dict[str, str | int | float] = {}
        payload['term'] = self.term
        payload['definition'] = self.definition
        payload['page'] = self.page
        payload['x'] = self.x
        payload['y'] = self.y
        payload['width'] = self.width
        payload['height'] = self.height
        return payload


def get_uploads_root() -> Path:
    root = Path('uploads')
    return root


def save_uploaded_pdf(chat_session_id: uuid.UUID, document_id: uuid.UUID, file_bytes: bytes) -> Path:
    uploads_root = get_uploads_root()
    session_dir = uploads_root / str(chat_session_id)
    session_dir.mkdir(parents=True, exist_ok=True)
    storage_path = session_dir / f'{document_id}.pdf'
    storage_path.write_bytes(file_bytes)
    return storage_path


def extract_pdf_words(storage_path: Path) -> tuple[str, list[PdfWord]]:
    document = fitz.open(storage_path)
    words: list[PdfWord] = []
    text_parts: list[str] = []

    page_index = 0
    for page in document:
        page_number = page_index + 1
        page_text = page.get_text('text')
        text_parts.append(page_text)
        raw_words = page.get_text('words')
        for raw_word in raw_words:
            if len(raw_word) < 5:
                continue
            word_text = str(raw_word[4]).strip()
            if len(word_text) == 0:
                continue
            x0 = float(raw_word[0])
            y0 = float(raw_word[1])
            x1 = float(raw_word[2])
            y1 = float(raw_word[3])
            width = x1 - x0
            height = y1 - y0
            pdf_word = PdfWord(page_number, word_text, x0, y0, width, height)
            words.append(pdf_word)
        page_index = page_index + 1

    document.close()
    extracted_text = '\n'.join(text_parts)
    return extracted_text, words


def truncate_document_context(extracted_text: str) -> str:
    if len(extracted_text) <= DOCUMENT_CONTEXT_MAX_CHARS:
        return extracted_text
    trimmed = extracted_text[:DOCUMENT_CONTEXT_MAX_CHARS]
    return trimmed


async def extract_document_terms(extracted_text: str) -> list[DocumentTerm]:
    if len(extracted_text.strip()) == 0:
        return []

    chat_model = get_chat_model()
    structured_model = chat_model.with_structured_output(DocumentTermsResult, method='json_schema')
    term_chain = TERM_PROMPT | structured_model
    payload = {'document_text': truncate_document_context(extracted_text)}

    result = await invoke_ollama(term_chain, payload)

    if isinstance(result, DocumentTermsResult):
        parsed = result
    elif isinstance(result, dict):
        parsed = DocumentTermsResult.model_validate(result)
    else:
        raise LlmUnavailableError('Ollama returned an unexpected document term response.')

    return parsed.terms


def find_term_position(term: str, words: list[PdfWord]) -> PdfWord | None:
    term_lower = term.lower()
    term_parts = term_lower.split()
    if len(term_parts) == 0:
        return None

    word_index = 0
    while word_index < len(words):
        first_word = words[word_index]
        first_lower = first_word.text.lower()
        if not first_lower.startswith(term_parts[0]):
            word_index = word_index + 1
            continue

        if len(term_parts) == 1:
            return first_word

        matched = True
        part_index = 1
        while part_index < len(term_parts):
            next_index = word_index + part_index
            if next_index >= len(words):
                matched = False
                break
            next_word = words[next_index]
            if next_word.page != first_word.page:
                matched = False
                break
            next_lower = next_word.text.lower()
            if not next_lower.startswith(term_parts[part_index]):
                matched = False
                break
            part_index = part_index + 1

        if matched:
            return first_word

        word_index = word_index + 1

    return None


def build_annotations(terms: list[DocumentTerm], words: list[PdfWord]) -> list[DocumentAnnotation]:
    annotations: list[DocumentAnnotation] = []
    seen: set[str] = set()

    for item in terms:
        cleaned_term = item.term.strip()
        if len(cleaned_term) < 2:
            continue
        key = cleaned_term.lower()
        if key in seen:
            continue
        seen.add(key)

        matched_word = find_term_position(cleaned_term, words)
        if matched_word is None:
            continue

        annotation = DocumentAnnotation(
            cleaned_term,
            item.definition.strip(),
            matched_word.page,
            matched_word.x,
            matched_word.y,
            matched_word.width,
            matched_word.height,
        )
        annotations.append(annotation)

    return annotations


def annotations_to_json(annotations: list[DocumentAnnotation]) -> str:
    payload: list[dict[str, str | int | float]] = []
    for annotation in annotations:
        payload.append(annotation.to_dict())
    encoded = json.dumps(payload)
    return encoded


def annotations_from_json(raw_json: str) -> list[DocumentAnnotation]:
    parsed = json.loads(raw_json)
    annotations: list[DocumentAnnotation] = []
    for item in parsed:
        annotation = DocumentAnnotation(
            str(item['term']),
            str(item['definition']),
            int(item['page']),
            float(item['x']),
            float(item['y']),
            float(item['width']),
            float(item['height']),
        )
        annotations.append(annotation)
    return annotations
