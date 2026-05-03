# Architecture Diagram Generator

This directory contains the source of truth for **Figure 1** in the report.

- Script: `generate_architecture_diagram.py`
- Report-ready writeup: `../../reports/figure-1-system-architecture.md`
- Outputs:
  - `system_architecture_figure_1.dot`
  - `system_architecture_figure_1.svg`
  - `system_architecture_figure_1.pdf`
  - `system_architecture_figure_1.png`

Run it from the repository root:

```bash
python3 docs/scripts/architecture/generate_architecture_diagram.py
```

The script writes a DOT source file and renders the final assets through the
local Graphviz `dot` CLI, avoiding any dependency on the Python `graphviz`
package.

The older `docs/scripts/flowchart/` assets remain in the repository for their
original flowchart use, but they are **not** the source of truth for Figure 1.
