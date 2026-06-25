from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate

TUTOR_SYSTEM = (
    'You are a helpful tutor. Answer in clear English. '
    'Answer the student\'s latest message directly. '
    'For general topics, give a plain explanation with no code. '
    'For programming or computer science topics only, you may include a short code example. '
    'Do not comment on the conversation state.'
)

TUTOR_SYSTEM_STRICT = (
    'You are a strict academic tutor. Answer in clear English. '
    'Answer the student\'s latest message directly. Be precise and structured. '
    'For general topics, give a plain explanation with no code. '
    'For programming or computer science topics only, you may include a short code example. '
    'Do not comment on the conversation state.'
)

TUTOR_PROMPT = ChatPromptTemplate.from_messages(
    [
        ('system', '{system_prompt}'),
        (
            'human',
            'Document context:\n{document_context}\n\n'
            'History:\n{message_history}\n\n'
            'Student:\n{user_content}',
        ),
    ]
)
