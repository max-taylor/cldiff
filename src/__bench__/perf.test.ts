import { describe, test, expect } from "bun:test";
import { parseDiff, maxLineNumber } from "../components/diff-viewer/types.ts";
import { buildTreeRows } from "../components/file-tree/build-tree-rows.ts";
import { buildFileTreeData } from "../components/file-tree/build-file-tree-rows.ts";
import { buildSessionGroups } from "../services/tracking.ts";
import {
  computeScrollOffset,
  buildVisibleItems,
} from "../components/diff-viewer/compute-viewport.ts";
import {
  generateDiffString,
  generateDiffLines,
  generateChangedFiles,
  generateCommentsByLine,
  generateTrackingData,
} from "./generators.ts";

function bench(fn: () => void): number {
  // Warmup (JIT)
  fn();
  fn();

  const start = performance.now();
  fn();
  return performance.now() - start;
}

// --- parseDiff ---

describe("perf: parseDiff", () => {
  test("50,000 lines under 100ms", () => {
    const raw = generateDiffString(50_000);
    const ms = bench(() => parseDiff(raw));
    expect(ms).toBeLessThan(100);
  });

  test("scaling: 10x input < 15x time", () => {
    const small = generateDiffString(5_000);
    const large = generateDiffString(50_000);

    const smallTime = bench(() => parseDiff(small));
    const largeTime = bench(() => parseDiff(large));

    const ratio = largeTime / Math.max(smallTime, 0.01);
    expect(ratio).toBeLessThan(15);
  });
});

// --- maxLineNumber ---

describe("perf: maxLineNumber", () => {
  test("50,000 lines under 50ms", () => {
    const lines = generateDiffLines(50_000);
    const ms = bench(() => maxLineNumber(lines));
    expect(ms).toBeLessThan(50);
  });
});

// --- buildTreeRows ---

describe("perf: buildTreeRows", () => {
  test("2,000 files under 100ms", () => {
    const files = generateChangedFiles(2_000);
    const ms = bench(() => buildTreeRows(files, false));
    expect(ms).toBeLessThan(100);
  });

  test("scaling: 10x input < 15x time", () => {
    const small = generateChangedFiles(200);
    const large = generateChangedFiles(2_000);

    const smallTime = bench(() => buildTreeRows(small, false));
    const largeTime = bench(() => buildTreeRows(large, false));

    const ratio = largeTime / Math.max(smallTime, 0.01);
    expect(ratio).toBeLessThan(15);
  });
});

// --- buildFileTreeData ---

describe("perf: buildFileTreeData", () => {
  test("2,000 files under 150ms", () => {
    const unstaged = generateChangedFiles(1_500);
    const staged = generateChangedFiles(500);
    const ms = bench(() =>
      buildFileTreeData(unstaged, staged, { unstaged: false, staged: false }),
    );
    expect(ms).toBeLessThan(150);
  });
});

// --- buildSessionGroups ---

describe("perf: buildSessionGroups", () => {
  test("200 sessions, 5,000 changes under 100ms", () => {
    const { tracking, unstagedFiles, stagedFiles } = generateTrackingData(
      200,
      5_000,
    );
    const ms = bench(() =>
      buildSessionGroups(tracking, unstagedFiles, stagedFiles),
    );
    expect(ms).toBeLessThan(100);
  });
});

// --- computeScrollOffset ---

describe("perf: computeScrollOffset", () => {
  test("50,000 lines, 500 comments, worst-case under 200ms", () => {
    const commentsByLine = generateCommentsByLine(50_000, 500);
    const ms = bench(() =>
      computeScrollOffset(49_999, 0, 50, commentsByLine),
    );
    expect(ms).toBeLessThan(200);
  });

  test("scaling: 10x input < 15x time", () => {
    const smallComments = generateCommentsByLine(5_000, 50);
    const largeComments = generateCommentsByLine(50_000, 500);

    const smallTime = bench(() =>
      computeScrollOffset(4_999, 0, 50, smallComments),
    );
    const largeTime = bench(() =>
      computeScrollOffset(49_999, 0, 50, largeComments),
    );

    const ratio = largeTime / Math.max(smallTime, 0.01);
    expect(ratio).toBeLessThan(15);
  });
});

// --- buildVisibleItems ---

describe("perf: buildVisibleItems", () => {
  test("50,000 lines, viewport 80, under 10ms", () => {
    const lines = generateDiffLines(50_000);
    const commentsByLine = generateCommentsByLine(50_000, 500);
    const ms = bench(() => buildVisibleItems(lines, 0, 80, commentsByLine));
    expect(ms).toBeLessThan(10);
  });
});
