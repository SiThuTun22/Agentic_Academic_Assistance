# MIIT knowledge files

Drop UTF-8 JSONL here (one JSON object per line). Myanmar or English `text` is fine. Changed files are embedded into Postgres (pgvector) on backend startup and before the next chat if the files are newer.

Required fields:

```json
{"id": "unique-id", "text": "One fact or paragraph.", "sources": ["https://example.com"]}
```

Optional fields: `name`, `role`, `department`, `course_code`, `title`, `teacher`.

| Folder | What to add |
|--------|-------------|
| `faculty/` | One `.jsonl` per teacher (`cynthia_myint.jsonl`, `kyawt_kyawt_htay.jsonl`, `aye_aye_thant.jsonl`, `phyu_thwe.jsonl`, `tin_moh_moh_lwin.jsonl`) |
| `campus/` | Institute facts (see `institute.jsonl` for MIIT) |
| `courses/` | Program/catalog JSONL (`cse_be_hons.jsonl`, `ece_be_hons.jsonl`) |
| `courses/handouts/` | Course handout PDFs (text is extracted automatically) |

Files named `_schema.example.jsonl` are templates only and are not loaded.
