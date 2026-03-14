# cldiff

A TUI PR review tool with session-aware diff tracking for AI-assisted code review. Filter your file list to changes made by a specific Claude Code session, leave inline comments, and resolve them with a single command.

## Install

Download the compiled binary for your platform:

```bash
# macOS (Apple Silicon)
curl -fsSL https://github.com/max-taylor/cldiff/releases/latest/download/cldiff-darwin-arm64 -o /usr/local/bin/cldiff && chmod +x /usr/local/bin/cldiff
```

Run the same command to update to the latest version.

### From source

```bash
bun install
bun run start
```

## Usage

Launch cldiff from the root of any repo:

```bash
cldiff
```

### Keybindings

| Key | Action |
|-----|--------|
| `h` / `l` | Focus file tree / diff viewer |
| `j` / `k` | Navigate up/down |
| `J` / `K` | Next/previous file |
| `s` | Filter by Claude session |
| `Esc` | Clear session filter |
| `a` | Stage/unstage file |
| `/` | Search in diff |
| `n` / `N` | Next/previous search match |
| `c` / `x` | Add/delete comment |
| `?` | Show all keybindings |
| `q` | Quit |

## Claude Code Plugin

cldiff includes a Claude Code plugin with two components: **session tracking** and a **resolve skill**.

### Install the plugin

```
/plugin marketplace add max-taylor/cldiff
/plugin install cldiff
```

### Session tracking (hook)

Once installed, a `PostToolUse` hook fires after every `Write` or `Edit` call Claude makes. It records the file path, session ID, and timestamp to `.claude/review-tracking.jsonl` in the repo. No configuration needed.

In the TUI, press `s` to open a session picker showing all Claude sessions with uncommitted changes. Select one to filter the file list to only that session's edits. Sessions are labeled with the first user prompt from the conversation (e.g. "Fix auth bug"). Press `Esc` to clear the filter.

### Resolve skill

Leave inline comments on diff lines in the TUI (press `c`), then ask Claude to implement them:

```
/resolve           # resolve all unresolved comments
/resolve src/app.tsx   # resolve comments in a specific file
/resolve <comment-id>  # resolve a single comment
```

Claude reads `.cldiff/comments.json`, triages each comment (actionable, unclear, or too complex), implements the actionable ones, runs typecheck, and marks them resolved. Unclear or complex comments are flagged back for your input.

## Debug Log

Errors are logged to `.claude/cldiff-debug.log` in the repo directory.
