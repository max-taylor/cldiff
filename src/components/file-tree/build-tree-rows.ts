import type { ChangedFile } from "../../services/git.ts";

export type Row =
  | { type: "header"; label: string }
  | { type: "directory"; label: string; prefix: string }
  | {
      type: "file";
      file: ChangedFile;
      staged: boolean;
      prefix: string;
      fileName: string;
    };

interface TrieNode {
  children: Map<string, TrieNode>;
  file?: ChangedFile;
}

export function buildTreeRows(files: ChangedFile[], staged: boolean): Row[] {
  if (files.length === 0) return [];

  // Build trie from file paths
  const root: TrieNode = { children: new Map() };
  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    const parts = file.path.split("/");
    let node = root;
    for (let j = 0; j < parts.length - 1; j++) {
      const seg = parts[j]!;
      if (!node.children.has(seg)) {
        node.children.set(seg, { children: new Map() });
      }
      node = node.children.get(seg)!;
    }
    const leaf: TrieNode = { children: new Map(), file };
    node.children.set(parts[parts.length - 1]!, leaf);
  }

  // Collapse single-child directory chains (e.g. src/hooks/ becomes one node)
  function collapse(node: TrieNode, name: string): [string, TrieNode] {
    if (!node.file && node.children.size === 1) {
      const [childName, childNode] = [...node.children.entries()][0]!;
      if (!childNode.file) {
        return collapse(childNode, `${name}/${childName}`);
      }
    }
    return [name, node];
  }

  // DFS to emit rows
  const rows: Row[] = [];

  function walk(node: TrieNode, depth: number, parentPrefixes: string[]) {
    // Sort children: directories first, then files, alphabetically within each group
    const entries = [...node.children.entries()].map(([name, child]) => {
      const [collapsedName, collapsedChild] = collapse(child, name);
      return { name: collapsedName, node: collapsedChild };
    });
    entries.sort((a, b) => {
      const aIsDir = !a.node.file;
      const bIsDir = !b.node.file;
      if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]!;
      const isLast = i === entries.length - 1;
      const connector = isLast ? "└── " : "├── ";
      const prefix = depth === 0 ? "" : parentPrefixes.join("") + connector;
      const continuation = depth === 0 ? "" : isLast ? "    " : "│   ";

      if (entry.node.file) {
        rows.push({
          type: "file",
          file: entry.node.file,
          staged,
          prefix,
          fileName: entry.name,
        });
      } else {
        rows.push({ type: "directory", label: entry.name + "/", prefix });
        walk(entry.node, depth + 1, [...parentPrefixes, continuation]);
      }
    }
  }

  walk(root, 0, []);
  return rows;
}
