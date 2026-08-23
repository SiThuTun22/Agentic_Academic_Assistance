#!/usr/bin/env python3
"""Clean B&W UML use-case SVG with correct include/extend arrowheads."""

from __future__ import annotations

import math
from pathlib import Path


W = 1680
H = 1080


def esc(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def actor(cx: float, cy: float, label: str) -> str:
    return "\n".join(
        [
            f'<circle cx="{cx}" cy="{cy - 28}" r="10" fill="none" stroke="#111" stroke-width="1.6"/>',
            f'<line x1="{cx}" y1="{cy - 18}" x2="{cx}" y2="{cy + 8}" stroke="#111" stroke-width="1.6"/>',
            f'<line x1="{cx - 18}" y1="{cy - 8}" x2="{cx + 18}" y2="{cy - 8}" stroke="#111" stroke-width="1.6"/>',
            f'<line x1="{cx}" y1="{cy + 8}" x2="{cx - 14}" y2="{cy + 34}" stroke="#111" stroke-width="1.6"/>',
            f'<line x1="{cx}" y1="{cy + 8}" x2="{cx + 14}" y2="{cy + 34}" stroke="#111" stroke-width="1.6"/>',
            f'<text x="{cx}" y="{cy + 54}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="13" fill="#111">{esc(label)}</text>',
        ]
    )


def ellipse(cx: float, cy: float, rx: float, ry: float, label: str) -> str:
    return (
        f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="#fff" stroke="#111" stroke-width="1.5"/>\n'
        f'<text x="{cx}" y="{cy + 4}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="12" fill="#111">{esc(label)}</text>'
    )


def solid(x1: float, y1: float, x2: float, y2: float) -> str:
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#111" stroke-width="1.05"/>'


def edge_point(
    cx: float,
    cy: float,
    rx: float,
    ry: float,
    toward_x: float,
    toward_y: float,
) -> tuple[float, float]:
    dx = toward_x - cx
    dy = toward_y - cy
    length = math.hypot(dx, dy)
    if length < 1e-6:
        return cx + rx, cy
    ux = dx / length
    uy = dy / length
    scale = 1.0 / math.sqrt((ux * ux) / (rx * rx) + (uy * uy) / (ry * ry))
    return cx + ux * scale, cy + uy * scale


def open_head(tip_x: float, tip_y: float, from_x: float, from_y: float) -> str:
    dx = tip_x - from_x
    dy = tip_y - from_y
    length = math.hypot(dx, dy)
    if length < 1:
        return ""
    ux = dx / length
    uy = dy / length
    ah = 11.0
    aw = 6.0
    bx = tip_x - ux * ah
    by = tip_y - uy * ah
    return "\n".join(
        [
            f'<path d="M {tip_x:.1f} {tip_y:.1f} L {bx - uy * aw:.1f} {by + ux * aw:.1f}" fill="none" stroke="#111" stroke-width="1.25"/>',
            f'<path d="M {tip_x:.1f} {tip_y:.1f} L {bx + uy * aw:.1f} {by - ux * aw:.1f}" fill="none" stroke="#111" stroke-width="1.25"/>',
        ]
    )


def dashed_line(x1: float, y1: float, x2: float, y2: float) -> str:
    return (
        f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
        f'stroke="#111" stroke-width="1.25" stroke-dasharray="6 4"/>'
    )


def include_h(src: tuple[float, float, float, float], dst: tuple[float, float, float, float], label_y: float | None = None) -> str:
    """Horizontal include: src right edge → dst left edge."""
    x1, y1, rx1, _ = src
    x2, y2, rx2, _ = dst
    sx = x1 + rx1
    sy = y1
    ex = x2 - rx2
    ey = y2
    # elbow via mid
    mx = (sx + ex) / 2
    ah = 11.0
    end_x = ex - ah
    chunks = [
        dashed_line(sx, sy, mx, sy),
        dashed_line(mx, sy, mx, ey),
        dashed_line(mx, ey, end_x, ey),
        open_head(ex, ey, end_x, ey),
    ]
    ly = ey - 8 if label_y is None else label_y
    chunks.append(
        f'<text x="{mx:.1f}" y="{ly:.1f}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="11" fill="#111">&lt;&lt;include&gt;&gt;</text>'
    )
    return "\n".join(chunks)


def include_bus(
    src: tuple[float, float, float, float],
    targets: list[tuple[float, float, float, float]],
    bus_x: float,
    label: str = "<<include>>",
) -> str:
    """One trunk from src to a vertical bus, then stubs into each target (arrow on target)."""
    x1, y1, rx1, _ = src
    sx = x1 + rx1
    sy = y1
    ys = [t[1] for t in targets]
    y_min = min(ys)
    y_max = max(ys)
    chunks = [
        dashed_line(sx, sy, bus_x, sy),
        dashed_line(bus_x, y_min, bus_x, y_max),
        f'<text x="{bus_x - 4:.1f}" y="{(y_min + y_max) / 2:.1f}" text-anchor="end" font-family="Arial,Helvetica,sans-serif" font-size="11" fill="#111">{esc(label)}</text>',
    ]
    for tx, ty, trx, _ in targets:
        ex = tx - trx
        ey = ty
        ah = 11.0
        end_x = ex - ah
        chunks.append(dashed_line(bus_x, ey, end_x, ey))
        chunks.append(open_head(ex, ey, end_x, ey))
    return "\n".join(chunks)


def dep_arrow(
    src: tuple[float, float, float, float],
    dst: tuple[float, float, float, float],
    label: str,
    side: float = -1.0,
    label_offset: float = 12.0,
) -> str:
    """Dependency: src → dst, open arrow on dst."""
    x1, y1, rx1, ry1 = src
    x2, y2, rx2, ry2 = dst
    sx, sy = edge_point(x1, y1, rx1, ry1, x2, y2)
    ex, ey = edge_point(x2, y2, rx2, ry2, x1, y1)
    dx = ex - sx
    dy = ey - sy
    length = math.hypot(dx, dy)
    if length < 1.0:
        return ""
    ux = dx / length
    uy = dy / length
    ah = 11.0
    end_x = ex - ux * ah
    end_y = ey - uy * ah
    mx = (sx + ex) / 2 + (-uy) * label_offset * side
    my = (sy + ey) / 2 + ux * label_offset * side
    # White backdrop so the stereotype stays readable over crossing lines
    return "\n".join(
        [
            dashed_line(sx, sy, end_x, end_y),
            open_head(ex, ey, end_x, end_y),
            f'<rect x="{mx - 36:.1f}" y="{my - 12:.1f}" width="72" height="16" fill="#fff" fill-opacity="0.92"/>',
            f'<text x="{mx:.1f}" y="{my:.1f}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="11" fill="#111">{esc(label)}</text>',
        ]
    )


def extend_arrow(
    src: tuple[float, float, float, float],
    dst: tuple[float, float, float, float],
    side: float = -1.0,
) -> str:
    return dep_arrow(src, dst, "<<extend>>", side)


def main() -> None:
    uc: dict[str, tuple[float, float, float, float]] = {}

    def put(key: str, cx: float, cy: float, rx: float = 118, ry: float = 26) -> None:
        uc[key] = (cx, cy, rx, ry)

    left_x = 300
    put("Register", left_x, 95, 100, 22)
    put("Login", left_x, 150, 70, 22)
    put("Logout", left_x, 205, 70, 22)
    put("NewChat", left_x, 275, 105, 22)
    put("Browse", left_x, 330, 115, 22)
    put("Open", left_x, 385, 105, 22)
    put("Delete", left_x, 440, 105, 22)
    put("Tone", left_x, 515, 115, 22)
    put("Avatar", left_x, 570, 120, 22)
    put("Theme", left_x, 625, 120, 22)
    put("Close", left_x, 695, 120, 22)
    put("Reopen", left_x, 750, 125, 22)
    put("Resize", left_x, 805, 105, 22)

    base_x = 600
    put("Auto", base_x, 90, 120, 24)
    put("Send", base_x, 210, 130, 28)
    put("UpPDF", base_x, 430, 100, 28)
    put("UpImg", base_x, 650, 105, 28)
    put("History", base_x, 860, 125, 26)

    put("Title", 860, 90, 140, 26)

    inc_x = 1020
    put("Reply", inc_x, 210, 125, 28)
    put("Extract", inc_x, 340, 115, 24)
    put("Terms", inc_x, 410, 125, 24)
    put("VisionUC", inc_x, 500, 130, 26)
    put("Summary", inc_x, 590, 120, 26)
    put("ViewPDF", inc_x, 720, 135, 26)
    put("ViewImg", inc_x, 840, 125, 26)

    put("Hover", 1320, 800, 125, 26)

    student = (80, 440)
    qwen = (1520, 320)
    vision = (1520, 520)

    labels = {
        "Register": "Register account",
        "Login": "Login",
        "Logout": "Log out",
        "NewChat": "Start new chat",
        "Browse": "Browse session list",
        "Open": "Open a session",
        "Delete": "Delete a session",
        "Tone": "Change tutor tone",
        "Avatar": "Change tutor avatar",
        "Theme": "Change display theme",
        "Close": "Close document panel",
        "Reopen": "Reopen document panel",
        "Resize": "Resize columns",
        "Send": "Send question message",
        "UpPDF": "Upload PDF",
        "UpImg": "Upload image",
        "History": "View message history",
        "Auto": "Auto-create session",
        "Title": "Generate short session title",
        "Reply": "Generate tutor reply",
        "Extract": "Extract PDF text",
        "Terms": "Extract glossary terms",
        "VisionUC": "Describe visual content",
        "Summary": "Summarize document",
        "ViewPDF": "View PDF with highlights",
        "ViewImg": "View image document",
        "Hover": "Hover term definition",
    }

    parts: list[str] = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
        '<rect width="100%" height="100%" fill="#ffffff"/>',
        '<text x="840" y="28" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="18" font-weight="700" fill="#111">AAA — Use Case Diagram</text>',
        '<rect x="190" y="48" width="1200" height="900" fill="none" stroke="#111" stroke-width="1.8"/>',
        '<text x="200" y="70" font-family="Arial,Helvetica,sans-serif" font-size="13" fill="#111">Agentic Academic Assistant</text>',
        '<text x="40" y="990" font-family="Arial,Helvetica,sans-serif" font-size="12" fill="#111"><tspan font-weight="700">&lt;&lt;include&gt;&gt;</tspan> dashed open arrow: base → included</text>',
        '<text x="40" y="1010" font-family="Arial,Helvetica,sans-serif" font-size="12" fill="#111"><tspan font-weight="700">&lt;&lt;extend&gt;&gt;</tspan> dashed open arrow: extension → base</text>',
        '<text x="40" y="1030" font-family="Arial,Helvetica,sans-serif" font-size="12" fill="#111">Solid line: actor association</text>',
    ]

    def assoc(actor_xy: tuple[float, float], key: str, from_right: bool = False) -> None:
        cx, cy, rx, ry = uc[key]
        ax, ay = actor_xy
        sx = ax - 24 if from_right else ax + 22
        sy = ay
        ex, ey = edge_point(cx, cy, rx, ry, ax, ay)
        parts.append(solid(sx, sy, ex, ey))

    for key in [
        "Register",
        "Login",
        "Logout",
        "NewChat",
        "Browse",
        "Open",
        "Delete",
        "Send",
        "UpPDF",
        "UpImg",
        "Tone",
        "Avatar",
        "Theme",
        "Close",
        "Reopen",
        "Resize",
        "ViewPDF",
        "ViewImg",
    ]:
        assoc(student, key)

    # includes
    parts.append(include_h(uc["Send"], uc["Reply"]))
    parts.append(
        include_bus(
            uc["UpPDF"],
            [uc["Extract"], uc["Terms"], uc["VisionUC"], uc["Summary"], uc["ViewPDF"]],
            bus_x=780,
        )
    )
    parts.append(
        include_bus(
            uc["UpImg"],
            [uc["VisionUC"], uc["Summary"], uc["ViewImg"]],
            bus_x=760,
        )
    )
    # Summary includes Reply — route to the RIGHT so the arrow and <<include>>
    # label are not hidden behind Extract / Terms / Vision ovals
    sx_box = uc["Summary"]
    dx_box = uc["Reply"]
    sx = sx_box[0] + sx_box[2]
    sy = sx_box[1]
    ex = dx_box[0] + dx_box[2]
    ey = dx_box[1]
    bypass_x = sx_box[0] + sx_box[2] + 55
    ah = 11.0
    end_x = ex + ah
    parts.append(dashed_line(sx, sy, bypass_x, sy))
    parts.append(dashed_line(bypass_x, sy, bypass_x, ey))
    parts.append(dashed_line(bypass_x, ey, end_x, ey))
    parts.append(open_head(ex, ey, end_x, ey))
    parts.append(
        f'<rect x="{bypass_x + 6:.1f}" y="{(sy + ey) / 2 - 12:.1f}" width="72" height="16" fill="#fff" fill-opacity="0.95"/>'
    )
    parts.append(
        f'<text x="{bypass_x + 42:.1f}" y="{(sy + ey) / 2:.1f}" text-anchor="middle" '
        f'font-family="Arial,Helvetica,sans-serif" font-size="11" fill="#111">&lt;&lt;include&gt;&gt;</text>'
    )
    parts.append(dep_arrow(uc["Open"], uc["History"], "<<include>>", side=-1))

    # Auto-create + title are required parts of Send / Upload (not optional student choices)
    parts.append(dep_arrow(uc["Send"], uc["Auto"], "<<include>>", side=-1))
    parts.append(dep_arrow(uc["UpPDF"], uc["Auto"], "<<include>>", side=1))
    parts.append(dep_arrow(uc["UpImg"], uc["Auto"], "<<include>>", side=-1))
    parts.append(dep_arrow(uc["Send"], uc["Title"], "<<include>>", side=1))
    parts.append(dep_arrow(uc["UpPDF"], uc["Title"], "<<include>>", side=-1))
    parts.append(dep_arrow(uc["UpImg"], uc["Title"], "<<include>>", side=1))

    # Hover is the only true optional extension
    parts.append(extend_arrow(uc["Hover"], uc["ViewPDF"], side=-1))

    for key in ("Reply", "Terms", "Summary", "Title"):
        assoc(qwen, key, from_right=True)
    assoc(vision, "VisionUC", from_right=True)

    for key, box in uc.items():
        parts.append(ellipse(*box, labels[key]))

    parts.append(actor(student[0], student[1], "Student"))
    parts.append(actor(qwen[0], qwen[1], "Ollama Qwen"))
    parts.append(actor(vision[0], vision[1], "Ollama Vision"))
    parts.append("</svg>")

    out = Path("/root/AAA/Agentic_Academic_Assistant/docs/aaa-use-case-diagram.svg")
    out.write_text("\n".join(parts), encoding="utf-8")
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
