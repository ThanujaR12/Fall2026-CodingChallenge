# Start Here — Change++ Fall 2026 Coding Challenge (Spec Kit workflow)

These files are the inputs for the Spec Kit commands. Put this whole folder in your fork at:

```
docs/requirements/
```

Then commit it before running any Spec Kit command:

```
git add docs/requirements
git commit -m "docs: add challenge requirements and spec inputs"
```

## Files

| File | Used by | Purpose |
|------|---------|---------|
| `01-challenge-requirements.md` | All steps | Summary of the official challenge rules and grading rubric |
| `02-constitution-input.md` | `/speckit.constitution` | Project principles (run once) |
| `03-feature-1-core.md` | `/speckit.specify` | Feature 1: search + collections (the minimum submittable app) |
| `04-feature-2-collaboration.md` | `/speckit.specify` | Feature 2: accounts + sharing + collaboration |
| `05-feature-3-standout.md` | `/speckit.specify` | Feature 3: signature creative feature + bonus items |
| `06-tech-stack-plan-input.md` | `/speckit.plan` | Tech stack, folder structure, data model, API endpoints |

## Command order (in Claude Code)

Run once:

```
/speckit.constitution Use docs/requirements/02-constitution-input.md and docs/requirements/01-challenge-requirements.md as the source for the project principles.
```

Then repeat this loop for **each feature** (1, then 2, then 3):

```
/speckit.specify Use docs/requirements/03-feature-1-core.md as the feature description.
/speckit.clarify
/speckit.plan Use docs/requirements/06-tech-stack-plan-input.md. Match the visual design in design/.
/speckit.tasks
/speckit.analyze
/speckit.implement   (one phase at a time — test, read, commit after each)
/speckit.converge    (repeat implement/converge until it reports Converged)
```

> If your agent shows the commands as `/speckit-specify` instead of `/speckit.specify`, use that form.

## Rules for yourself during implement

- Implement **one phase or a few tasks at a time**, never everything at once.
- After each chunk: run the app → test it → read the code until you can explain it → commit.
- Commit message style: `feat(api): add remove-image endpoint`, `fix(ui): empty state on collections page`, `docs: document share endpoints`.
- Do not start Feature 2 until Feature 1 works end to end and is committed.

## Deadline checklist (Fri 9/18, 11:59 PM CT)

- [ ] Feature 1 works end to end (this alone is submittable)
- [ ] Feature 2 works (accounts + sharing + collaboration)
- [ ] Feature 3 signature feature works
- [ ] `specs/` folder committed (shows your planning)
- [ ] `README.txt` (not .md) with full name, Vanderbilt email, run steps, reflection (<100 words), feedback
- [ ] Fresh clone tested with README instructions
- [ ] Everything pushed to your fork
- [ ] **Completion form submitted**
