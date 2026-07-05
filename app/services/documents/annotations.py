from __future__ import annotations

import json

from app.ai.document_terms import DocumentTerm
from app.services.documents.pdf_extract import PdfWord

AnnotationDict = dict[str, str | int | float]


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


def build_annotations(terms: list[DocumentTerm], words: list[PdfWord]) -> list[AnnotationDict]:
    annotations: list[AnnotationDict] = []
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

        annotation: AnnotationDict = {}
        annotation['term'] = cleaned_term
        annotation['definition'] = item.definition.strip()
        annotation['page'] = matched_word.page
        annotation['x'] = matched_word.x
        annotation['y'] = matched_word.y
        annotation['width'] = matched_word.width
        annotation['height'] = matched_word.height
        annotations.append(annotation)

    return annotations


def annotations_to_json(annotations: list[AnnotationDict]) -> str:
    encoded = json.dumps(annotations)
    return encoded


def annotations_from_json(raw_json: str) -> list[AnnotationDict]:
    parsed = json.loads(raw_json)
    annotations: list[AnnotationDict] = []
    for item in parsed:
        annotation: AnnotationDict = {}
        annotation['term'] = str(item['term'])
        annotation['definition'] = str(item['definition'])
        annotation['page'] = int(item['page'])
        annotation['x'] = float(item['x'])
        annotation['y'] = float(item['y'])
        annotation['width'] = float(item['width'])
        annotation['height'] = float(item['height'])
        annotations.append(annotation)
    return annotations
