import { useSyncExternalStore, useCallback } from "react";
import type { AnalyzeResponse, CategoryScore, SkinType } from "../types/api";

export interface AnalysisRecord {
  id: string;
  timestamp: number;
  score: number;
  categories: CategoryScore[];
  skinType: SkinType | null;
  fullResult: AnalyzeResponse;
}

const STORAGE_KEY = "skinnerd_analysis_history";
const MAX_RECORDS = 50;

let listeners: Array<() => void> = [];

function emitChange() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getRecords(): AnalysisRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecords(records: AnalysisRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, MAX_RECORDS)));
  } catch {
    // quota exceeded - remove oldest records and retry
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 10)));
    } catch {
      // give up silently
    }
  }
}

let snapshotCache: AnalysisRecord[] | null = null;

function getSnapshot(): AnalysisRecord[] {
  if (!snapshotCache) {
    snapshotCache = getRecords();
  }
  return snapshotCache;
}

export function useAnalysisHistory() {
  const records = useSyncExternalStore(subscribe, getSnapshot);

  const addRecord = useCallback((result: AnalyzeResponse) => {
    const record: AnalysisRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      score: Math.round(result.score.overall * 100) / 100,
      categories: result.score.categories,
      skinType: result.recommendation?.skin_type ?? null,
      fullResult: result,
    };
    const updated = [record, ...getRecords()].slice(0, MAX_RECORDS);
    saveRecords(updated);
    snapshotCache = updated;
    emitChange();
    return record;
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    snapshotCache = [];
    emitChange();
  }, []);

  const latestRecord = records[0] ?? null;
  const previousRecord = records[1] ?? null;
  const scoreDelta = latestRecord && previousRecord
    ? Math.round((latestRecord.score - previousRecord.score) * 100) / 100
    : null;

  return {
    records,
    addRecord,
    latestRecord,
    previousRecord,
    scoreDelta,
    clearHistory,
  };
}

/** Standalone function for non-hook reads */
export function getLatestAnalysis(): AnalysisRecord | null {
  const records = getRecords();
  return records[0] ?? null;
}
