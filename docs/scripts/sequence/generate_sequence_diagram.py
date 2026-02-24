#!/usr/bin/env python3
"""
Application Sequence Diagram Generator
Creates a UML-style sequence diagram for core Animal Rescue Platform workflows.
"""

import os
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Rectangle


def create_sequence_diagram():
    participants = [
        ("U_PUBLIC", "Public Visitor"),
        ("WEB", "Web App\n(Next.js)"),
        ("API", "API Routes\n(Vercel)"),
        ("DB", "Supabase\nPostgres"),
        ("ADMIN", "Admin\nDashboard"),
        ("R2", "Cloudflare R2"),
        ("EMAIL", "Email\nService"),
        ("PAY", "Payment\nProvider"),
    ]

    messages = [
        ("U_PUBLIC", "WEB", "1. Open adoptable animals page", "request"),
        ("WEB", "API", "2. GET /api/animals?filters", "request"),
        ("API", "DB", "3. SELECT available animals", "request"),
        ("DB", "API", "4. Animal records", "response"),
        ("API", "WEB", "5. 200 JSON list", "response"),
        ("U_PUBLIC", "WEB", "6. Submit adoption application", "request"),
        ("WEB", "API", "7. POST /api/applications", "request"),
        ("API", "DB", "8. INSERT application (pending)", "request"),
        ("DB", "API", "9. Insert success + application_id", "response"),
        ("API", "EMAIL", "10. Queue admin notification", "external"),
        ("API", "WEB", "11. 201 Created", "response"),
        ("WEB", "U_PUBLIC", "12. Show confirmation", "response"),
        ("ADMIN", "API", "13. GET pending applications", "request"),
        ("API", "DB", "14. SELECT pending applications", "request"),
        ("DB", "API", "15. Pending application records", "response"),
        ("API", "ADMIN", "16. Return review queue", "response"),
        ("ADMIN", "API", "17. PATCH application decision", "request"),
        ("API", "DB", "18. UPDATE status", "request"),
        ("API", "EMAIL", "19. Notify applicant decision", "external"),
        ("API", "ADMIN", "20. 200 Updated", "response"),
        ("ADMIN", "API", "21. POST /api/animals (metadata)", "request"),
        ("ADMIN", "R2", "22. Upload animal photo(s)", "external"),
        ("R2", "ADMIN", "23. Return public image URL(s)", "response"),
        ("API", "DB", "24. INSERT animal + image URL(s)", "request"),
        ("DB", "API", "25. Insert success", "response"),
        ("API", "ADMIN", "26. 201 Created", "response"),
        ("WEB", "API", "27. Refresh catalog (GET /api/animals)", "request"),
        ("API", "WEB", "28. Updated animal list", "response"),
        ("U_PUBLIC", "WEB", "29. Click Donate", "request"),
        ("WEB", "PAY", "30. Redirect to hosted checkout", "external"),
        ("PAY", "U_PUBLIC", "31. Collect payment details", "external"),
        ("PAY", "WEB", "32. Return success/cancel token", "response"),
        ("WEB", "API", "33. POST /api/donations/log", "request"),
        ("API", "DB", "34. Persist donation outcome audit", "request"),
        ("API", "WEB", "35. 200 Logged", "response"),
        ("WEB", "U_PUBLIC", "36. Show thank-you/retry state", "response"),
    ]

    section_ranges = [
        ("A. Adoption Journey + Admin Review", 1, 20, "#E3F2FD"),
        ("B. Admin Animal Listing Creation", 21, 28, "#E8F5E9"),
        ("C. Donation Redirect (External Provider)", 29, 36, "#FFF3E0"),
    ]

    kind_style = {
        "request": {"color": "#1565C0", "linestyle": "solid"},
        "response": {"color": "#546E7A", "linestyle": "dashed"},
        "external": {"color": "#AD1457", "linestyle": "solid"},
    }

    fig, ax = plt.subplots(figsize=(24, 17), facecolor="#FAFAFA")
    ax.set_facecolor("white")

    x_map = {pid: idx + 1 for idx, (pid, _) in enumerate(participants)}
    total_messages = len(messages)
    header_y = total_messages + 6
    message_start_y = total_messages + 4.4
    step = 1.0
    lifeline_bottom_y = 1.2

    for pid, label in participants:
        x = x_map[pid]
        box = FancyBboxPatch(
            (x - 0.55, header_y - 0.5),
            1.1,
            0.9,
            boxstyle="round,pad=0.02,rounding_size=0.08",
            facecolor="#FFFFFF",
            edgecolor="#424242",
            linewidth=1.4,
            zorder=5,
        )
        ax.add_patch(box)
        ax.text(
            x,
            header_y - 0.05,
            label,
            ha="center",
            va="center",
            fontsize=10,
            fontweight="bold",
            color="#1F1F1F",
            zorder=6,
        )
        ax.plot(
            [x, x],
            [header_y - 0.6, lifeline_bottom_y],
            linestyle=(0, (4, 4)),
            color="#B0BEC5",
            linewidth=1.1,
            zorder=1,
        )

    def y_for_message(index):
        return message_start_y - (index - 1) * step

    full_width_x = len(participants) + 0.75
    for section_name, start_idx, end_idx, color in section_ranges:
        y_first = y_for_message(start_idx)
        y_last = y_for_message(end_idx)
        rect_y = y_last - 0.45
        rect_h = (y_first - y_last) + 0.9
        section_rect = Rectangle(
            (0.25, rect_y),
            full_width_x - 0.25,
            rect_h,
            facecolor=color,
            edgecolor="none",
            alpha=0.35,
            zorder=0,
        )
        ax.add_patch(section_rect)
        ax.text(
            0.35,
            y_first + 0.34,
            section_name,
            ha="left",
            va="center",
            fontsize=10,
            fontweight="bold",
            color="#263238",
            zorder=2,
        )

    for idx, (src, dst, label, kind) in enumerate(messages, start=1):
        y = y_for_message(idx)
        x0 = x_map[src]
        x1 = x_map[dst]
        style = kind_style[kind]

        ax.annotate(
            "",
            xy=(x1, y),
            xytext=(x0, y),
            arrowprops=dict(
                arrowstyle="->",
                lw=1.8,
                color=style["color"],
                linestyle=style["linestyle"],
                shrinkA=5,
                shrinkB=5,
            ),
            zorder=3,
        )

        text_x = (x0 + x1) / 2
        ax.text(
            text_x,
            y + 0.16,
            label,
            ha="center",
            va="bottom",
            fontsize=8.8,
            color="#212121",
            bbox=dict(
                boxstyle="round,pad=0.14",
                facecolor="white",
                edgecolor="#CFD8DC",
                linewidth=0.8,
                alpha=0.92,
            ),
            zorder=4,
        )

    ax.text(
        (len(participants) + 1) / 2,
        total_messages + 7.3,
        "Animal Rescue Platform - Application Sequence Diagram",
        ha="center",
        va="center",
        fontsize=23,
        fontweight="bold",
        color="#1B1B1B",
    )

    ax.text(
        0.35,
        0.45,
        "Line styles: solid=commands/events, dashed=responses/returns",
        ha="left",
        va="center",
        fontsize=9,
        color="#455A64",
    )

    ax.set_xlim(0.2, len(participants) + 0.8)
    ax.set_ylim(0, total_messages + 8.2)
    ax.axis("off")

    current_dir = os.path.dirname(os.path.abspath(__file__))

    plt.savefig(
        os.path.join(current_dir, "application_sequence_diagram.png"),
        dpi=300,
        bbox_inches="tight",
        facecolor="white",
        edgecolor="none",
    )
    plt.savefig(
        os.path.join(current_dir, "application_sequence_diagram.svg"),
        bbox_inches="tight",
        facecolor="white",
        edgecolor="none",
    )
    plt.savefig(
        os.path.join(current_dir, "application_sequence_diagram.pdf"),
        bbox_inches="tight",
        facecolor="white",
        edgecolor="none",
    )

    print("Sequence diagram generated successfully:")
    print("  - application_sequence_diagram.png")
    print("  - application_sequence_diagram.svg")
    print("  - application_sequence_diagram.pdf")


if __name__ == "__main__":
    create_sequence_diagram()
