export type DiffLine =
  | { type: "header"; content: string }
  | { type: "add"; content: string; newLine: number }
  | { type: "remove"; content: string; oldLine: number }
  | { type: "context"; content: string; oldLine: number; newLine: number };

const hunkHeaderRe = /@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

export function parseDiff(raw: string): DiffLine[] {
  if (!raw) return [];

  const lines = raw.split("\n");
  const result: DiffLine[] = [];
  let inHunk = false;
  let oldCounter = 0;
  let newCounter = 0;

  for (const line of lines) {
    if (line.startsWith("@@")) {
      inHunk = true;
      const match = hunkHeaderRe.exec(line);
      oldCounter = match ? parseInt(match[1]!, 10) : 1;
      newCounter = match ? parseInt(match[2]!, 10) : 1;
      result.push({ type: "header", content: line });
    } else if (!inHunk) {
      result.push({ type: "header", content: line });
    } else if (line.startsWith("+")) {
      result.push({ type: "add", content: line, newLine: newCounter });
      newCounter++;
    } else if (line.startsWith("-")) {
      result.push({ type: "remove", content: line, oldLine: oldCounter });
      oldCounter++;
    } else {
      result.push({
        type: "context",
        content: line,
        oldLine: oldCounter,
        newLine: newCounter,
      });
      oldCounter++;
      newCounter++;
    }
  }

  return result;
}

export function displayLineNumber(line: DiffLine): number | null {
  switch (line.type) {
    case "add":
      return line.newLine;
    case "remove":
      return line.oldLine;
    case "context":
      return line.newLine;
    case "header":
      return null;
  }
}

export function maxLineNumber(lines: DiffLine[]): number {
  let max = 0;
  for (const line of lines) {
    if (line.type === "add" || line.type === "context")
      max = Math.max(max, line.newLine);
    if (line.type === "remove" || line.type === "context")
      max = Math.max(max, line.oldLine);
  }
  return max;
}

export function lineColor(type: DiffLine["type"]): string | undefined {
  switch (type) {
    case "add":
      return "green";
    case "remove":
      return "red";
    case "header":
      return "cyan";
    case "context":
      return undefined;
  }
}
