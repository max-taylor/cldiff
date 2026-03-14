import { appendFileSync, readFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { debugLog } from "./log.ts";

export interface SessionEvent {
  type: "session";
  id: string;
  started_at: string;
  transcript_path: string;
}

export interface ChangeEvent {
  type: "change";
  file_path: string;
  session_id: string;
  timestamp: string;
  tool_name: "Write" | "Edit";
}

export type TrackingEvent = SessionEvent | ChangeEvent;

export interface Session {
  id: string;
  started_at: string;
  transcript_path: string;
}

export interface Change {
  file_path: string;
  session_id: string;
  timestamp: string;
  tool_name: "Write" | "Edit";
}

export interface ReviewTracking {
  sessions: Record<string, Session>;
  changes: Change[];
}

function trackingPath(cwd: string): string {
  return join(cwd, ".claude", "review-tracking.jsonl");
}

export function appendEvent(cwd: string, event: TrackingEvent): void {
  try {
    const filePath = trackingPath(cwd);
    mkdirSync(dirname(filePath), { recursive: true });
    appendFileSync(filePath, JSON.stringify(event) + "\n");
  } catch (err) {
    debugLog(cwd, "appendEvent failed", err);
  }
}

export function readTracking(cwd: string): ReviewTracking | null {
  try {
    const content = readFileSync(trackingPath(cwd), "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);

    const sessions: Record<string, Session> = {};
    const changes: Change[] = [];

    for (const line of lines) {
      try {
        const event = JSON.parse(line) as TrackingEvent;
        if (event.type === "session") {
          // Deduplicate by id — last write wins
          sessions[event.id] = {
            id: event.id,
            started_at: event.started_at,
            transcript_path: event.transcript_path,
          };
        } else if (event.type === "change") {
          changes.push({
            file_path: event.file_path,
            session_id: event.session_id,
            timestamp: event.timestamp,
            tool_name: event.tool_name,
          });
        } else {
          debugLog(cwd, `readTracking: unknown event type "${(event as { type: string }).type}"`);
        }
      } catch (err) {
        debugLog(cwd, "readTracking: malformed JSONL line", err);
      }
    }

    return { sessions, changes };
  } catch {
    return null;
  }
}
