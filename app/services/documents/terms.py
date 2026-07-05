from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate

from app.ai.document_terms import DocumentTerm, DocumentTermsResult
from app.ai.errors import LlmUnavailableError
from app.ai.llm import get_chat_model, invoke_ollama
from app.services.documents.context import truncate_document_context

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
