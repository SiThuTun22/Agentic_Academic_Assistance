from __future__ import annotations
import uuid
from litestar import Request, Router, post
from litestar.exceptions import NotFoundException
from litestar.security.jwt import Token
from app.models import Submission, User
from app.repos import ChatSessionRepo, SubmissionRepo, provide_chat_session_repo_dep, provide_submission_repo_dep
from app.schemas import SubmissionCreate, SubmissionRead

@post('/{session_id:uuid}/submissions', status_code=201)
async def create_submission(request: Request[User, Token, None], chat_session_repo: ChatSessionRepo, submission_repo: SubmissionRepo, session_id: uuid.UUID, data: SubmissionCreate) -> SubmissionRead:
    user = request.user
    chat_session = await chat_session_repo.get_owned_or_none(session_id, user.id)
    if chat_session is None:
        raise NotFoundException(detail=f'Chat session {session_id} not found')
    submission = Submission(chat_session_id=session_id, question_text=data.question_text, reference_text=data.reference_text)
    created = await submission_repo.add(submission)
    submission_read = SubmissionRead(id=created.id, chat_session_id=created.chat_session_id, question_text=created.question_text, reference_text=created.reference_text, keywords=[])
    return submission_read
submissions_router = Router(path='/api/chat-sessions', route_handlers=[create_submission], dependencies={'chat_session_repo': provide_chat_session_repo_dep, 'submission_repo': provide_submission_repo_dep})
