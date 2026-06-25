from __future__ import annotations
import uuid
from dataclasses import dataclass
from pathlib import Path
from advanced_alchemy.filters import LimitOffset
from litestar import Request, Router, get, post
from litestar.datastructures import UploadFile
from litestar.exceptions import NotFoundException, ServiceUnavailableException
from litestar.params import MultipartBody
from litestar.response import File
from litestar.security.jwt import Token
from app.ai.chains.tutor import generate_tutor_reply
from app.ai.errors import LlmUnavailableError
from app.models import ChatMessage, MessageRole, SessionDocument, User
from app.repos import (
    ChatMessageRepo,
    ChatSessionRepo,
    SessionDocumentRepo,
    provide_chat_message_repo_dep,
    provide_chat_session_repo_dep,
    provide_session_document_repo_dep,
)
from app.schemas import ChatMessageRead, DocumentAnnotationRead, DocumentRead, DocumentUploadRead
from app.services.document_processing import (
    annotations_from_json,
    annotations_to_json,
    build_annotations,
    extract_document_terms,
    extract_pdf_words,
    save_uploaded_pdf,
    truncate_document_context,
)

@dataclass
class DocumentUploadForm:
    file: UploadFile

def _to_message_read(message: ChatMessage) -> ChatMessageRead:
    message_read = ChatMessageRead(
        id=message.id,
        chat_session_id=message.chat_session_id,
        role=message.role,
        content=message.content,
        keyword_context=message.keyword_context,
    )
    return message_read

def _build_file_url(session_id: uuid.UUID, document_id: uuid.UUID) -> str:
    file_url = f'/api/chat-sessions/{session_id}/documents/{document_id}/file'
    return file_url

def _to_document_read(document: SessionDocument) -> DocumentRead:
    raw_annotations = annotations_from_json(document.annotations_json)
    annotations: list[DocumentAnnotationRead] = []
    for item in raw_annotations:
        annotation_read = DocumentAnnotationRead(
            term=item.term,
            definition=item.definition,
            page=item.page,
            x=item.x,
            y=item.y,
            width=item.width,
            height=item.height,
        )
        annotations.append(annotation_read)

    file_url = _build_file_url(document.chat_session_id, document.id)
    document_read = DocumentRead(
        id=document.id,
        chat_session_id=document.chat_session_id,
        filename=document.filename,
        file_url=file_url,
        annotations=annotations,
    )
    return document_read

@get('/{session_id:uuid}/documents/latest')
async def get_latest_document(
    request: Request[User, Token, None],
    chat_session_repo: ChatSessionRepo,
    session_document_repo: SessionDocumentRepo,
    session_id: uuid.UUID,
) -> DocumentRead | None:
    user = request.user
    chat_session = await chat_session_repo.get_owned_or_none(session_id, user.id)
    if chat_session is None:
        raise NotFoundException(detail=f'Chat session {session_id} not found')

    latest_document = await session_document_repo.get_latest_for_session(session_id)
    if latest_document is None:
        return None

    document_read = _to_document_read(latest_document)
    return document_read

@get('/{session_id:uuid}/documents/{document_id:uuid}/file')
async def get_document_file(
    request: Request[User, Token, None],
    chat_session_repo: ChatSessionRepo,
    session_document_repo: SessionDocumentRepo,
    session_id: uuid.UUID,
    document_id: uuid.UUID,
) -> File:
    user = request.user
    chat_session = await chat_session_repo.get_owned_or_none(session_id, user.id)
    if chat_session is None:
        raise NotFoundException(detail=f'Chat session {session_id} not found')

    document = await session_document_repo.get_one_or_none(id=document_id, chat_session_id=session_id)
    if document is None:
        raise NotFoundException(detail=f'Document {document_id} not found')

    storage_path = Path(document.storage_path)
    if not storage_path.is_file():
        raise NotFoundException(detail=f'Document file for {document_id} not found')

    file_response = File(path=storage_path, filename=document.filename)
    return file_response

@post('/{session_id:uuid}/documents', status_code=201)
async def upload_document(
    request: Request[User, Token, None],
    chat_session_repo: ChatSessionRepo,
    session_document_repo: SessionDocumentRepo,
    chat_message_repo: ChatMessageRepo,
    session_id: uuid.UUID,
    data: MultipartBody[DocumentUploadForm],
) -> DocumentUploadRead:
    user = request.user
    chat_session = await chat_session_repo.get_owned_or_none(session_id, user.id)
    if chat_session is None:
        raise NotFoundException(detail=f'Chat session {session_id} not found')

    file = data.file
    filename = file.filename or 'document.pdf'
    if not filename.lower().endswith('.pdf'):
        raise ServiceUnavailableException(detail='Only PDF files are supported.')

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise ServiceUnavailableException(detail='Uploaded file is empty.')

    document_id = uuid.uuid4()
    storage_path = save_uploaded_pdf(session_id, document_id, file_bytes)
    extracted_text, words = extract_pdf_words(storage_path)

    try:
        terms = await extract_document_terms(extracted_text)
    except LlmUnavailableError as error:
        raise ServiceUnavailableException(detail=str(error)) from error

    annotations = build_annotations(terms, words)
    annotations_json = annotations_to_json(annotations)

    document = SessionDocument(
        id=document_id,
        chat_session_id=session_id,
        filename=filename,
        storage_path=str(storage_path),
        extracted_text=extracted_text,
        annotations_json=annotations_json,
    )
    created_document = await session_document_repo.add(document)

    limit_offset = LimitOffset(limit=50, offset=0)
    history_results = await chat_message_repo.get_many(limit_offset, chat_session_id=session_id)
    history: list[ChatMessage] = []
    for message in history_results:
        history.append(message)

    upload_label = f'Uploaded "{filename}"'
    user_message = ChatMessage(chat_session_id=session_id, role=MessageRole.USER, content=upload_label, keyword_context=None)
    created_user = await chat_message_repo.add(user_message)

    document_context = truncate_document_context(extracted_text)
    summary_prompt = 'Summarize what this document is about and explain the main topics.'
    try:
        tutor_text = await generate_tutor_reply(chat_session, history, summary_prompt, document_context)
    except LlmUnavailableError as error:
        raise ServiceUnavailableException(detail=str(error)) from error

    assistant_message = ChatMessage(chat_session_id=session_id, role=MessageRole.ASSISTANT, content=tutor_text, keyword_context=None)
    created_assistant = await chat_message_repo.add(assistant_message)

    document_read = _to_document_read(created_document)
    user_read = _to_message_read(created_user)
    assistant_read = _to_message_read(created_assistant)
    upload_read = DocumentUploadRead(
        document=document_read,
        user_message=user_read,
        assistant_message=assistant_read,
    )
    return upload_read

documents_router = Router(
    path='/api/chat-sessions',
    route_handlers=[get_latest_document, get_document_file, upload_document],
    dependencies={
        'chat_session_repo': provide_chat_session_repo_dep,
        'session_document_repo': provide_session_document_repo_dep,
        'chat_message_repo': provide_chat_message_repo_dep,
    },
)
