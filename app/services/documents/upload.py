from __future__ import annotations

import uuid
from dataclasses import dataclass

from app.ai.github_vision import extract_vision_description
from app.ai.tutor import generate_tutor_reply
from app.db.models import ChatMessage, ChatSession, MessageRole, SessionDocument
from app.lib.config import get_vision_max_pdf_pages
from app.repositories.chat_message import ChatMessageRepo
from app.repositories.session_document import SessionDocumentRepo
from app.services.documents.annotations import annotations_to_json, build_annotations
from app.services.documents.context import build_document_context
from app.services.documents.pdf_extract import extract_pdf_words, render_pdf_pages_as_png
from app.services.documents.storage import save_uploaded_file
from app.services.documents.terms import extract_document_terms


@dataclass
class DocumentUploadResult:
    document: SessionDocument
    user_message: ChatMessage
    assistant_message: ChatMessage


def is_pdf_filename(filename: str) -> bool:
    return filename.lower().endswith('.pdf')


def is_image_filename(filename: str) -> bool:
    lowered = filename.lower()
    if lowered.endswith('.png'):
        return True
    if lowered.endswith('.jpg') or lowered.endswith('.jpeg'):
        return True
    if lowered.endswith('.webp'):
        return True
    return False


async def process_document_upload(
    chat_session: ChatSession,
    session_id: uuid.UUID,
    filename: str,
    file_bytes: bytes,
    session_document_repo: SessionDocumentRepo,
    chat_message_repo: ChatMessageRepo,
) -> DocumentUploadResult:
    document_id = uuid.uuid4()
    storage_path = save_uploaded_file(session_id, document_id, filename, file_bytes)

    extracted_text = ''
    vision_description = ''
    annotations_json = '[]'

    if is_pdf_filename(filename):
        extracted_text, words = extract_pdf_words(storage_path)
        terms = await extract_document_terms(extracted_text)
        annotations = build_annotations(terms, words)
        annotations_json = annotations_to_json(annotations)

        max_pages = get_vision_max_pdf_pages()
        page_images = render_pdf_pages_as_png(storage_path, max_pages)
        vision_description = await extract_vision_description(page_images)
    elif is_image_filename(filename):
        image_list: list[bytes] = []
        image_list.append(file_bytes)
        vision_description = await extract_vision_description(image_list)
    else:
        raise ValueError(f'Unsupported file type: {filename}')

    document = SessionDocument(
        id=document_id,
        chat_session_id=session_id,
        filename=filename,
        storage_path=str(storage_path),
        extracted_text=extracted_text,
        vision_description=vision_description,
        annotations_json=annotations_json,
    )
    created_document = await session_document_repo.add(document)

    history = await chat_message_repo.get_recent_for_session(session_id)

    upload_label = f'Uploaded "{filename}"'
    user_message = ChatMessage(chat_session_id=session_id, role=MessageRole.USER, content=upload_label)
    created_user = await chat_message_repo.add(user_message)

    document_context = build_document_context(extracted_text, vision_description)
    summary_prompt = 'Summarize what this document is about and explain the main topics.'
    tutor_text = await generate_tutor_reply(chat_session, history, summary_prompt, document_context)

    assistant_message = ChatMessage(chat_session_id=session_id, role=MessageRole.ASSISTANT, content=tutor_text)
    created_assistant = await chat_message_repo.add(assistant_message)

    result = DocumentUploadResult(
        document=created_document,
        user_message=created_user,
        assistant_message=created_assistant,
    )
    return result
