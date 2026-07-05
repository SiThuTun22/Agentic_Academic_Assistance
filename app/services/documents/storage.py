from __future__ import annotations

import uuid
from pathlib import Path


def save_uploaded_pdf(chat_session_id: uuid.UUID, document_id: uuid.UUID, file_bytes: bytes) -> Path:
    session_dir = Path('uploads') / str(chat_session_id)
    session_dir.mkdir(parents=True, exist_ok=True)
    storage_path = session_dir / f'{document_id}.pdf'
    storage_path.write_bytes(file_bytes)
    return storage_path
