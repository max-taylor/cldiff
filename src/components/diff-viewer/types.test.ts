import { describe, test, expect } from "bun:test";
import {
  parseDiff,
  displayLineNumber,
  maxLineNumber,
  lineColor,
} from "./types";

describe("parseDiff", () => {
  test("returns empty array for empty input", () => {
    expect(parseDiff("")).toEqual([]);
  });

  test("parses file headers before first hunk", () => {
    const raw =
      "diff --git a/foo.ts b/foo.ts\nindex abc..def 100644\n--- a/foo.ts\n+++ b/foo.ts";
    const result = parseDiff(raw);
    expect(result).toHaveLength(4);
    expect(result.every((l) => l.type === "header")).toBe(true);
  });

  test("parses a simple hunk with add, remove, context", () => {
    const raw = [
      "@@ -1,3 +1,3 @@",
      " unchanged",
      "-old line",
      "+new line",
      " also unchanged",
    ].join("\n");

    const result = parseDiff(raw);
    expect(result).toEqual([
      { type: "header", content: "@@ -1,3 +1,3 @@" },
      { type: "context", content: " unchanged", oldLine: 1, newLine: 1 },
      { type: "remove", content: "-old line", oldLine: 2 },
      { type: "add", content: "+new line", newLine: 2 },
      { type: "context", content: " also unchanged", oldLine: 3, newLine: 3 },
    ]);
  });

  test("tracks line numbers across multiple hunks", () => {
    const raw = [
      "@@ -1,2 +1,2 @@",
      "-a",
      "+b",
      " ctx",
      "@@ -10,2 +10,2 @@",
      "-old",
      "+new",
    ].join("\n");

    const result = parseDiff(raw);
    const secondHunkRemove = result.find(
      (l) => l.type === "remove" && l.content === "-old",
    );
    const secondHunkAdd = result.find(
      (l) => l.type === "add" && l.content === "+new",
    );
    expect(secondHunkRemove).toEqual({
      type: "remove",
      content: "-old",
      oldLine: 10,
    });
    expect(secondHunkAdd).toEqual({
      type: "add",
      content: "+new",
      newLine: 10,
    });
  });

  test("handles hunk starting at non-1 line numbers", () => {
    const raw = "@@ -42,1 +57,1 @@\n-removed\n+added";
    const result = parseDiff(raw);
    expect(result[1]).toEqual({
      type: "remove",
      content: "-removed",
      oldLine: 42,
    });
    expect(result[2]).toEqual({ type: "add", content: "+added", newLine: 57 });
  });
});

describe("displayLineNumber", () => {
  test("returns newLine for add", () => {
    expect(displayLineNumber({ type: "add", content: "+x", newLine: 5 })).toBe(
      5,
    );
  });

  test("returns oldLine for remove", () => {
    expect(
      displayLineNumber({ type: "remove", content: "-x", oldLine: 3 }),
    ).toBe(3);
  });

  test("returns newLine for context", () => {
    expect(
      displayLineNumber({
        type: "context",
        content: " x",
        oldLine: 3,
        newLine: 4,
      }),
    ).toBe(4);
  });

  test("returns null for header", () => {
    expect(displayLineNumber({ type: "header", content: "@@" })).toBeNull();
  });
});

describe("maxLineNumber", () => {
  test("returns 0 for empty array", () => {
    expect(maxLineNumber([])).toBe(0);
  });

  test("finds max across all line types", () => {
    const lines = parseDiff("@@ -1,2 +1,3 @@\n a\n-b\n+c\n+d\n e");
    expect(maxLineNumber(lines)).toBe(4);
  });
});

describe("lineColor", () => {
  test("returns correct colors", () => {
    expect(lineColor("add")).toBe("green");
    expect(lineColor("remove")).toBe("red");
    expect(lineColor("header")).toBe("cyan");
    expect(lineColor("context")).toBeUndefined();
  });
});
