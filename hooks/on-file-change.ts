import { relative } from "path";
import { appendEvent, type SessionEvent, type ChangeEvent } from "./lib/tracking-store.ts";
import { debugLog } from "./lib/log.ts";

interface HookPayload {
  session_id: string;
  tool_name: "Write" | "Edit";
  tool_input: {
    file_path?: string;
    [key: string]: unknown;
  };
  cwd: string;
  transcript_path: string;
}

async function main() {
  try {
    const input = await Bun.stdin.text();
    const payload = JSON.parse(input) as HookPayload;

    const { session_id, tool_name, tool_input, cwd, transcript_path } = payload;

    const filePath = tool_input.file_path;
    if (!filePath) return;

    const relativePath = relative(cwd, filePath);

    // Always append session line — deduplicated on the read side
    const sessionEvent: SessionEvent = {
      type: "session",
      id: session_id,
      started_at: new Date().toISOString(),
      transcript_path,
    };
    appendEvent(cwd, sessionEvent);

    const changeEvent: ChangeEvent = {
      type: "change",
      file_path: relativePath,
      session_id,
      timestamp: new Date().toISOString(),
      tool_name,
    };
    appendEvent(cwd, changeEvent);
  } catch (err) {
    debugLog(process.cwd(), "hook on-file-change failed", err);
  }
}

main();
