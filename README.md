# Project Development Setup

## Virtual Environment Setup (Provisional)

This repository includes a **provisional Python virtual environment** to support early development tasks such as scripts, prototypes, testing, or automation.

The final technology stack for this project has **not yet been defined**. This setup exists only to establish good development practices and may change as the project evolves.

---

## Requirements

- Python 3.10 or higher
- Git
- Terminal (macOS, Linux, or Windows with WSL)

Verify your Python version:

```bash
python3 --version
```

---

## Create the Virtual Environment

From the root of the repository:

```bash
python3 -m venv venv
```

This command creates a local virtual environment inside the `venv/` directory.

---

## Activate the Virtual Environment

### macOS / Linux / WSL

```bash
source venv/bin/activate
```

### Windows (PowerShell)

```powershell
venv\Scripts\Activate.ps1
```

When activated, your terminal prompt should indicate that the environment is active.

---

## Upgrade Base Tooling

Once the virtual environment is active, upgrade the base Python tooling:

```bash
pip install --upgrade pip setuptools wheel
```

These are standard tools required for package management and builds.

---

## Install Default Dependencies

If this is the first time setting up the project **and `requirements.txt` already exists**, install all dependencies with:

```bash
pip install -r requirements.txt
```

This is the recommended approach for new team members.

If the file does not exist yet, install a minimal set of commonly used dependencies for general development:

```bash
pip install python-dotenv requests pytest
```

Purpose of these packages:

- `python-dotenv`: environment variable management
- `requests`: HTTP client for prototyping and testing
- `pytest`: basic testing framework

---

## Generate `requirements.txt`

After installing dependencies, generate the dependency file:

```bash
pip freeze > requirements.txt
```

This file should be updated whenever new dependencies are added.

---

## Deactivate the Virtual Environment

When finished working:

```bash
deactivate
```

---

## Files Excluded from Version Control

Ensure the following entries exist in `.gitignore`:

```gitignore
venv/
__pycache__/
*.pyc
.env
```

---

## Stack Disclaimer

This setup does **not** define the final architecture, backend language, or deployment strategy of the project.

All final technical decisions will be documented in the **Technical Approach** section of the project proposal and updated as needed.

