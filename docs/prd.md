# GitScope — TUI PR Review Tool

## Problem

Reviewing local changes before committing is clunky. `git diff` output is flat and hard to navigate. No easy way to annotate changes and feed those annotations to AI for fixes.

## Solution

A terminal-based diff review tool that watches local file changes, displays diffs in real-time, and exposes review comments via MCP for Claude Code to action on — all with neovim-style keybindings.

## Stack

- **Runtime:** Node.js / Bun
- **TUI Framework:** Ink (React for terminals)
- **File Watching:** chokidar
- **Diff Engine:** diff
- **Git Operations:** simple-git
- **Keybindings:** Ink `useInput` hook
- **Distribution:** Standalone CLI (`npm` / `bun build`)

## Usage

Run from repo root:

```bash
gitscope              # opens TUI, defaults to current branch vs main
gitscope --base dev   # compare against specific base
```

## Core Features

### P0 — Local Diff Review

- **Default comparison:** current HEAD vs `main`. No remote/GitHub integration.
- **Branch switching keybinds:**
  - `sb` — switch base branch (fuzzy-filtered list)
  - `st` — switch target branch (fuzzy-filtered list)
  - Status bar shows `target ← base` at all times
- **Branch list:** Show all local branches, filter to ones with actual diffs when possible.
- File tree panel showing changed files with status (A/M/D)
- Unified diff view with syntax-highlighted additions/removals
- Vim navigation: `j/k` scroll lines, `h/l` switch panels, `gg/G` top/bottom, `/` search
- Debounced file watching — re-diffs only changed files
- Diff computation offloaded to worker threads
- **Worktrees:** Works fine — run `gitscope` from within any worktree directory. Each worktree is a valid git dir. No cross-worktree viewing.

### P1 — Inline Comments + MCP

- `c` on a diff line opens comment input. Comments anchored to file:line:branch.
- Comments persisted to `.gitscope/comments.json` in repo root (gitignore-friendly).
- **MCP Server** exposes comments as tools:
  - `get_review_comments` — returns all comments with file paths, line numbers, content, and diff context
  - `get_comments_by_file(path)` — scoped to a single file
  - `resolve_comment(id)` — mark a comment as resolved
- MCP runs as a sidecar process (`gitscope mcp`) or embedded in the TUI process on a stdio transport.
- **Use case:** Run gitscope, leave comments like "refactor this to use a map" → ask Claude via Claude Code to read comments and fix them.

#### Comment Schema

```json
{
  "id": "uuid",
  "file": "src/utils.ts",
  "line": 42,
  "branch": "feature/auth",
  "base": "main",
  "content": "this should be a reduce not a forEach",
  "resolved": false,
  "createdAt": "ISO8601"
}
```

### P2 — Polish

- Mark files as reviewed (checkbox state)
- Side-by-side diff view toggle (`<Tab>`)
- Jump between hunks (`]c` / `[c` — vim-diff style)
- Copy hunk/file path with keybind
- Configurable themes (colors, diff styles)
- `.gitscoperc` config file (default branch, keybinds)
- WezTerm integration docs (keybind to open in split pane)
- Neovim plugin (optional, shells out to `gitscope`)

## Architecture

```
┌─────────────────────────────────────────┐
│              Ink React TUI              │
│  ┌──────────┐  ┌──────────────────────┐ │
│  │ File Tree │  │    Diff Viewer       │ │
│  │  Panel    │  │  (unified/split)     │ │
│  │           │  │                      │ │
│  │  A file1  │  │  - old line          │ │
│  │  M file2  │  │  + new line  💬 [1]  │ │
│  │  D file3  │  │                      │ │
│  └──────────┘  └──────────────────────┘ │
│  ┌──────────────────────────────────────┐│
│  │ Status: feature/auth ← main | 3 files  ││
│  │ [sb] switch base  [st] switch target    ││
│  └──────────────────────────────────────┘│
└─────────────────────────────────────────┘

Background:
  chokidar → debounce → worker thread (diff) → state update → re-render

MCP Sidecar:
  .gitscope/comments.json ← TUI writes
  gitscope mcp (stdio) → Claude Code reads/resolves comments
```

## Key Decisions

- **Standalone binary first**, neovim plugin later. WezTerm pane is the primary integration.
- **Unified diff default**, side-by-side as toggle. Keeps TUI simpler initially.
- **Worker threads for diffing** to keep UI responsive on large repos.
- **No database** — comments in `.gitscope/comments.json`, everything else from git.
- **MCP over stdio** — simplest transport, works natively with Claude Code.
- **Worktrees supported** — just run from within the worktree directory.
- **Local only** — no remote/GitHub integration. Pure local diff review.

## MVP Scope (P0 + P1)

Ship local diff review with file watching, vim navigation, base/target branch switching, inline comments, and MCP server. Target: review changes, leave comments, have Claude fix them via Claude Code.

## Success Criteria

- Opens in <500ms
- Diff updates within 200ms of file save
- Comfortable to use without touching the mouse
