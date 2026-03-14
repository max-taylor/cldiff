import { readFileSync } from "fs";
import type { ChangedFile } from "./git.ts";
import {
  type ReviewTracking,
  type Session,
} from "../../hooks/lib/tracking-store.ts";
import { debugLog } from "../../hooks/lib/log.ts";

export type {
  ReviewTracking,
  Session,
} from "../../hooks/lib/tracking-store.ts";

export interface TrackedFile {
  path: string;
  status: ChangedFile["status"];
  isStaged: boolean;
}

export interface SessionGroup {
  session_id: string;
  started_at: string;
  label: string;
  files: TrackedFile[];
  stagedCount: number;
  unstagedCount: number;
}

const labelCache = new Map<string, string>();

export function buildSessionGroups(
  tracking: ReviewTracking,
  unstagedFiles: ChangedFile[],
  stagedFiles: ChangedFile[],
): SessionGroup[] {
  const unstagedSet = new Map(unstagedFiles.map((f) => [f.path, f]));
  const stagedSet = new Map(stagedFiles.map((f) => [f.path, f]));

  // Group changes by session
  const sessionChanges = new Map<string, Set<string>>();
  for (const change of tracking.changes) {
    if (!sessionChanges.has(change.session_id)) {
      sessionChanges.set(change.session_id, new Set());
    }
    sessionChanges.get(change.session_id)!.add(change.file_path);
  }

  const groups: SessionGroup[] = [];

  for (const [sessionId, filePaths] of sessionChanges) {
    const session = tracking.sessions[sessionId];
    if (!session) continue;

    const files: TrackedFile[] = [];
    let stagedCount = 0;
    let unstagedCount = 0;

    for (const path of filePaths) {
      const unstaged = unstagedSet.get(path);
      const staged = stagedSet.get(path);

      if (unstaged) {
        files.push({ path, status: unstaged.status, isStaged: false });
        unstagedCount++;
      }
      if (staged) {
        files.push({ path, status: staged.status, isStaged: true });
        stagedCount++;
      }
    }

    // Skip sessions with no active files
    if (files.length === 0) continue;

    groups.push({
      session_id: sessionId,
      started_at: session.started_at,
      label: "", // Resolved lazily
      files,
      stagedCount,
      unstagedCount,
    });
  }

  // Sort by most recent first
  groups.sort((a, b) => b.started_at.localeCompare(a.started_at));

  return groups;
}

export async function getSessionLabel(
  cwd: string,
  session: Session,
): Promise<string> {
  const cached = labelCache.get(session.id);
  if (cached) return cached;

  try {
    const content = readFileSync(session.transcript_path, "utf-8");
    const lines = content.trim().split("\n");

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        // Transcript entries nest role/content under entry.message
        const msg = entry.message ?? entry;
        if (msg.role === "user" && msg.content) {
          const content = msg.content;
          const text =
            typeof content === "string"
              ? content
              : Array.isArray(content)
                ? (content.find(
                    (b: { type: string; text?: string }) => b.type === "text",
                  )?.text ?? "")
                : "";
          if (text) {
            const label = text.slice(0, 60).replace(/\n/g, " ").trim();
            labelCache.set(session.id, label);
            return label;
          }
        }
      } catch (err) {
        debugLog(cwd, "getSessionLabel: malformed transcript line", err);
      }
    }
  } catch (err) {
    debugLog(
      cwd,
      `getSessionLabel: cannot read transcript ${session.transcript_path}`,
      err,
    );
  }

  // Fallback to formatted timestamp
  const date = new Date(session.started_at);
  const label = date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  labelCache.set(session.id, label);
  return label;
}

export async function resolveLabels(
  cwd: string,
  groups: SessionGroup[],
  sessions: Record<string, Session>,
): Promise<SessionGroup[]> {
  return Promise.all(
    groups.map(async (group) => {
      const session = sessions[group.session_id];
      if (!session) return group;
      const label = await getSessionLabel(cwd, session);
      return { ...group, label };
    }),
  );
}
