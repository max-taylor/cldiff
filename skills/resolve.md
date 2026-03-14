---
description: Read review comments from .cldiff/comments.json and resolve them by implementing the requested changes.
argument-hint: "[all | <file-path> | <comment-id>]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
disable-model-invocation: true
---

# Resolve cldiff Review Comments

You are resolving inline review comments left in a TUI diff viewer. Comments are anchored to a specific file and line number.

## Step 0: Load Comments

1. Read `.cldiff/comments.json` in the repo root.
2. If the file doesn't exist or is empty, tell the user there are no comments and stop.
3. Filter to comments where `"resolved": false`.
4. If no unresolved comments, tell the user everything is resolved and stop.

## Step 1: Select Scope

Based on `$ARGUMENTS`:

- **No args or "all"**: Process all unresolved comments.
- **A file path** (e.g. `src/cli.tsx`): Only process comments matching that file.
- **A UUID**: Only process the single comment with that id.

## Step 2: Present Comments

For each unresolved comment in scope:

1. Read the referenced file at the comment's `line` number (show ~5 lines of surrounding context).
2. Print a summary table:
   - File, line number, comment content, created date.

Group comments by file so related changes are visible together.

## Step 3: Triage Each Comment

For each comment, assess whether it's actionable:

**Actionable** — The comment clearly describes a code change (refactor, fix, rename, add, remove, etc.). Proceed to implement.

**Unclear / Needs Info** — The comment is ambiguous, a question, or too vague to act on (e.g. "hey", "test", "k", single characters). Flag these back to the user:
- Print the comment with its file context.
- Explain why it's unclear.
- Ask what the user wants done, or skip it.

**Too Complex** — The comment requests a large change that touches many files or requires architectural decisions. Flag these back:
- Print the comment with context.
- Describe the scope/complexity.
- Suggest an approach and ask for confirmation before proceeding.

## Step 4: Implement Actionable Comments

For each actionable comment:

1. Make the code change in the referenced file.
2. After editing, read back the changed area to verify correctness.
3. Run `pnpm typecheck` to validate.

If a change breaks typecheck, fix it before moving on.

## Step 5: Mark Resolved

After successfully implementing a comment:

1. Read the current `.cldiff/comments.json` (re-read to avoid stale data).
2. Set `"resolved": true` for each comment that was implemented.
3. Write the updated JSON back to `.cldiff/comments.json`.

Do NOT mark unclear/skipped comments as resolved.

## Step 6: Summary

Print a final report:

- **Resolved**: List of comments that were implemented (file:line — what was done).
- **Skipped/Unclear**: List of comments that need user input.
- **Flagged as Complex**: List of comments that need discussion.
- **Remaining unresolved**: Count of comments still open.

## Rules

- **Do NOT mark a comment resolved unless the change is actually implemented and verified.**
- **Do NOT silently skip comments.** Every unresolved comment must be either implemented, flagged, or explicitly asked about.
- **Re-read `.cldiff/comments.json` before writing** to avoid overwriting concurrent changes from the TUI.
- **Keep changes minimal.** Only change what the comment asks for — don't refactor surrounding code.
- **Match existing code patterns** in the file you're editing.
