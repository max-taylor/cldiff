import { useState, useEffect, useMemo } from "react";
import { Box, Text, useStdout } from "ink";
import { useGitState } from "./hooks/use-git-state.ts";
import { useAppKeybindings } from "./hooks/use-app-keybindings.ts";
import { FileTree } from "./components/file-tree/index.ts";
import { DiffViewer } from "./components/diff-viewer/index.ts";
import { SessionPicker } from "./components/session-picker.tsx";
import { KeybindingHelp } from "./components/keybinding-help.tsx";
import { CommitDialog } from "./components/commit-dialog.tsx";
import { StatusBar } from "./components/status-bar.tsx";
import { CommentsService, type Comment } from "./services/comments.ts";

export function App({ cwd }: { cwd: string }) {
  const git = useGitState(cwd);
  const [commentsService] = useState(() => new CommentsService(cwd));
  const [allComments, setAllComments] = useState<Comment[]>([]);

  useEffect(() => {
    commentsService.loadComments().then(setAllComments);
  }, [commentsService]);

  const fileComments = useMemo(
    () => allComments.filter((c) => c.file === git.selectedFile),
    [allComments, git.selectedFile],
  );

  const handleAddComment = (line: number, content: string) => {
    const newComment: Comment = {
      id: crypto.randomUUID(),
      file: git.selectedFile!,
      line,
      branch: git.currentBranch,
      content,
      resolved: false,
      createdAt: new Date().toISOString(),
    };
    setAllComments([...allComments, newComment]);
    commentsService.appendComment(newComment);
  };

  const handleEditComment = (id: string, content: string) => {
    const updated = allComments.map((c) =>
      c.id === id ? { ...c, content } : c,
    );
    setAllComments(updated);
    commentsService.saveComments(updated);
  };

  const handleDeleteComment = (ids: string[]) => {
    const idSet = new Set(ids);
    const updated = allComments.filter((c) => !idSet.has(c.id));
    setAllComments(updated);
    commentsService.saveComments(updated);
  };

  const [inputCaptured, setInputCaptured] = useState(false);

  const combined = [...git.files, ...git.stagedFiles];

  const kb = useAppKeybindings({
    onToggleStage: git.toggleStage,
    onClearSessionFilter: git.clearSessionFilter,
    hasSessionFilter: git.selectedSession !== null,
    hasTrackingData: git.hasTrackingData,
    hasStagedFiles: git.hasStagedFiles,
    inputCaptured,
  });
  const { stdout } = useStdout();
  const termHeight = stdout?.rows ?? 24;
  const FILE_PANE_HEIGHT = 15;
  const fileViewportHeight = FILE_PANE_HEIGHT - 3;
  const diffViewportHeight = termHeight - FILE_PANE_HEIGHT - 4;

  const handleSelectFile = (filePath: string, staged: boolean) => {
    git.setSelectedFile(filePath);
    git.setSelectedStaged(staged);
    kb.focusDiff();
  };

  const handleCursorChange = (filePath: string, staged: boolean) => {
    git.setSelectedFile(filePath);
    git.setSelectedStaged(staged);
  };

  const handleSelectSession = (sessionId: string) => {
    git.selectSession(sessionId);
    kb.closeOverlay();
  };

  if (kb.overlay === "help") {
    return (
      <Box
        justifyContent="center"
        alignItems="center"
        width="100%"
        height={termHeight}
      >
        <KeybindingHelp onClose={kb.closeOverlay} />
      </Box>
    );
  }

  if (kb.overlay === "commit") {
    return (
      <Box
        justifyContent="center"
        alignItems="center"
        width="100%"
        height={termHeight}
      >
        <CommitDialog
          onCommit={(msg) => {
            git.commit(msg);
            kb.closeOverlay();
          }}
          onCancel={kb.closeOverlay}
        />
      </Box>
    );
  }

  if (kb.overlay === "pick-session") {
    return (
      <Box
        justifyContent="center"
        alignItems="center"
        width="100%"
        height={termHeight}
      >
        <SessionPicker
          sessions={git.sessionGroups}
          onSelect={handleSelectSession}
          onCancel={kb.closeOverlay}
        />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" width="100%" height={termHeight}>
      <Box
        flexDirection="column"
        height={FILE_PANE_HEIGHT}
        flexShrink={0}
        borderStyle="single"
        borderColor={kb.activePanel === "files" ? "cyan" : "gray"}
        paddingX={1}
        overflow="hidden"
      >
        <Text bold color="cyan">
          Files ({combined.length})
        </Text>
        <FileTree
          unstagedFiles={git.files}
          stagedFiles={git.stagedFiles}
          isFocused={kb.activePanel === "files"}
          onSelectFile={handleSelectFile}
          onCursorChange={handleCursorChange}
          showStagedSection={true}
          viewportHeight={fileViewportHeight}
        />
      </Box>

      <Box
        flexDirection="column"
        flexGrow={1}
        borderStyle="single"
        borderColor={kb.activePanel === "diff" ? "cyan" : "gray"}
        paddingX={1}
      >
        <Text bold color="cyan">
          {git.selectedFile ?? "Diff"}
        </Text>
        <DiffViewer
          diff={git.diffContent}
          isFocused={kb.activePanel === "diff"}
          viewportHeight={diffViewportHeight}
          comments={fileComments}
          onAddComment={handleAddComment}
          onEditComment={handleEditComment}
          onDeleteComment={handleDeleteComment}
          onInputCapture={setInputCaptured}
        />
      </Box>

      <StatusBar
        currentBranch={git.currentBranch}
        fileCount={combined.length}
        sessionLabel={git.selectedSession?.label ?? null}
        hasTrackingData={git.hasTrackingData}
        hasStagedFiles={git.hasStagedFiles}
      />
    </Box>
  );
}
