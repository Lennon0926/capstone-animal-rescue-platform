#!/usr/bin/env python3
"""
Project Timeline Generator - Burgundy & Charcoal Professional Style
Generates a detailed project timeline graphic for the Animal Rescue Platform
"""

import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Rectangle
import os


def create_timeline():

    # --------------------------------
    # COLOR PALETTE
    # --------------------------------

    PLANNING = "#4A1E1E"  # Burgundy oscuro
    DESIGN = "#7A2E2E"  # Burgundy medio
    DEVELOPMENT = "#1F3A3D"  # Verde oscuro elegante
    INTEGRATION = "#343A40"  # Gris carbón
    TESTING = "#212529"  # Gris negro
    DOCUMENTATION = "#CED4DA"  # Gris claro profesional
    MILESTONE = "#000000"

    BLACK_SOFT = "#1A1A1A"
    GRAY_DARK = "#2F2F2F"
    BG_LIGHT = "#F4F4F4"

    # -------------------------------
    # TASK DEFINITIONS (UNCHANGED)
    # -------------------------------

    tasks = [
        (
            "Phase 1:\nInitiation &\nPlanning",
            "Project Scope Definition",
            1,
            1,
            PLANNING,
        ),
        ("", "Requirements Refinement", 1, 2, PLANNING),
        ("", "Technology Stack Selection", 1, 2, PLANNING),
        ("", "Team Role Assignment", 2, 2, PLANNING),
        ("", "Development Strategy", 2, 2, PLANNING),
        ("Phase 2:\nSystem\nDesign", "Architecture Design", 3, 4, DESIGN),
        ("", "Database Schema Design", 3, 4, DESIGN),
        ("", "UI Wireframes", 3, 4, DESIGN),
        ("", "API Specification", 4, 4, DESIGN),
        ("", "Accessibility Planning", 4, 4, DESIGN),
        (
            "Phase 3:\nCore\nImplementation",
            "Backend API Development",
            5,
            9,
            DEVELOPMENT,
        ),
        ("", "Supabase Configuration", 5, 6, DEVELOPMENT),
        ("", "Authentication Setup", 5, 6, DEVELOPMENT),
        ("", "Public Pages (Home)", 6, 7, DEVELOPMENT),
        ("", "Animal Catalog", 7, 8, DEVELOPMENT),
        ("", "Adoption Application", 8, 9, DEVELOPMENT),
        ("", "Unit Testing", 5, 9, TESTING),
        ("Phase 4:\nAdmin &\nIntegration", "Admin Dashboard", 10, 12, INTEGRATION),
        ("", "Animal Management", 10, 11, INTEGRATION),
        ("", "Application Review", 11, 12, INTEGRATION),
        ("", "Inventory Management", 12, 13, INTEGRATION),
        ("", "Role-Based Access", 10, 11, INTEGRATION),
        ("", "User Acceptance Testing", 12, 13, TESTING),
        ("Phase 5:\nTesting &\nDeployment", "Performance Testing", 14, 15, TESTING),
        ("", "Accessibility Audit", 14, 15, TESTING),
        ("", "Stress Testing", 15, 15, TESTING),
        ("", "Final Deployment", 15, 16, DEVELOPMENT),
        ("", "Documentation", 14, 16, DOCUMENTATION),
        ("", "Presentation Prep", 16, 16, DEVELOPMENT),
    ]

    milestones = [
        (2.5, "Milestone 1\n(Week 2)"),
        (4.5, "Milestone 2\n(Week 4)"),
        (9.5, "Milestone 3\n(Week 9)"),
        (13.5, "Milestone 4\n(Week 13)"),
        (16.5, "Milestone 5\n(Week 16)"),
    ]

    # -------------------------------
    # FIGURE SETUP
    # -------------------------------

    fig, ax = plt.subplots(figsize=(18, 14), facecolor=BG_LIGHT)
    ax.set_facecolor("white")

    n_tasks = len(tasks)
    bar_height = 0.65
    row_height = 1.0

    # Horizontal grid only
    for i in range(n_tasks + 1):
        ax.axhline(y=i * row_height, color="#ECECEC", linewidth=0.6, zorder=0)

    phase_boundaries = [0, 5, 10, 17, 23, 29]
    for boundary in phase_boundaries:
        y = (n_tasks - boundary) * row_height
        ax.axhline(y=y, color=GRAY_DARK, linewidth=1.4, zorder=1)

    # -------------------------------
    # DRAW TASK BARS
    # -------------------------------

    for i, (category, task_name, start, end, color) in enumerate(tasks):

        y_pos = (n_tasks - i - 0.5) * row_height
        x_start = start - 0.5
        width = end - start + 1

        bar = FancyBboxPatch(
            (x_start, y_pos - bar_height / 2),
            width,
            bar_height,
            boxstyle="round,pad=0.02,rounding_size=0.1",
            facecolor=color,
            edgecolor="white",
            linewidth=1.2,
            zorder=3,
        )
        ax.add_patch(bar)

        ax.text(
            -0.3,
            y_pos,
            task_name,
            ha="right",
            va="center",
            fontsize=9.5,
            color=BLACK_SOFT,
            zorder=4,
        )

    # -------------------------------
    # PHASE LABEL BACKGROUNDS
    # -------------------------------

    category_ranges = {
        "Phase 1:\nInitiation &\nPlanning": (0, 5),
        "Phase 2:\nSystem\nDesign": (5, 10),
        "Phase 3:\nCore\nImplementation": (10, 17),
        "Phase 4:\nAdmin &\nIntegration": (17, 23),
        "Phase 5:\nTesting &\nDeployment": (23, 29),
    }

    for category, (start_idx, end_idx) in category_ranges.items():

        y_top = (n_tasks - start_idx) * row_height
        y_bottom = (n_tasks - end_idx) * row_height
        y_center = (y_top + y_bottom) / 2

        rect = Rectangle(
            (-8.5, y_bottom),
            3.5,
            y_top - y_bottom,
            facecolor="#F2E9E9",
            edgecolor=GRAY_DARK,
            linewidth=1.2,
            zorder=1,
        )
        ax.add_patch(rect)

        ax.text(
            -6.75,
            y_center,
            category,
            ha="center",
            va="center",
            fontsize=10,
            fontweight="bold",
            color=BLACK_SOFT,
            zorder=4,
        )

    # -------------------------------
    # MILESTONES
    # -------------------------------

    y_min = 0
    y_max = n_tasks * row_height

    for week, label in milestones:

        ax.vlines(
            x=week,
            ymin=y_min,
            ymax=y_max,
            color=MILESTONE,
            linewidth=1.2,
            linestyles="dashed",
            alpha=0.4,
            zorder=2,
        )

        diamond_y = y_max + 0.6
        size = 0.18

        diamond = plt.Polygon(
            [
                [week, diamond_y + size],
                [week + size, diamond_y],
                [week, diamond_y - size],
                [week - size, diamond_y],
            ],
            facecolor=MILESTONE,
            edgecolor="white",
            linewidth=1.2,
            zorder=5,
        )
        ax.add_patch(diamond)

        ax.text(
            week,
            diamond_y + 0.45,
            label,
            ha="center",
            va="bottom",
            fontsize=8.5,
            fontweight="bold",
            color=MILESTONE,
            zorder=5,
        )

    # -------------------------------
    # TITLE
    # -------------------------------

    ax.set_xlim(-8.5, 17.5)
    ax.set_ylim(-1, n_tasks * row_height + 3.8)
    ax.axis("off")

    ax.text(
        4.5,
        n_tasks * row_height + 3,
        "Animal Rescue Platform - Project Timeline",
        ha="center",
        va="center",
        fontsize=32,
        fontweight="bold",
        color=BLACK_SOFT,
        style="italic",
    )

    # -------------------------------
    # LEGEND
    # -------------------------------

    legend_y = -0.6

    ax.text(
        -8,
        legend_y,
        "Legend:",
        fontsize=10,
        fontweight="bold",
        color=BLACK_SOFT,
        va="center",
    )

    legend_items = [
        (PLANNING, "Planning"),
        (DESIGN, "Design"),
        (DEVELOPMENT, "Development"),
        (INTEGRATION, "Integration"),
        (TESTING, "Testing"),
        (DOCUMENTATION, "Documentation"),
    ]

    x_pos = -5.5
    for color, label in legend_items:

        rect = FancyBboxPatch(
            (x_pos - 0.4, legend_y - 0.15),
            0.8,
            0.3,
            boxstyle="round,pad=0.01,rounding_size=0.05",
            facecolor=color,
            edgecolor="white",
            linewidth=1,
        )
        ax.add_patch(rect)

        ax.text(x_pos + 0.7, legend_y, label, fontsize=9, color=GRAY_DARK, va="center")

        x_pos += 3.5

    # Milestone legend
    diamond = plt.Polygon(
        [
            [x_pos, legend_y + 0.15],
            [x_pos + 0.15, legend_y],
            [x_pos, legend_y - 0.15],
            [x_pos - 0.15, legend_y],
        ],
        facecolor=MILESTONE,
        edgecolor="white",
        linewidth=1,
    )
    ax.add_patch(diamond)

    ax.text(
        x_pos + 0.6, legend_y, "Milestone", fontsize=9, color=GRAY_DARK, va="center"
    )

    # -------------------------------
    # SAVE
    # -------------------------------

    current_dir = os.path.dirname(os.path.abspath(__file__))

    plt.savefig(
        os.path.join(current_dir, "project_timeline.png"),
        dpi=300,
        bbox_inches="tight",
        facecolor="white",
        edgecolor="none",
    )

    plt.savefig(
        os.path.join(current_dir, "project_timeline.pdf"),
        bbox_inches="tight",
        facecolor="white",
        edgecolor="none",
    )

    plt.savefig(
        os.path.join(current_dir, "project_timeline.svg"),
        bbox_inches="tight",
        facecolor="white",
        edgecolor="none",
    )

    print("Timeline graphics generated successfully.")


if __name__ == "__main__":
    create_timeline()
