import type { DiffLine } from "../components/diff-viewer/types.ts";
import type { ChangedFile, FileStatus } from "../services/git.ts";
import type { Comment } from "../services/comments.ts";
import type {
  ReviewTracking,
  Change,
  Session,
} from "../../hooks/lib/tracking-store.ts";

export function generateDiffString(lineCount: number): string {
  const lines: string[] = [
    "diff --git a/large-file.ts b/large-file.ts",
    "index abc1234..def5678 100644",
    "--- a/large-file.ts",
    "+++ b/large-file.ts",
  ];

  const HUNK_SIZE = 50;
  let oldLine = 1;
  let newLine = 1;

  for (let i = 0; i < lineCount; ) {
    const remaining = Math.min(HUNK_SIZE, lineCount - i);
    lines.push(`@@ -${oldLine},${remaining} +${newLine},${remaining} @@`);

    for (let j = 0; j < remaining; j++, i++) {
      const mod = i % 5;
      if (mod === 0) {
        lines.push(`+added line ${i}`);
        newLine++;
      } else if (mod === 1) {
        lines.push(`-removed line ${i}`);
        oldLine++;
      } else {
        lines.push(` context line ${i}`);
        oldLine++;
        newLine++;
      }
    }
  }

  return lines.join("\n");
}

export function generateDiffLines(count: number): DiffLine[] {
  const result: DiffLine[] = [];
  let oldLine = 1;
  let newLine = 1;

  for (let i = 0; i < count; i++) {
    const mod = i % 5;
    if (mod === 0) {
      result.push({ type: "add", content: `+line ${i}`, newLine });
      newLine++;
    } else if (mod === 1) {
      result.push({ type: "remove", content: `-line ${i}`, oldLine });
      oldLine++;
    } else {
      result.push({
        type: "context",
        content: ` line ${i}`,
        oldLine,
        newLine,
      });
      oldLine++;
      newLine++;
    }
  }

  return result;
}

export function generateChangedFiles(count: number): ChangedFile[] {
  const dirs = [
    "src/components",
    "src/hooks",
    "src/services",
    "src/utils",
    "lib/core",
    "lib/helpers",
    "tests/unit",
    "tests/integration",
    "docs/api",
    "config",
  ];
  const statuses: FileStatus[] = ["A", "M", "D"];
  const files: ChangedFile[] = [];

  for (let i = 0; i < count; i++) {
    const dir = dirs[i % dirs.length]!;
    const depth = Math.floor(i / dirs.length);
    const subdir = depth > 0 ? `/sub${depth}` : "";
    files.push({
      path: `${dir}${subdir}/file-${i}.ts`,
      status: statuses[i % 3]!,
    });
  }

  return files;
}

export function generateCommentsByLine(
  lineCount: number,
  commentCount: number,
): Map<number, Comment[]> {
  const map = new Map<number, Comment[]>();
  const step = Math.max(1, Math.floor(lineCount / commentCount));

  for (let i = 0; i < commentCount; i++) {
    const line = (i * step) % lineCount;
    const comment: Comment = {
      id: `comment-${i}`,
      file: "bench-file.ts",
      line,
      branch: "main",
      content: `Benchmark comment ${i} with some text content.`,
      status: i % 3 === 0 ? "resolved" : "created",
      createdAt: new Date(Date.now() - i * 60000).toISOString(),
    };
    const existing = map.get(line);
    if (existing) {
      existing.push(comment);
    } else {
      map.set(line, [comment]);
    }
  }

  return map;
}

export function generateTrackingData(
  sessionCount: number,
  changeCount: number,
): {
  tracking: ReviewTracking;
  unstagedFiles: ChangedFile[];
  stagedFiles: ChangedFile[];
} {
  const sessions: Record<string, Session> = {};
  const changes: Change[] = [];

  for (let s = 0; s < sessionCount; s++) {
    const id = `session-${s}`;
    sessions[id] = {
      id,
      started_at: new Date(Date.now() - s * 3600000).toISOString(),
      transcript_path: `/tmp/transcript-${s}.jsonl`,
    };
  }

  const uniqueFiles = Math.min(changeCount, 500);
  for (let c = 0; c < changeCount; c++) {
    changes.push({
      file_path: `src/file-${c % uniqueFiles}.ts`,
      session_id: `session-${c % sessionCount}`,
      timestamp: new Date(Date.now() - c * 1000).toISOString(),
      tool_name: c % 2 === 0 ? "Write" : "Edit",
    });
  }

  const unstagedFiles: ChangedFile[] = [];
  const stagedFiles: ChangedFile[] = [];
  for (let i = 0; i < uniqueFiles; i++) {
    if (i % 3 === 0) {
      stagedFiles.push({ path: `src/file-${i}.ts`, status: "M" });
    } else {
      unstagedFiles.push({ path: `src/file-${i}.ts`, status: "M" });
    }
  }

  return { tracking: { sessions, changes }, unstagedFiles, stagedFiles };
}
