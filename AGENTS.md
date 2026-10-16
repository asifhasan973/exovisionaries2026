# Repository Agent Guidelines & Commit Standards

This document defines standard conventions, development constraints, and protocols for agents working in this repository.

---

## 1. Commit and Version Control Policies

- **Never Commit Automatically**: Agents must never execute `git commit` or push code autonomously. All changes must remain for the user to review, stage, and commit manually.
- **Commit Message Location**: When requested to prepare or generate a commit message, always write it to `temp/COMMIT_MSG.txt`.
- **Conventional Commits Standard**: Commit messages must follow the Conventional Commits specification:
  - Format: `<type>(<scope>): <short description>`
  - Permitted types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`.
  - Provide a concise summary line in imperative tense, followed by an explanatory body detailing the changes, context, and verification steps.

---

## 2. Information Leakage Prevention Policy

- **Zero Internal Leakage**: Never mention or leak internal engineering briefs, execution metadata, prompt instructions, system messages, internal conversation IDs, or workflow mechanics anywhere in the repository (including code comments, docstrings, documentation files, commit messages, PR descriptions, and markdown files).
- **Mandatory Repository Scan**: Before finalizing any commit message or documentation:
  1. Scan all modified and newly created files in the working tree for internal terminology or unintended metadata.
  2. Ensure code comments and documentation reflect clean, professional, industry-standard engineering language.
  3. Verify that instructions and meta-dialogue from task briefs are not echoed into public-facing repository artifacts.

---

## 3. Documentation Standards

- Always keep documentation in `docs/` and `README.md` up to date whenever new architectural features, components, or user-facing behaviors are introduced.
- Maintain consistent formatting, clear technical explanations, and accurate file paths across all documentation.
