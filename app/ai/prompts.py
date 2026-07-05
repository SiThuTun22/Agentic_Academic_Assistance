from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate

from app.db.enums import TutorTone

TUTOR_SYSTEM_BASE = (
    'Answer in clear English. '
    'Answer the student\'s latest message directly. '
    'For general topics, give a plain explanation with no code. '
    'For programming or computer science topics only, you may include a short code example. '
    'Do not comment on the conversation state.'
)

TUTOR_TONE_SUFFIXES: dict[TutorTone, str] = {
    TutorTone.SOCRATIC: 'You are a helpful tutor.',
    TutorTone.STRICT_ACADEMIC: 'You are a strict academic tutor. Be precise and structured.',
}

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


def system_prompt_for_tone(tutor_tone: TutorTone | str) -> str:
    tone_value = str(tutor_tone)
    if tone_value == TutorTone.STRICT_ACADEMIC.value:
        tone = TutorTone.STRICT_ACADEMIC
    else:
        tone = TutorTone.SOCRATIC
    tone_suffix = TUTOR_TONE_SUFFIXES[tone]
    system_prompt = f'{tone_suffix} {TUTOR_SYSTEM_BASE}'
    return system_prompt
