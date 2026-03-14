import { describe, test, expect } from "bun:test";
import { buildTreeRows, type Row } from "./build-tree-rows.ts";
import type { ChangedFile } from "../../services/git.ts";

function file(path: string, status: "A" | "M" | "D" = "M"): ChangedFile {
  return { path, status };
}

function fileRows(rows: Row[]) {
  return rows.filter(
    (r): r is Extract<Row, { type: "file" }> => r.type === "file",
  );
}

function dirRows(rows: Row[]) {
  return rows.filter(
    (r): r is Extract<Row, { type: "directory" }> => r.type === "directory",
  );
}

describe("buildTreeRows", () => {
  test("returns empty array for empty input", () => {
    expect(buildTreeRows([], false)).toEqual([]);
  });

  test("single root-level file produces one file row", () => {
    const rows = buildTreeRows([file("readme.md")], false);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.type).toBe("file");
    const f = rows[0] as Extract<Row, { type: "file" }>;
    expect(f.fileName).toBe("readme.md");
    expect(f.staged).toBe(false);
  });

  test("staged flag is passed through", () => {
    const rows = buildTreeRows([file("a.ts"), file("b.ts")], true);
    const files = fileRows(rows);
    expect(files[0]!.staged).toBe(true);
    expect(files[1]!.staged).toBe(true);
  });

  test("files in a directory produce a directory row and file rows", () => {
    const rows = buildTreeRows([file("src/a.ts"), file("src/b.ts")], false);
    const dirs = dirRows(rows);
    expect(dirs).toHaveLength(1);
    expect(dirs[0]!.label).toBe("src/");
    expect(fileRows(rows)).toHaveLength(2);
  });

  test("collapses single-child directory chains", () => {
    const rows = buildTreeRows([file("src/hooks/use-foo.ts")], false);
    // src/hooks should collapse into one directory row since each has a single child
    const dirs = dirRows(rows);
    expect(dirs).toHaveLength(1);
    expect(dirs[0]!.label).toBe("src/hooks/");
  });

  test("does not collapse when directory has multiple children", () => {
    const rows = buildTreeRows(
      [file("src/a.ts"), file("src/b.ts"), file("lib/c.ts")],
      false,
    );
    const dirs = dirRows(rows);
    const labels = dirs.map((d) => d.label);
    expect(labels).toContain("src/");
    expect(labels).toContain("lib/");
  });

  test("sorts directories before files", () => {
    const rows = buildTreeRows([file("z.ts"), file("src/a.ts")], false);
    // src/ directory should come before z.ts file
    const firstNonHeader = rows[0]!;
    expect(firstNonHeader.type).toBe("directory");
  });

  test("sorts alphabetically within directories and files", () => {
    const rows = buildTreeRows(
      [file("c.ts"), file("a.ts"), file("b.ts")],
      false,
    );
    const files = fileRows(rows);
    expect(files.map((f) => f.fileName)).toEqual(["a.ts", "b.ts", "c.ts"]);
  });

  test("nested files have tree prefixes, root-level entries do not", () => {
    const rows = buildTreeRows(
      [file("src/a.ts"), file("src/b.ts"), file("lib/c.ts")],
      false,
    );
    // Root-level directories have no prefix
    const dirs = dirRows(rows);
    for (const dir of dirs) {
      expect(dir.prefix).toBe("");
    }
    // Files inside directories have tree connectors
    const files = fileRows(rows);
    for (const f of files) {
      expect(f.prefix).toMatch(/[├└]/);
    }
  });

  test("deeply nested files with shared prefixes", () => {
    const rows = buildTreeRows(
      [
        file("src/components/button.tsx"),
        file("src/components/input.tsx"),
        file("src/hooks/use-state.ts"),
      ],
      false,
    );
    const files = fileRows(rows);
    expect(files.map((f) => f.fileName)).toContain("button.tsx");
    expect(files.map((f) => f.fileName)).toContain("input.tsx");
    expect(files.map((f) => f.fileName)).toContain("use-state.ts");
    // src should not be collapsed because it has two children (components, hooks)
    const dirs = dirRows(rows);
    expect(dirs.some((d) => d.label === "src/")).toBe(true);
  });

  test("preserves file status in output", () => {
    const rows = buildTreeRows(
      [file("a.ts", "A"), file("b.ts", "D"), file("c.ts", "M")],
      false,
    );
    const files = fileRows(rows);
    expect(files.find((f) => f.fileName === "a.ts")!.file.status).toBe("A");
    expect(files.find((f) => f.fileName === "b.ts")!.file.status).toBe("D");
    expect(files.find((f) => f.fileName === "c.ts")!.file.status).toBe("M");
  });

  test("last item uses └── connector, others use ├──", () => {
    const rows = buildTreeRows(
      [file("a.ts"), file("b.ts"), file("c.ts")],
      false,
    );
    const files = fileRows(rows);
    // Root-level files have no tree connectors
    expect(files[0]!.prefix).toBe("");
    expect(files[1]!.prefix).toBe("");
    expect(files[2]!.prefix).toBe("");
  });
});
