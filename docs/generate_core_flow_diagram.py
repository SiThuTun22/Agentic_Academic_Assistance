#!/usr/bin/env python3
"""Simple product flowchart with Start / End ovals (core user journey)."""

from __future__ import annotations

from pathlib import Path


W = 720


def esc(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def text(
    x: float,
    y: float,
    content: str,
    *,
    size: int = 13,
    weight: str = "400",
    anchor: str = "middle",
) -> str:
    return (
        f'<text x="{x}" y="{y}" text-anchor="{anchor}" '
        f'font-family="Helvetica,Arial,sans-serif" font-size="{size}" '
        f'font-weight="{weight}" fill="#111">{esc(content)}</text>'
    )


def terminal(cx: float, y: float, w: float, h: float, label: str) -> str:
    x = cx - w / 2
    return "\n".join(
        [
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h/2}" ry="{h/2}" '
            f'fill="#fff" stroke="#111" stroke-width="1.8"/>',
            text(cx, y + h / 2 + 5, label, size=14, weight="700"),
        ]
    )


def box(cx: float, y: float, w: float, h: float, label: str) -> str:
    x = cx - w / 2
    return "\n".join(
        [
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="2" ry="2" '
            f'fill="#fff" stroke="#111" stroke-width="1.5"/>',
            text(cx, y + h / 2 + 5, label, size=13),
        ]
    )


def multiline_box(cx: float, y: float, w: float, h: float, lines: list[str]) -> str:
    x = cx - w / 2
    parts = [
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="2" ry="2" '
        f'fill="#fff" stroke="#111" stroke-width="1.5"/>',
    ]
    start = y + h / 2 - (len(lines) - 1) * 8
    for i, line in enumerate(lines):
        parts.append(text(cx, start + i * 16, line, size=12))
    return "\n".join(parts)


def diamond(cx: float, cy: float, w: float, h: float, label: str) -> str:
    path = (
        f"M {cx} {cy - h/2} L {cx + w/2} {cy} "
        f"L {cx} {cy + h/2} L {cx - w/2} {cy} Z"
    )
    return "\n".join(
        [
            f'<path d="{path}" fill="#fff" stroke="#111" stroke-width="1.5"/>',
            text(cx, cy + 5, label, size=13),
        ]
    )


def arrow_down(x: float, y1: float, y2: float) -> str:
    ah = 9.0
    base = y2 - ah
    return "\n".join(
        [
            f'<line x1="{x}" y1="{y1}" x2="{x}" y2="{base}" stroke="#111" stroke-width="1.4"/>',
            f'<path d="M {x} {y2} L {x - 5} {base} L {x + 5} {base} Z" fill="#111"/>',
        ]
    )


def hline(x1: float, x2: float, y: float) -> str:
    return f'<line x1="{x1}" y1="{y}" x2="{x2}" y2="{y}" stroke="#111" stroke-width="1.4"/>'


def vline(x: float, y1: float, y2: float) -> str:
    return f'<line x1="{x}" y1="{y1}" x2="{x}" y2="{y2}" stroke="#111" stroke-width="1.4"/>'


def main() -> None:
    cx = 360
    box_w = 420
    left_cx = 180
    right_cx = 540
    branch_w = 280

    parts: list[str] = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="1200" viewBox="0 0 {W} 1200">',
        '<rect width="100%" height="100%" fill="#ffffff"/>',
        text(cx, 36, "AAA — Core Flow", size=18, weight="700"),
    ]

    y = 60
    parts.append(terminal(cx, y, 160, 40, "Start"))
    y += 40
    parts.append(arrow_down(cx, y, y + 24))
    y += 24

    for label in [
        "1. Login / Register",
        "2. Open new chat",
        "3. Ask a question OR upload PDF / image",
        "4. Auto-create session",
    ]:
        parts.append(box(cx, y, box_w, 44, label))
        y += 44
        parts.append(arrow_down(cx, y, y + 22))
        y += 22

    parts.append(diamond(cx, y + 36, 280, 72, "Text chat or file upload?"))
    dec_cy = y + 36
    y += 72

    parts.append(hline(cx - 140, left_cx, dec_cy))
    parts.append(vline(left_cx, dec_cy, y + 10))
    parts.append(arrow_down(left_cx, y + 10, y + 28))
    parts.append(text(left_cx, dec_cy - 10, "Text", size=12, weight="600"))

    parts.append(hline(cx + 140, right_cx, dec_cy))
    parts.append(vline(right_cx, dec_cy, y + 10))
    parts.append(arrow_down(right_cx, y + 10, y + 28))
    parts.append(text(right_cx, dec_cy - 10, "Upload", size=12, weight="600"))

    branch_top = y + 28
    parts.append(box(left_cx, branch_top, branch_w, 56, "5. Tutor replies with Qwen"))
    parts.append(
        multiline_box(
            right_cx,
            branch_top,
            branch_w,
            72,
            [
                "5. Extract text + vision",
                "→ Tutor summarizes",
                "→ Show doc + highlights",
            ],
        )
    )

    left_bottom = branch_top + 56
    right_bottom = branch_top + 72
    merge_y = max(left_bottom, right_bottom) + 36
    parts.append(vline(left_cx, left_bottom, merge_y))
    parts.append(vline(right_cx, right_bottom, merge_y))
    parts.append(hline(left_cx, right_cx, merge_y))
    parts.append(arrow_down(cx, merge_y, merge_y + 24))
    y = merge_y + 24

    for label in [
        "6. Generate short session title",
        "7. Continue follow-up chat",
        "8. Optional: Edit tutor tone / avatar",
    ]:
        parts.append(box(cx, y, box_w, 44, label))
        y += 44
        parts.append(arrow_down(cx, y, y + 22))
        y += 22

    parts.append(terminal(cx, y, 160, 40, "End"))
    bottom = y + 70

    svg = "\n".join(parts) + "\n</svg>\n"
    svg = svg.replace('height="1200"', f'height="{bottom}"', 1)
    svg = svg.replace('viewBox="0 0 720 1200"', f'viewBox="0 0 720 {bottom}"', 1)

    out = Path("/root/AAA/Agentic_Academic_Assistant/docs/aaa-core-flow-diagram.svg")
    out.write_text(svg, encoding="utf-8")
    print(f"Wrote {out}; height={bottom}")


if __name__ == "__main__":
    main()
