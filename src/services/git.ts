import simpleGit, { type SimpleGit } from "simple-git";

export type FileStatus = "A" | "M" | "D";

export interface ChangedFile {
  path: string;
  status: FileStatus;
}

export class GitService {
  private git: SimpleGit;

  constructor(cwd: string = process.cwd()) {
    this.git = simpleGit(cwd);
  }

  async getRepoRoot(): Promise<string> {
    return (await this.git.revparse(["--show-toplevel"])).trim();
  }

  async getCurrentBranch(): Promise<string> {
    const result = await this.git.branchLocal();
    return result.current;
  }

  async getUnstagedFiles(): Promise<ChangedFile[]> {
    // Tracked file changes (modified/deleted)
    const diff = await this.git.diff(["--name-status"]);
    const tracked = this.parseNameStatus(diff);

    // Untracked new files
    const status = await this.git.status();
    const untracked: ChangedFile[] = status.not_added.map((path) => ({
      path,
      status: "A" as const,
    }));

    return [...tracked, ...untracked];
  }

  async getUnstagedFileDiff(filePath: string): Promise<string> {
    const diff = await this.git.diff(["--", filePath]);
    if (diff) return diff;

    // Untracked file — show entire content as added
    try {
      return await this.git.diff(["--no-index", "/dev/null", filePath]);
    } catch {
      // git diff --no-index exits with code 1 when files differ, but simple-git
      // may throw. The diff output is still in the error.
      // Fall back to raw to get something useful
      const result = await this.git.raw([
        "diff",
        "--no-index",
        "/dev/null",
        filePath,
      ]);
      return result;
    }
  }

  async getStagedFiles(): Promise<ChangedFile[]> {
    const diff = await this.git.diff(["--name-status", "--cached"]);
    return this.parseNameStatus(diff);
  }

  async getStagedFileDiff(filePath: string): Promise<string> {
    return await this.git.diff(["--cached", "--", filePath]);
  }

  async stageFile(filePath: string): Promise<void> {
    await this.git.add(filePath);
  }

  async unstageFile(filePath: string): Promise<void> {
    await this.git.raw(["reset", "HEAD", "--", filePath]);
  }

  private parseNameStatus(raw: string): ChangedFile[] {
    if (!raw.trim()) return [];

    return raw
      .trim()
      .split("\n")
      .map((line) => {
        const [statusChar, ...pathParts] = line.split("\t");
        const path = pathParts.join("\t");
        let status: FileStatus;

        switch (statusChar?.[0]) {
          case "A":
            status = "A";
            break;
          case "D":
            status = "D";
            break;
          default:
            status = "M";
            break;
        }

        return { path, status };
      });
  }
}
