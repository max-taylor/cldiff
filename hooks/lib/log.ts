import { appendFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";

export function debugLog(cwd: string, message: string, err?: unknown): void {
  try {
    const logPath = join(cwd, ".claude", "gitscope-debug.log");
    mkdirSync(dirname(logPath), { recursive: true });
    const timestamp = new Date().toISOString();
    const errStr = err instanceof Error ? `: ${err.message}` : err ? `: ${err}` : "";
    appendFileSync(logPath, `${timestamp} ${message}${errStr}\n`);
  } catch {
    // Last resort — can't even log
  }
}
