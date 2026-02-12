#!/usr/bin/env python3
"""
Project Timeline Generator - Detailed Gantt Chart Style
========================================================
Generates Gantt-chart style project timeline graphic with
subdivided tasks for the Animal Rescue Platform Capstone Project.

Usage:
    python generate_timeline.py

Requirements:
    pip install matplotlib numpy
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, Rectangle
import numpy as np

def create_timeline():
    """Generate the project timeline visualization as a detailed Gantt chart."""
    
    # Define all tasks organized by phase
    # Each task: (category, task_name, start_week, end_week, color)
    tasks = [
        # Phase 1: Project Initiation & Planning (Weeks 1-2)
        ('Phase 1:\nInitiation &\nPlanning', 'Project Scope Definition', 1, 1, '#4472C4'),
        ('', 'Requirements Refinement', 1, 2, '#4472C4'),
        ('', 'Technology Stack Selection', 1, 2, '#4472C4'),
        ('', 'Team Role Assignment', 2, 2, '#4472C4'),
        ('', 'Development Strategy', 2, 2, '#4472C4'),
        
        # Phase 2: System Design & Architecture (Weeks 3-4)
        ('Phase 2:\nSystem\nDesign', 'Architecture Design', 3, 4, '#ED7D31'),
        ('', 'Database Schema Design', 3, 4, '#ED7D31'),
        ('', 'UI Wireframes', 3, 4, '#ED7D31'),
        ('', 'API Specification', 4, 4, '#ED7D31'),
        ('', 'Accessibility Planning', 4, 4, '#ED7D31'),
        
        # Phase 3: Core Platform Implementation (Weeks 5-9)
        ('Phase 3:\nCore\nImplementation', 'Backend API Development', 5, 9, '#70AD47'),
        ('', 'Supabase Configuration', 5, 6, '#70AD47'),
        ('', 'Authentication Setup', 5, 6, '#70AD47'),
        ('', 'Public Pages (Home)', 6, 7, '#70AD47'),
        ('', 'Animal Catalog', 7, 8, '#70AD47'),
        ('', 'Adoption Application', 8, 9, '#70AD47'),
        ('', 'Unit Testing', 5, 9, '#A9D08E'),
        
        # Phase 4: Admin Features & Integration (Weeks 10-13)
        ('Phase 4:\nAdmin &\nIntegration', 'Admin Dashboard', 10, 12, '#7030A0'),
        ('', 'Animal Management', 10, 11, '#7030A0'),
        ('', 'Application Review', 11, 12, '#7030A0'),
        ('', 'Inventory Management', 12, 13, '#7030A0'),
        ('', 'Role-Based Access', 10, 11, '#7030A0'),
        ('', 'User Acceptance Testing', 12, 13, '#B4A7D6'),
        
        # Phase 5: Testing & Deployment (Weeks 14-16)
        ('Phase 5:\nTesting &\nDeployment', 'Performance Testing', 14, 15, '#C55A11'),
        ('', 'Accessibility Audit', 14, 15, '#C55A11'),
        ('', 'Stress Testing', 15, 15, '#C55A11'),
        ('', 'Final Deployment', 15, 16, '#C55A11'),
        ('', 'Documentation', 14, 16, '#E6B8A2'),
        ('', 'Presentation Prep', 16, 16, '#C55A11'),
    ]
    
    # Milestones: (week, label)
    milestones = [
        (2.5, 'Milestone 1\n(Week 2)'),
        (4.5, 'Milestone 2\n(Week 4)'),
        (9.5, 'Milestone 3\n(Week 9)'),
        (13.5, 'Milestone 4\n(Week 13)'),
        (16.5, 'Milestone 5\n(Week 16)'),
    ]
    
    # Figure setup
    fig, ax = plt.subplots(figsize=(18, 14), facecolor='white')
    ax.set_facecolor('white')
    
    # Timeline parameters
    total_weeks = 16
    n_tasks = len(tasks)
    bar_height = 0.6
    row_height = 1.0
    
    # Calculate dimensions
    y_start = n_tasks * row_height
    
    # Draw vertical grid lines (week markers)
    for week in range(0, total_weeks + 2):
        linewidth = 1.5 if week in [2, 4, 9, 13, 16] else 0.5
        color = '#CCCCCC' if week not in [2, 4, 9, 13, 16] else '#999999'
        ax.axvline(x=week + 0.5, color=color, linewidth=linewidth, zorder=0)
    
    # Draw horizontal grid lines
    for i in range(n_tasks + 1):
        y = i * row_height
        ax.axhline(y=y, color='#E0E0E0', linewidth=0.5, zorder=0)
    
    # Draw phase separator lines (thicker)
    phase_boundaries = [0, 5, 10, 17, 23, 29]  # Row indices where phases change
    for boundary in phase_boundaries:
        y = (n_tasks - boundary) * row_height
        ax.axhline(y=y, color='#333333', linewidth=1.5, zorder=1)
    
    # Draw tasks
    current_category = None
    category_y_positions = []
    
    for i, (category, task_name, start, end, color) in enumerate(tasks):
        y_pos = (n_tasks - i - 0.5) * row_height
        
        # Track category positions for labels
        if category:
            current_category = category
            category_y_positions.append((category, y_pos, i))
        
        # Calculate bar position
        x_start = start - 0.5
        width = end - start + 1
        
        # Draw the task bar
        bar = FancyBboxPatch(
            (x_start, y_pos - bar_height/2), 
            width, 
            bar_height,
            boxstyle="round,pad=0.01,rounding_size=0.08",
            facecolor=color, 
            edgecolor='white', 
            linewidth=1,
            zorder=3
        )
        ax.add_patch(bar)
        
        # Add task name on the left (in the task column)
        ax.text(
            -0.3, 
            y_pos,
            task_name,
            ha='right', 
            va='center',
            fontsize=9, 
            color='#333333',
            zorder=4
        )
    
    # Draw category labels (phase names)
    category_ranges = {
        'Phase 1:\nInitiation &\nPlanning': (0, 5),
        'Phase 2:\nSystem\nDesign': (5, 10),
        'Phase 3:\nCore\nImplementation': (10, 17),
        'Phase 4:\nAdmin &\nIntegration': (17, 23),
        'Phase 5:\nTesting &\nDeployment': (23, 29),
    }
    
    for category, (start_idx, end_idx) in category_ranges.items():
        # Calculate center y position for the category
        y_top = (n_tasks - start_idx) * row_height
        y_bottom = (n_tasks - end_idx) * row_height
        y_center = (y_top + y_bottom) / 2
        
        # Draw category background
        rect = Rectangle(
            (-8.5, y_bottom),
            3.5,
            y_top - y_bottom,
            facecolor='#F5F5F5',
            edgecolor='#CCCCCC',
            linewidth=1,
            zorder=2
        )
        ax.add_patch(rect)
        
        # Add category label
        ax.text(
            -6.75, 
            y_center,
            category,
            ha='center', 
            va='center',
            fontsize=9, 
            fontweight='bold',
            color='#333333',
            zorder=4
        )
    
    # Draw milestones (vertical markers)
    for week, label in milestones:
        # Milestone line
        ax.axvline(x=week, color='#C00000', linewidth=2, linestyle='--', zorder=2, alpha=0.7)
        
        # Milestone diamond at top
        diamond_y = n_tasks * row_height + 0.8
        diamond_size = 0.15
        diamond = plt.Polygon([
            [week, diamond_y + diamond_size * 2],
            [week + diamond_size, diamond_y],
            [week, diamond_y - diamond_size * 2],
            [week - diamond_size, diamond_y]
        ], facecolor='#C00000', edgecolor='white', linewidth=1.5, zorder=5)
        ax.add_patch(diamond)
        
        # Milestone label
        ax.text(
            week, 
            diamond_y + 0.6,
            label,
            ha='center', 
            va='bottom',
            fontsize=8, 
            fontweight='bold',
            color='#C00000',
            zorder=5
        )
    
    # X-axis: Week labels at top
    ax.set_xlim(-8.5, 17.5)
    
    # Week labels at top
    for week in range(1, total_weeks + 1):
        ax.text(
            week, 
            n_tasks * row_height + 0.2,
            f'Week {week}',
            ha='center', 
            va='bottom',
            fontsize=9, 
            color='#333333',
            rotation=0
        )
    
    # Set y limits
    ax.set_ylim(-1, n_tasks * row_height + 3.5)
    
    # Remove all spines and ticks
    ax.axis('off')
    
    # Title
    ax.text(
        4.5, n_tasks * row_height + 3,
        'PROJECT TIMELINE',
        ha='center', va='center',
        fontsize=28, fontweight='bold', color='#333333',
        fontfamily='sans-serif'
    )
    
    # Subtitle
    ax.text(
        4.5, n_tasks * row_height + 2.3,
        'Animal Rescue Platform - Capstone Project',
        ha='center', va='center',
        fontsize=14, color='#666666', style='italic'
    )
    
    # Column headers
    ax.text(-6.75, n_tasks * row_height + 0.2, 'PHASE', 
            ha='center', va='bottom', fontsize=10, fontweight='bold', color='#333333')
    ax.text(-2, n_tasks * row_height + 0.2, 'TASK', 
            ha='center', va='bottom', fontsize=10, fontweight='bold', color='#333333')
    
    # Draw header separator line
    ax.axhline(y=n_tasks * row_height, color='#333333', linewidth=2, zorder=1)
    
    # Legend at bottom
    legend_y = -0.5
    legend_items = [
        ('#4472C4', 'Planning'),
        ('#ED7D31', 'Design'),
        ('#70AD47', 'Development'),
        ('#7030A0', 'Integration'),
        ('#C55A11', 'Deployment'),
        ('#C00000', 'Milestone'),
    ]
    
    ax.text(-8, legend_y, 'Legend:', fontsize=10, fontweight='bold', color='#333333', va='center')
    
    x_pos = -5.5
    for color, label in legend_items:
        if label == 'Milestone':
            # Draw diamond for milestone
            diamond = plt.Polygon([
                [x_pos, legend_y + 0.2],
                [x_pos + 0.15, legend_y],
                [x_pos, legend_y - 0.2],
                [x_pos - 0.15, legend_y]
            ], facecolor=color, edgecolor='white', linewidth=1)
            ax.add_patch(diamond)
        else:
            # Draw rectangle for phase
            rect = FancyBboxPatch(
                (x_pos - 0.4, legend_y - 0.15), 0.8, 0.3,
                boxstyle="round,pad=0.01,rounding_size=0.05",
                facecolor=color, edgecolor='white', linewidth=1
            )
            ax.add_patch(rect)
        
        ax.text(x_pos + 0.7, legend_y, label, fontsize=9, color='#666666', va='center')
        x_pos += 3.5
    
    # Team info at bottom right
    ax.text(
        17, legend_y,
        'Team: J. Montes | F. Sierra | O. Lugo | C. Hernandez',
        ha='right', va='center',
        fontsize=8, color='#888888'
    )
    
    plt.tight_layout()
    
    # Save the figure
    plt.savefig('project_timeline.png', dpi=300, bbox_inches='tight', 
                facecolor='white', edgecolor='none')
    plt.savefig('project_timeline.pdf', bbox_inches='tight', 
                facecolor='white', edgecolor='none')
    plt.savefig('project_timeline.svg', bbox_inches='tight', 
                facecolor='white', edgecolor='none')
    
    print("Timeline graphics generated successfully!")
    print("   project_timeline.png (300 DPI)")
    print("   project_timeline.pdf (Vector)")
    print("   project_timeline.svg (Vector)")

if __name__ == '__main__':
    create_timeline()
