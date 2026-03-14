import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

export interface Comment {
  id: string;
  file: string;
  line: number;
  branch: string;
  content: string;
  resolved: boolean;
  createdAt: string;
}

export class CommentsService {
  private dir: string;
  private filePath: string;
  private legacyPath: string;
  private dirEnsured = false;

  constructor(cwd: string) {
    this.dir = join(cwd, ".gitscope");
    this.filePath = join(this.dir, "comments.jsonl");
    this.legacyPath = join(this.dir, "comments.json");
  }

  async loadComments(): Promise<Comment[]> {
    try {
      await this.migrateLegacy();
      const file = Bun.file(this.filePath);
      if (!(await file.exists())) return [];
      const text = await file.text();
      return text
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line));
    } catch {
      return [];
    }
  }

  async saveComments(comments: Comment[]): Promise<void> {
    await this.ensureDir();
    const data = comments.map((c) => JSON.stringify(c)).join("\n") + "\n";
    await Bun.write(this.filePath, data);
  }

  async appendComment(comment: Comment): Promise<void> {
    await this.ensureDir();
    const line = JSON.stringify(comment) + "\n";
    const file = Bun.file(this.filePath);
    if (await file.exists()) {
      await appendFile(this.filePath, line);
    } else {
      await Bun.write(this.filePath, line);
    }
  }

  private async migrateLegacy(): Promise<void> {
    const legacy = Bun.file(this.legacyPath);
    if (!(await legacy.exists())) return;
    const jsonl = Bun.file(this.filePath);
    if (await jsonl.exists()) return;
    try {
      const comments: Comment[] = await legacy.json();
      await this.ensureDir();
      const data = comments.map((c) => JSON.stringify(c)).join("\n") + "\n";
      await Bun.write(this.filePath, data);
      const { unlink } = await import("node:fs/promises");
      await unlink(this.legacyPath);
    } catch {
      // Legacy file is corrupt — ignore
    }
  }

  private async ensureDir(): Promise<void> {
    if (this.dirEnsured) return;
    await mkdir(this.dir, { recursive: true });
    this.dirEnsured = true;
  }
}
