import { useState, useEffect, useRef, useMemo } from "react";
import { GitService, type ChangedFile } from "../services/git.ts";
import { FileWatcher } from "../services/watcher.ts";
import {
  buildSessionGroups,
  resolveLabels,
  type SessionGroup,
} from "../services/tracking.ts";
import { readTracking } from "../../hooks/lib/tracking-store.ts";

export function useGitState(cwd: string) {
  const [gitService] = useState(() => new GitService(cwd));
  const [currentBranch, setCurrentBranch] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedStaged, setSelectedStaged] = useState(false);
  const [allFiles, setAllFiles] = useState<ChangedFile[]>([]);
  const [allStagedFiles, setAllStagedFiles] = useState<ChangedFile[]>([]);
  const [diffContent, setDiffContent] = useState("");
  const [tick, setTick] = useState(0);
  const tickToSkipRef = useRef<number>(-1);

  // Session filter state
  const [sessionGroups, setSessionGroups] = useState<SessionGroup[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionGroup | null>(
    null,
  );
  const [hasTrackingData, setHasTrackingData] = useState(false);

  // Derive filtered file lists
  const sessionFilter = useMemo(() => {
    if (!selectedSession) return null;
    return new Set(selectedSession.files.map((f) => f.path));
  }, [selectedSession]);

  const files = useMemo(() => {
    if (!sessionFilter) return allFiles;
    return allFiles.filter((f) => sessionFilter.has(f.path));
  }, [allFiles, sessionFilter]);

  const stagedFiles = useMemo(() => {
    if (!sessionFilter) return allStagedFiles;
    return allStagedFiles.filter((f) => sessionFilter.has(f.path));
  }, [allStagedFiles, sessionFilter]);

  // Init + file watcher
  useEffect(() => {
    gitService.getCurrentBranch().then(setCurrentBranch);

    const watcher = new FileWatcher(cwd);
    watcher.start(() => setTick((t) => t + 1));
    return () => watcher.stop();
  }, []);

  // Refresh file list + tracking data
  useEffect(() => {
    if (tick === tickToSkipRef.current) return;

    Promise.all([
      gitService.getUnstagedFiles().catch(() => [] as ChangedFile[]),
      gitService.getStagedFiles().catch(() => [] as ChangedFile[]),
    ]).then(async ([unstaged, staged]) => {
      setAllFiles(unstaged);
      setAllStagedFiles(staged);

      // Read tracking data and build session groups
      const tracking = readTracking(cwd);
      if (tracking) {
        setHasTrackingData(true);
        const groups = buildSessionGroups(tracking, unstaged, staged);
        const resolved = await resolveLabels(cwd, groups, tracking.sessions);
        setSessionGroups(resolved);

        // Update selected session's file counts if active
        if (selectedSession) {
          const updated = resolved.find(
            (g) => g.session_id === selectedSession.session_id,
          );
          if (updated) {
            setSelectedSession(updated);
          } else {
            // Session has no more active files — clear filter
            setSelectedSession(null);
          }
        }
      } else {
        setHasTrackingData(false);
        setSessionGroups([]);
      }

      if (!selectedFile) {
        const first = unstaged[0] ?? staged[0];
        if (first) {
          setSelectedFile(first.path);
          setSelectedStaged(!unstaged[0]);
        }
      }
    });
  }, [tick]);

  // Refresh diff
  useEffect(() => {
    if (tick === tickToSkipRef.current) {
      tickToSkipRef.current = -1;
      return;
    }
    if (!selectedFile) {
      setDiffContent("");
      return;
    }
    const getDiff = selectedStaged
      ? gitService.getStagedFileDiff(selectedFile)
      : gitService.getUnstagedFileDiff(selectedFile);
    getDiff.then(setDiffContent).catch(() => setDiffContent(""));
  }, [selectedFile, selectedStaged, tick]);

  const selectSession = (sessionId: string) => {
    const group = sessionGroups.find((g) => g.session_id === sessionId);
    if (group) {
      setSelectedSession(group);
      setSelectedFile(null);
      setSelectedStaged(false);
    }
  };

  const clearSessionFilter = () => {
    setSelectedSession(null);
    setSelectedFile(null);
    setSelectedStaged(false);
  };

  const toggleStage = async () => {
    if (!selectedFile) return;

    const sourceAll = selectedStaged ? allStagedFiles : allFiles;
    const sourceFiltered = selectedStaged ? stagedFiles : files;
    const targetFiltered = selectedStaged ? files : stagedFiles;
    const file = sourceAll.find((f) => f.path === selectedFile);
    if (!file) return;

    if (selectedStaged) {
      await gitService.unstageFile(selectedFile);
      setAllStagedFiles((prev) => prev.filter((f) => f.path !== selectedFile));
      setAllFiles((prev) => [...prev, file]);
    } else {
      await gitService.stageFile(selectedFile);
      setAllFiles((prev) => prev.filter((f) => f.path !== selectedFile));
      setAllStagedFiles((prev) => [...prev, file]);
    }

    const remaining = sourceFiltered.filter((f) => f.path !== selectedFile);
    if (remaining.length > 0) {
      const currentIndex = sourceFiltered.findIndex(
        (f) => f.path === selectedFile,
      );
      setSelectedFile(
        remaining[Math.min(currentIndex, remaining.length - 1)]!.path,
      );
      setSelectedStaged(selectedStaged);
    } else if (targetFiltered.length > 0 || file) {
      setSelectedFile(targetFiltered[0]?.path ?? file.path);
      setSelectedStaged(!selectedStaged);
    } else {
      setSelectedFile(null);
      setSelectedStaged(false);
    }

    tickToSkipRef.current = tick + 1;
  };

  return {
    currentBranch,
    selectedFile,
    setSelectedFile,
    selectedStaged,
    setSelectedStaged,
    files,
    stagedFiles,
    diffContent,
    toggleStage,
    sessionGroups,
    selectedSession,
    hasTrackingData,
    selectSession,
    clearSessionFilter,
  };
}
