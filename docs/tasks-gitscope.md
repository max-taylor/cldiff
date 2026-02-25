# Tasks: GitScope TUI PR Review Tool

> Source: docs/prd.md
> Generated: 2026-02-25

## Relevant Files

- `package.json` - Project config, dependencies, bin entry
- `tsconfig.json` - TypeScript configuration
- `src/cli.tsx` - CLI entry point, arg parsing
- `src/app.tsx` - Root Ink app component, layout, panel switching
- `src/services/git.ts` - Git operations (branches, diffs, file statuses)
- `src/services/watcher.ts` - Chokidar file watching with debounce
- `src/services/diff-worker.ts` - Worker thread for diff computation
- `src/services/comments.ts` - Comment CRUD, JSON persistence
- `src/components/file-tree.tsx` - File tree panel component
- `src/components/diff-viewer.tsx` - Diff viewer panel component
- `src/components/branch-picker.tsx` - Fuzzy branch picker overlay
- `src/components/status-bar.tsx` - Status bar component
- `src/components/comment-input.tsx` - Inline comment input component
- `src/hooks/use-vim-navigation.ts` - Shared vim keybinding hook
- `src/mcp/server.ts` - MCP stdio server, tool definitions
- `.gitscope/comments.json` - Persisted review comments

## Tasks

- [ ] 1.0 Project Scaffolding & CLI Setup
  - **Dependencies:** none
  - **Requirements:** REQ-STACK (Node/Bun, Ink, TypeScript), REQ-CLI (`gitscope` / `gitscope --base`)
  - **Test:** Run `bun run src/cli.tsx` — renders a placeholder Ink app. Run `bun run src/cli.tsx --base dev` — parses and logs the base arg.
  - Sub-tasks:
  - [ ] 1.1 Initialize project — `bun init`, add dependencies (ink, react, simple-git, chokidar, diff, uuid), configure `tsconfig.json`, add bin entry to `package.json`
  - [ ] 1.2 Create CLI entry point (`src/cli.tsx`) — parse `--base` arg (default `main`), render root `<App>` component with base/target as props
  - [ ] 1.3 Create root App component (`src/app.tsx`) — placeholder two-panel layout (file tree + diff viewer) using Ink `<Box>`, wire up global state for `base` and `target` branches

- [ ] 2.0 Git Integration Layer
  - **Dependencies:** 1.0
  - **Requirements:** REQ-DIFF (current HEAD vs base), REQ-FILE-STATUS (A/M/D), REQ-BRANCHES (list local branches)
  - **Test:** Run unit tests for git service — `bun test src/services/git.test.ts` — confirms branch listing, diff output, and file status detection against a test repo.
  - Sub-tasks:
  - [ ] 2.1 Create git service (`src/services/git.ts`) — detect repo root via `simple-git`, expose `getRepoBranches()` returning local branch names
  - [ ] 2.2 Add `getChangedFiles(base, target)` — returns array of `{path, status}` objects (Added/Modified/Deleted)
  - [ ] 2.3 Add `getFileDiff(base, target, filePath)` — returns unified diff string for a single file
  - [ ] 2.4 Write tests for git service (`src/services/git.test.ts`) — use a temp git repo fixture

- [ ] 3.0 File Tree Panel
  - **Dependencies:** 2.0
  - **Requirements:** REQ-FILE-TREE (changed files with A/M/D status), REQ-VIM-NAV (`j/k` scroll, `Enter` select)
  - **Test:** Launch app in a repo with changes — file tree shows files with correct status indicators. `j/k` moves highlight, `Enter` selects a file.
  - Sub-tasks:
  - [ ] 3.1 Create `useVimNavigation` hook (`src/hooks/use-vim-navigation.ts`) — handles `j/k` for list navigation, `gg/G` for top/bottom, returns `selectedIndex`
  - [ ] 3.2 Build FileTree component (`src/components/file-tree.tsx`) — renders file list with status badges (A/M/D), uses vim navigation hook, emits `onSelectFile`
  - [ ] 3.3 Wire FileTree into App — on mount, fetch changed files from git service, pass to FileTree, handle file selection to update active file in state

- [ ] 4.0 Diff Viewer Panel
  - **Dependencies:** 2.0, 3.0
  - **Requirements:** REQ-DIFF-VIEW (unified diff with highlighted +/-), REQ-VIM-NAV (`j/k` scroll, `gg/G`, `/` search), REQ-PANEL-SWITCH (`h/l` switch panels)
  - **Test:** Select a file in the file tree — diff viewer shows the unified diff with colored additions/removals. `j/k` scrolls, `/` opens search, `h/l` switches focus between panels.
  - Sub-tasks:
  - [ ] 4.1 Build DiffViewer component (`src/components/diff-viewer.tsx`) — parse unified diff string into lines, render with color coding (green for +, red for -, dim for context)
  - [ ] 4.2 Add scrollable viewport — `j/k` scrolls within the diff, `gg/G` jumps to top/bottom, track visible window offset against total lines
  - [ ] 4.3 Add `/` search within diff — opens text input, highlights matches, `n/N` to cycle through results
  - [ ] 4.4 Wire panel focus (`h/l`) into App — track `activePanel` state, pass `isFocused` to each panel, only the focused panel responds to `j/k`

- [ ] 5.0 Branch Switching & Status Bar
  - **Dependencies:** 2.0, 3.0
  - **Requirements:** REQ-BRANCH-SWITCH (`sb`/`st` keybinds, fuzzy filter), REQ-STATUS-BAR (`target <- base` display)
  - **Test:** Press `sb` — branch picker overlay appears with fuzzy filter. Type to filter, `Enter` to select. Status bar updates to reflect new base. Diff and file tree re-compute.
  - Sub-tasks:
  - [ ] 5.1 Build BranchPicker component (`src/components/branch-picker.tsx`) — overlay with text input for fuzzy filtering, `j/k` navigation, `Enter` to select, `Esc` to cancel
  - [ ] 5.2 Build StatusBar component (`src/components/status-bar.tsx`) — displays `target <- base`, file count, keybind hints
  - [ ] 5.3 Wire `sb`/`st` keybinds into App — open BranchPicker in correct mode, on selection update `base`/`target` state and trigger re-diff of all files

- [ ] 6.0 File Watching & Worker Thread Diffing
  - **Dependencies:** 2.0, 4.0
  - **Requirements:** REQ-WATCH (debounced file watching), REQ-WORKER (diff in worker thread), REQ-PERF (diff updates <200ms)
  - **Test:** Save a file in the watched repo — diff viewer updates within 200ms. Confirm via logging that diff runs in worker thread, not main thread.
  - Sub-tasks:
  - [ ] 6.1 Create file watcher service (`src/services/watcher.ts`) — chokidar watches repo, debounces changes (150ms), emits changed file paths
  - [ ] 6.2 Create diff worker (`src/services/diff-worker.ts`) — Node worker_threads worker that receives file paths + refs, computes diffs, posts results back
  - [ ] 6.3 Integrate watcher into App — on file change events, dispatch to worker, update diff state on worker response, trigger re-render of affected file tree entries and diff viewer

- [ ] 7.0 Inline Comments System
  - **Dependencies:** 4.0
  - **Requirements:** REQ-COMMENTS (`c` keybind, file:line:branch anchor), REQ-PERSIST (`.gitscope/comments.json`), REQ-COMMENT-SCHEMA (id, file, line, branch, base, content, resolved, createdAt)
  - **Test:** Press `c` on a diff line — comment input appears. Type comment, press `Enter` — comment saved to `.gitscope/comments.json` with correct schema. Comment indicator appears in diff viewer.
  - Sub-tasks:
  - [ ] 7.1 Create comments service (`src/services/comments.ts`) — CRUD operations for comments, reads/writes `.gitscope/comments.json`, ensures `.gitscope/` dir exists
  - [ ] 7.2 Build CommentInput component (`src/components/comment-input.tsx`) — inline text input that appears at the current diff line, `Enter` to submit, `Esc` to cancel
  - [ ] 7.3 Wire `c` keybind into DiffViewer — opens CommentInput at cursor line, on submit calls comments service with file, line, branch, base context
  - [ ] 7.4 Show comment indicators in DiffViewer — render comment icon/count next to lines that have comments, load comments on file selection

- [ ] 8.0 MCP Server for Comments
  - **Dependencies:** 7.0
  - **Requirements:** REQ-MCP-TOOLS (`get_review_comments`, `get_comments_by_file`, `resolve_comment`), REQ-MCP-TRANSPORT (stdio)
  - **Test:** Run `gitscope mcp` — starts stdio MCP server. Send `get_review_comments` tool call via stdin JSON — returns all comments. Send `resolve_comment` with an id — marks it resolved in `.gitscope/comments.json`.
  - Sub-tasks:
  - [ ] 8.1 Create MCP server (`src/mcp/server.ts`) — stdio transport, register three tools with schemas matching comment model
  - [ ] 8.2 Implement `get_review_comments` tool — reads all comments from `.gitscope/comments.json`, returns with diff context
  - [ ] 8.3 Implement `get_comments_by_file(path)` and `resolve_comment(id)` tools — filter by file path, mark resolved by id
  - [ ] 8.4 Wire `gitscope mcp` subcommand into CLI entry point — detect `mcp` positional arg, start MCP server instead of TUI

- [ ] 9.0 Integration Testing & Smoke Test
  - **Dependencies:** 1.0–8.0
  - **Requirements:** All REQs
  - **Test:** Full end-to-end walkthrough: launch `gitscope` in a repo, navigate files, view diffs, switch branches, leave a comment, run `gitscope mcp` and read that comment via MCP tool call.
  - Sub-tasks:
  - [ ] 9.1 Startup performance test — measure cold start, confirm <500ms to first render
  - [ ] 9.2 End-to-end TUI walkthrough — script or manual: open app, navigate file tree, view diffs, switch base branch, verify status bar, search in diff
  - [ ] 9.3 End-to-end MCP walkthrough — leave comments in TUI, run `gitscope mcp`, call all three tools, verify correct responses
  - [ ] 9.4 File watching stress test — rapid file saves, confirm UI stays responsive and diffs stay accurate

## Deferred / Out of Scope

- **P2 features:** Mark files reviewed, side-by-side diff toggle, hunk jumping (`]c`/`[c`), copy keybinds, configurable themes, `.gitscoperc`, WezTerm integration, Neovim plugin
- **Remote/GitHub integration** — explicitly excluded from MVP per PRD
