# cldiff

A TUI PR review tool with session-aware diff tracking for AI-assisted code review. Filter your file list to changes made by a specific Claude Code session.

## Installation

### Claude Code Plugin

The plugin tracks which files Claude edits across sessions. Install it in Claude Code:

```
/plugin marketplace add maxtaylor/cldiff
/plugin install cldiff
```

Once installed, cldiff automatically records file changes to `.claude/review-tracking.jsonl` in whatever repo Claude operates in. No configuration needed.

### TUI

> Coming soon. For now, run from source:
>
> ```bash
> bun install
> bun run start
> ```

## Usage

Launch cldiff in any git repo:

```bash
bun run src/cli.tsx [directory]
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

### Session Filtering

When the plugin is installed, pressing `s` opens a picker showing all Claude sessions that have uncommitted changes. Select a session to filter the file list to only that session's edits. Press `Esc` to clear the filter and see all files again.

Sessions are labeled with the first user prompt from the conversation (e.g. "Fix auth bug"). If the transcript is unavailable, the session timestamp is shown instead.

### Debug Log

Errors are logged to `.claude/cldiff-debug.log` in the repo directory.
