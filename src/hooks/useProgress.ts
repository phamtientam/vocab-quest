import { useState, useCallback } from 'react';

interface Progress {
  totalScore: number;
  wordsLearned: Set<string>;
  gamesPlayed: number;
  bestScores: Record<string, number>;
}

const STORAGE_KEY = 'vocabquest_progress';

function load(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      wordsLearned: new Set(parsed.wordsLearned || []),
    };
  } catch {
    return defaultProgress();
  }
}

function defaultProgress(): Progress {
  return {
    totalScore: 0,
    wordsLearned: new Set(),
    gamesPlayed: 0,
    bestScores: {},
  };
}

function save(p: Progress) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...p, wordsLearned: [...p.wordsLearned] })
    );
  } catch {
    // Storage unavailable
  }
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(load);

  const addScore = useCallback((gameId: string, points: number) => {
    setProgress(prev => {
      const next = {
        ...prev,
        totalScore: prev.totalScore + points,
        gamesPlayed: prev.gamesPlayed + 1,
        bestScores: {
          ...prev.bestScores,
          [gameId]: Math.max(prev.bestScores[gameId] ?? 0, points),
        },
      };
      save(next);
      return next;
    });
  }, []);

  const markWordLearned = useCallback((word: string) => {
    setProgress(prev => {
      const next = {
        ...prev,
        wordsLearned: new Set([...prev.wordsLearned, word.toLowerCase()]),
      };
      save(next);
      return next;
    });
  }, []);

  const resetProgress = useCallback(() => {
    const next = defaultProgress();
    save(next);
    setProgress(next);
  }, []);

  return { progress, addScore, markWordLearned, resetProgress };
}
