from __future__ import annotations

from pydantic import BaseModel, Field


class DocumentTerm(BaseModel):
    term: str = Field(description='Important term or name from the document')
    definition: str = Field(description='One-sentence explanation of the term')


class DocumentTermsResult(BaseModel):
    terms: list[DocumentTerm] = Field(
        description='8 to 15 important terms or names from the document text',
    )
