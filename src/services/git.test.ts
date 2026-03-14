import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import simpleGit from "simple-git";
import { GitService } from "./git.ts";

let tempDir: string;
let gitService: GitService;

beforeAll(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "gitscope-test-"));
  const git = simpleGit(tempDir);

  await git.init();
  await git.addConfig("user.email", "test@test.com");
  await git.addConfig("user.name", "Test");

  // Initial commit on main
  await writeFile(join(tempDir, "existing.txt"), "original content\n");
  await git.add(".");
  await git.commit("initial commit");
  await git.branch(["-M", "main"]);

  // Modify a file (unstaged)
  await writeFile(join(tempDir, "existing.txt"), "modified content\n");

  // Add an untracked file
  await writeFile(join(tempDir, "new-file.txt"), "new content\n");

  gitService = new GitService(tempDir);
});

afterAll(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("GitService", () => {
  test("getCurrentBranch returns active branch", async () => {
    const branch = await gitService.getCurrentBranch();
    expect(branch).toBe("main");
  });

  test("getUnstagedFiles returns modified and untracked files", async () => {
    const files = await gitService.getUnstagedFiles();
    const byPath = new Map(files.map((f) => [f.path, f.status]));

    expect(byPath.get("existing.txt")).toBe("M");
    expect(byPath.get("new-file.txt")).toBe("A");
  });

  test("getUnstagedFileDiff returns unified diff for modified file", async () => {
    const diff = await gitService.getUnstagedFileDiff("existing.txt");
    expect(diff).toContain("-original content");
    expect(diff).toContain("+modified content");
  });

  test("getUnstagedFileDiff returns diff for untracked file", async () => {
    const diff = await gitService.getUnstagedFileDiff("new-file.txt");
    expect(diff).toContain("+new content");
  });

  test("staging and unstaging files", async () => {
    await gitService.stageFile("existing.txt");

    const staged = await gitService.getStagedFiles();
    expect(staged.some((f) => f.path === "existing.txt")).toBe(true);

    const stagedDiff = await gitService.getStagedFileDiff("existing.txt");
    expect(stagedDiff).toContain("-original content");
    expect(stagedDiff).toContain("+modified content");

    await gitService.unstageFile("existing.txt");

    const stagedAfter = await gitService.getStagedFiles();
    expect(stagedAfter.some((f) => f.path === "existing.txt")).toBe(false);
  });
});
