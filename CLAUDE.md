# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is GitScope

GitScope is a TUI (Terminal User Interface) PR review tool built with React, Ink, and Bun. It provides vim-style navigation for reviewing local git changes (staged and unstaged) with real-time file watching and diff viewing.

## Commands

```bash
bun install              # Install dependencies
bun run start            # Run the app (bun run src/cli.tsx)
bun run typecheck        # Type check (tsc --noEmit)
bun test                 # Run all tests
bun test src/services/git.test.ts  # Run a specific test file
```

## Bun Runtime

Default to Bun for everything — `bun <file>`, `bun test`, `bun install`. Bun auto-loads .env files. Use `bun:test` for tests, `Bun.file` over `node:fs`, `Bun.$` over `execa`.

## Architecture

**Entry:** `src/cli.tsx` → initializes Ink's alternate screen buffer (fullscreen) and renders `<App>`.

**Component tree:**
```
<App>
├── <FileTree />       — Left panel: changed files with vim nav (j/k/G/g/Enter)
├── <DiffViewer />     — Right panel: unified diff with search (/)
└── <StatusBar />      — Bottom bar: branch, file count, key hints
```

**Hooks (src/hooks/):**
- `useGitState` — Master state: files, diffs, file watcher setup, session filtering. Central data flow hub.
- `useAppKeybindings` — Global keybindings (q/h/l/a/s), panel focus.
- `useVimNavigation` — Reusable vim-style list navigation (j/k/G/g/Enter).

**Services (src/services/):**
- `git.ts` — `GitService` class wrapping `simple-git`. Handles changed file detection (A/M/D status), unified diff generation for staged/unstaged files. Special handling for untracked files via `git diff --no-index`.
- `watcher.ts` — `FileWatcher` using chokidar. Watches working directory + `.git/index` and `.git/HEAD`. Debounced (150ms) onChange callback triggers state refresh.

**Data flow:** FileWatcher detects changes → increments tick in useGitState → re-fetches file list → user selects file → fetches diff → DiffViewer renders parsed lines.

## Testing

Tests use `bun:test` with `beforeAll`/`afterAll` lifecycle hooks. Git tests create temporary repos with real git operations (init, commit, branch). Test files are colocated with source (`*.test.ts`).
