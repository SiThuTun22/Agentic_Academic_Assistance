#!/usr/bin/env python3
"""Professional B&W flowchart: user input → LLM handoff → final reply.

Send/Upload diverge, then share one Title → End section.
"""

from __future__ import annotations

from pathlib import Path


W = 1500


def esc(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def text(
    x: float,
    y: float,
    content: str,
    *,
    size: int = 12,
    weight: str = "400",
    anchor: str = "middle",
) -> str:
    return (
        f'<text x="{x}" y="{y}" text-anchor="{anchor}" '
        f'font-family="Helvetica,Arial,sans-serif" font-size="{size}" '
        f'font-weight="{weight}" fill="#111">{esc(content)}</text>'
    )


def terminal(x: float, y: float, w: float, h: float, title: str) -> str:
    return "\n".join(
        [
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h/2}" ry="{h/2}" '
            f'fill="#fff" stroke="#111" stroke-width="1.6"/>',
            text(x + w / 2, y + h / 2 + 4, title, size=13, weight="700"),
        ]
    )


def process(x: float, y: float, w: float, h: float, label: str) -> str:
    return "\n".join(
        [
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="2" ry="2" '
            f'fill="#fff" stroke="#111" stroke-width="1.4"/>',
            text(x + w / 2, y + h / 2 + 4, label, size=12),
        ]
    )


def agent(x: float, y: float, w: float, h: float, title: str, detail: str) -> str:
    return "\n".join(
        [
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="2" ry="2" '
            f'fill="#f5f5f5" stroke="#111" stroke-width="1.6"/>',
            text(x + w / 2, y + h / 2 - 6, title, size=12, weight="700"),
            text(x + w / 2, y + h / 2 + 12, detail, size=11),
        ]
    )


def data(x: float, y: float, w: float, h: float, label: str) -> str:
    skew = 12
    path = (
        f"M {x + skew} {y} L {x + w} {y} L {x + w - skew} {y + h} L {x} {y + h} Z"
    )
    return "\n".join(
        [
            f'<path d="{path}" fill="#fff" stroke="#111" stroke-width="1.4"/>',
            text(x + w / 2, y + h / 2 + 4, label, size=11),
        ]
    )


def diamond(cx: float, cy: float, w: float, h: float, label: str) -> str:
    path = (
        f"M {cx} {cy - h/2} L {cx + w/2} {cy} "
        f"L {cx} {cy + h/2} L {cx - w/2} {cy} Z"
    )
    return "\n".join(
        [
            f'<path d="{path}" fill="#fff" stroke="#111" stroke-width="1.4"/>',
            text(cx, cy + 4, label, size=12),
        ]
    )


def arrow_down(x: float, y1: float, y2: float, label: str = "") -> str:
    ah = 8.0
    base = y2 - ah
    parts = [
        f'<line x1="{x}" y1="{y1}" x2="{x}" y2="{base}" stroke="#111" stroke-width="1.25"/>',
        f'<path d="M {x} {y2} L {x - 4.5} {base} L {x + 4.5} {base} Z" fill="#111"/>',
    ]
    if label:
        parts.append(text(x + 8, (y1 + y2) / 2 + 3, label, size=10, anchor="start"))
    return "\n".join(parts)


def hline(x1: float, x2: float, y: float) -> str:
    return f'<line x1="{x1}" y1="{y}" x2="{x2}" y2="{y}" stroke="#111" stroke-width="1.25"/>'


def vline(x: float, y1: float, y2: float) -> str:
    return f'<line x1="{x}" y1="{y1}" x2="{x}" y2="{y2}" stroke="#111" stroke-width="1.25"/>'


def main() -> None:
    cx = 750
    send_cx = 300
    up_cx = 1200
    col_w = 360
    send_x = send_cx - col_w / 2
    up_x = up_cx - col_w / 2
    shared_w = 420
    shared_x = cx - shared_w / 2
    up_bypass_x = up_x + col_w + 40

    parts: list[str] = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="2000" viewBox="0 0 {W} 2000">',
        '<rect width="100%" height="100%" fill="#ffffff"/>',
        text(cx, 36, "AAA — LLM Processing Flow", size=18, weight="700"),
        text(
            cx,
            58,
            "From user input to final reply. Shaded boxes are LLM calls.",
            size=12,
        ),
        '<rect x="48" y="78" width="16" height="16" fill="#f5f5f5" stroke="#111" stroke-width="1.2"/>',
        text(72, 90, "LLM", size=11, anchor="start"),
        '<rect x="120" y="78" width="16" height="16" fill="#fff" stroke="#111" stroke-width="1.2"/>',
        text(144, 90, "Application", size=11, anchor="start"),
        '<path d="M 250 78 L 278 78 L 264 94 L 236 94 Z" fill="#fff" stroke="#111" stroke-width="1.2"/>',
        text(288, 90, "Data", size=11, anchor="start"),
    ]

    # Start
    parts.append(terminal(655, 100, 190, 36, "Start"))
    parts.append(arrow_down(cx, 136, 158))
    parts.append(process(600, 158, 300, 36, "User input"))
    parts.append(arrow_down(cx, 194, 220))
    parts.append(diamond(cx, 258, 220, 56, "Send or upload?"))

    parts.append(hline(cx - 110, send_cx, 258))
    parts.append(vline(send_cx, 258, 300))
    parts.append(arrow_down(send_cx, 300, 320))
    parts.append(text(500, 252, "Send", size=11))

    parts.append(hline(cx + 110, up_cx, 258))
    parts.append(vline(up_cx, 258, 300))
    parts.append(arrow_down(up_cx, 300, 320))
    parts.append(text(1000, 252, "Upload", size=11))

    parts.append(text(send_cx, 340, "Send path", size=13, weight="700"))
    parts.append(text(up_cx, 340, "Upload path", size=13, weight="700"))

    # ---- SEND (ends at tutor reply) ----
    y = 360
    parts.append(process(send_x, y, col_w, 36, "Load history and latest document"))
    y += 36
    parts.append(arrow_down(send_cx, y, y + 18))
    y += 18
    parts.append(data(send_x + 20, y, col_w - 40, 34, "document_context"))
    y += 34
    parts.append(arrow_down(send_cx, y, y + 18))
    y += 18
    parts.append(agent(send_x, y, col_w, 50, "Ollama Qwen — Tutor", "Question + history + context"))
    y += 50
    parts.append(arrow_down(send_cx, y, y + 18, "English reply"))
    y += 18
    parts.append(data(send_x + 20, y, col_w - 40, 34, "Tutor reply"))
    send_reply_bottom = y + 34
    send_join_y = send_reply_bottom

    # ---- UPLOAD (sequential, ends at tutor reply) ----
    y = 360
    parts.append(process(up_x, y, col_w, 36, "Save uploaded file"))
    y += 36
    parts.append(arrow_down(up_cx, y, y + 18))
    y += 18
    parts.append(diamond(up_cx, y + 28, 200, 56, "PDF or image?"))
    type_cy = y + 28
    y += 56

    parts.append(arrow_down(up_cx, y, y + 16, "PDF"))
    y += 16
    parts.append(process(up_x, y, col_w, 36, "Extract PDF text layer (local)"))
    y += 36
    parts.append(arrow_down(up_cx, y, y + 14))
    y += 14
    parts.append(data(up_x + 20, y, col_w - 40, 32, "extracted_text"))
    y += 32
    parts.append(arrow_down(up_cx, y, y + 14))
    y += 14
    parts.append(agent(up_x, y, col_w, 50, "Qwen — Glossary", "Keywords for PDF highlights"))
    y += 50
    parts.append(arrow_down(up_cx, y, y + 14))
    y += 14
    parts.append(process(up_x, y, col_w, 36, "Build PDF highlights"))
    y += 36
    parts.append(arrow_down(up_cx, y, y + 14))
    y += 14
    parts.append(process(up_x, y, col_w, 40, "Screenshot first N pages (local)"))
    y += 40
    parts.append(arrow_down(up_cx, y, y + 14))
    y += 14
    parts.append(data(up_x + 20, y, col_w - 40, 40, "page PNGs (figures included)"))
    y += 40
    parts.append(arrow_down(up_cx, y, y + 14))
    y += 14

    vision_y = y
    parts.append(agent(up_x, y, col_w, 50, "Ollama Vision (qwen2.5vl:3b)", "Describe visuals"))
    y += 50
    parts.append(arrow_down(up_cx, y, y + 14))
    y += 14
    parts.append(data(up_x + 20, y, col_w - 40, 32, "vision_description"))
    y += 32
    parts.append(arrow_down(up_cx, y, y + 14))
    y += 14
    parts.append(process(up_x, y, col_w, 36, "Save text, vision, highlights"))
    y += 36
    parts.append(arrow_down(up_cx, y, y + 14))
    y += 14
    parts.append(data(up_x + 20, y, col_w - 40, 32, "document_context"))
    y += 32
    parts.append(arrow_down(up_cx, y, y + 14))
    y += 14
    parts.append(agent(up_x, y, col_w, 50, "Ollama Qwen — Tutor", "Summarize document + context"))
    y += 50
    parts.append(arrow_down(up_cx, y, y + 14, "English reply"))
    y += 14
    parts.append(data(up_x + 20, y, col_w - 40, 32, "Tutor reply"))
    up_reply_bottom = y + 32

    # Image → vision only
    parts.append(hline(up_cx + 100, up_bypass_x, type_cy))
    parts.append(vline(up_bypass_x, type_cy, vision_y + 25))
    parts.append(hline(up_bypass_x, up_x + col_w, vision_y + 25))
    parts.append(
        f'<path d="M {up_x + col_w} {vision_y + 25} L {up_x + col_w + 8} {vision_y + 20.5} '
        f'L {up_x + col_w + 8} {vision_y + 29.5} Z" fill="#111"/>'
    )
    parts.append(text(up_bypass_x + 6, type_cy - 8, "Image file", size=10, anchor="start"))
    parts.append(
        text(up_bypass_x + 6, (type_cy + vision_y) / 2, "skip to vision", size=10, anchor="start")
    )

    # ---- JOIN into shared title/end ----
    join_y = max(send_join_y, up_reply_bottom) + 40
    parts.append(vline(send_cx, send_join_y, join_y))
    parts.append(vline(up_cx, up_reply_bottom, join_y))
    parts.append(hline(send_cx, up_cx, join_y))
    parts.append(arrow_down(cx, join_y, join_y + 22))
    parts.append(text(cx, join_y - 8, "both paths", size=10))

    # Shared section frame
    y = join_y + 28
    shared_top = y
    parts.append(text(cx, y, "Shared (Send and Upload)", size=13, weight="700"))
    y += 18

    parts.append(diamond(cx, y + 28, 240, 56, "Title is “New chat”?"))
    title_dec_y = y + 28
    y += 56
    parts.append(arrow_down(cx, y, y + 18, "Yes"))
    y += 18
    parts.append(agent(shared_x, y, shared_w, 50, "Ollama Qwen — Title", "Derive short session title"))
    y += 50
    parts.append(arrow_down(cx, y, y + 18))
    y += 18
    parts.append(process(shared_x, y, shared_w, 36, "Save title if updated"))
    y += 36
    parts.append(arrow_down(cx, y, y + 20))
    y += 20
    parts.append(process(shared_x, y, shared_w, 36, "Show reply to user"))
    show_y = y
    show_h = 36
    y += 36
    parts.append(arrow_down(cx, y, y + 20))
    y += 20
    parts.append(terminal(cx - 95, y, 190, 36, "End"))
    end_bottom = y + 36

    # No → Show reply
    no_x = shared_x - 40
    show_mid = show_y + show_h / 2
    parts.append(hline(cx - 120, no_x, title_dec_y))
    parts.append(vline(no_x, title_dec_y, show_mid))
    parts.append(
        f'<line x1="{no_x}" y1="{show_mid}" x2="{shared_x - 8}" y2="{show_mid}" '
        f'stroke="#111" stroke-width="1.25"/>'
    )
    parts.append(
        f'<path d="M {shared_x} {show_mid} L {shared_x - 8} {show_mid - 4.5} '
        f'L {shared_x - 8} {show_mid + 4.5} Z" fill="#111"/>'
    )
    parts.append(text(no_x - 6, title_dec_y - 6, "No", size=10, anchor="end"))

    # Light frames for columns (approximate heights)
    parts.append(
        f'<rect x="{send_x - 16}" y="320" width="{col_w + 32}" height="{send_join_y - 320 + 12}" '
        f'fill="none" stroke="#dddddd" stroke-width="1"/>'
    )
    parts.append(
        f'<rect x="{up_x - 16}" y="320" width="{col_w + 32}" height="{up_reply_bottom - 320 + 12}" '
        f'fill="none" stroke="#dddddd" stroke-width="1"/>'
    )
    parts.append(
        f'<rect x="{shared_x - 24}" y="{shared_top - 8}" width="{shared_w + 48}" '
        f'height="{end_bottom - shared_top + 24}" fill="none" stroke="#dddddd" stroke-width="1"/>'
    )

    # Footer
    note_y = end_bottom + 40
    parts.append(
        f'<rect x="48" y="{note_y}" width="{W - 96}" height="78" fill="#fff" stroke="#111" stroke-width="1.2"/>'
    )
    parts.append(text(cx, note_y + 22, "LLM handoff", size=12, weight="700"))
    parts.append(
        text(
            cx,
            note_y + 44,
            "PDF upload is sequential: term extraction → then Ollama vision. Title step is shared after either path.",
            size=11,
        )
    )
    parts.append(
        text(
            cx,
            note_y + 66,
            "Image upload skips term extraction and goes straight to Ollama vision. Tutor reads text + vision context.",
            size=11,
        )
    )

    bottom = note_y + 100
    svg = "\n".join(parts) + "\n</svg>\n"
    svg = svg.replace('height="2000"', f'height="{int(bottom)}"', 1)
    svg = svg.replace('viewBox="0 0 1500 2000"', f'viewBox="0 0 1500 {int(bottom)}"', 1)

    out = Path("/root/AAA/Agentic_Academic_Assistant/docs/aaa-llm-agent-flowchart.svg")
    out.write_text(svg, encoding="utf-8")
    print(f"Wrote {out}; height={int(bottom)}")


if __name__ == "__main__":
    main()
