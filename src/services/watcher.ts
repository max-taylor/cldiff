import { watch, type FSWatcher } from "chokidar";
import { join, relative } from "path";
import { readFileSync } from "fs";
import ignore from "ignore";

function loadGitignore(cwd: string) {
  const ig = ignore();
  try {
    const content = readFileSync(join(cwd, ".gitignore"), "utf-8");
    ig.add(content);
  } catch {}
  return ig;
}

export class FileWatcher {
  private watcher: FSWatcher | null = null;
  private gitWatcher: FSWatcher | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingPaths = new Set<string>();

  constructor(
    private cwd: string,
    private debounceMs: number = 150,
  ) {}

  start(onChange: (paths: string[]) => void) {
    const flush = () => {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      this.debounceTimer = setTimeout(() => {
        const paths = [...this.pendingPaths];
        this.pendingPaths.clear();
        onChange(paths);
      }, this.debounceMs);
    };

    const ig = loadGitignore(this.cwd);

    // Watch working directory, respecting .gitignore
    this.watcher = watch(this.cwd, {
      ignored: (path) => {
        const rel = relative(this.cwd, path);
        if (!rel) return false;
        return rel === ".git" || rel.startsWith(".git/") || ig.ignores(rel);
      },
      persistent: true,
      ignoreInitial: true,
      ignorePermissionErrors: true,
    });

    const handleFileEvent = (path: string) => {
      this.pendingPaths.add(path);
      flush();
    };

    this.watcher.on("change", handleFileEvent);
    this.watcher.on("add", handleFileEvent);
    this.watcher.on("unlink", handleFileEvent);

    // Watch git index/HEAD for commit, stage, checkout events
    // Also watch tracking file for real-time session updates
    this.gitWatcher = watch(
      [
        join(this.cwd, ".git", "index"),
        join(this.cwd, ".git", "HEAD"),
        join(this.cwd, ".claude", "review-tracking.jsonl"),
      ],
      {
        persistent: true,
        ignoreInitial: true,
      },
    );

    this.gitWatcher.on("change", () => {
      this.pendingPaths.add(".git/index");
      flush();
    });
  }

  stop() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.watcher?.close();
    this.gitWatcher?.close();
    this.watcher = null;
    this.gitWatcher = null;
  }
}
