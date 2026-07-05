import type { ChangedFile } from "../../services/git.ts";
import { buildTreeRows, type Row } from "./build-tree-rows.ts";

export type { Row } from "./build-tree-rows.ts";

export interface CollapsedState {
  unstaged: boolean;
  staged: boolean;
}

type NavigableRow =
  | Extract<Row, { type: "file" }>
  | Extract<Row, { type: "header" }>;

export interface FileTreeData {
  rows: Row[];
  navigableRows: NavigableRow[];
}

export function buildFileTreeData(
  unstagedFiles: ChangedFile[],
  stagedFiles: ChangedFile[],
  collapsed: CollapsedState,
): FileTreeData {
  const sortedUnstaged = [...unstagedFiles].sort((a, b) =>
    a.path.localeCompare(b.path),
  );
  const sortedStaged = [...stagedFiles].sort((a, b) =>
    a.path.localeCompare(b.path),
  );

  const rows: Row[] = [];
  rows.push({ type: "header", label: "Unstaged" });
  if (!collapsed.unstaged) {
    rows.push(...buildTreeRows(sortedUnstaged, false));
  }
  rows.push({ type: "header", label: "Staged" });
  if (!collapsed.staged) {
    rows.push(...buildTreeRows(sortedStaged, true));
  }

  const navigableRows = rows.filter(
    (r): r is NavigableRow => r.type === "file" || r.type === "header",
  );

  return { rows, navigableRows };
}
