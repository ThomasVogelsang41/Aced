import { create } from 'zustand';
import type { ActiveRound, HoleScore } from '../types/round';
import type { Course, CourseLayout, Hole } from '../types/course';

interface RoundState {
  activeRound: ActiveRound | null;
  course: Course | null;
  layout: CourseLayout | null;
  holes: Hole[];
  // Actions
  startRound: (course: Course, layout?: CourseLayout, holes?: Hole[], bagId?: string) => string;
  recordScore: (holeNumber: number, strokes: number, discUsed?: string, notes?: string) => void;
  nextHole: () => void;
  prevHole: () => void;
  goToHole: (index: number) => void;
  finishRound: () => ActiveRound | null;
  abandonRound: () => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function computeRelativeToPar(strokes: number, par: number) {
  const diff = strokes - par;
  if (strokes === 1) return 'ace';
  if (diff <= -2) return 'eagle';
  if (diff === -1) return 'birdie';
  if (diff === 0) return 'par';
  if (diff === 1) return 'bogey';
  if (diff === 2) return 'double';
  return 'triple';
}

export const useRoundStore = create<RoundState>((set, get) => ({
  activeRound: null,
  course: null,
  layout: null,
  holes: [],

  startRound: (course, layout, holes = [], bagId) => {
    const id = generateId();
    const holeCount = layout?.holes?.length ?? course.holeCount;

    // Build initial empty scores based on hole count
    const scores: HoleScore[] = Array.from({ length: holeCount }, (_, i) => ({
      holeNumber: i + 1,
      par: holes[i]?.par ?? 3,
      strokes: 0,
    }));

    const activeRound: ActiveRound = {
      round: {
        id,
        userId: '',  // will be set when saving to Supabase
        courseId: course.id,
        courseName: course.name,
        layoutId: layout?.id,
        layoutName: layout?.name,
        startedAt: new Date().toISOString(),
        scores,
      },
      currentHoleIndex: 0,
      bagId,
    };

    set({ activeRound, course, layout: layout ?? null, holes });
    return id;
  },

  recordScore: (holeNumber, strokes, discUsed, notes) => {
    const { activeRound, holes } = get();
    if (!activeRound) return;

    const updatedScores = activeRound.round.scores.map((s) => {
      if (s.holeNumber !== holeNumber) return s;
      const hole = holes.find((h) => h.holeNumber === holeNumber);
      return {
        ...s,
        strokes,
        discUsed,
        notes,
        relativeToPar: computeRelativeToPar(strokes, hole?.par ?? s.par) as HoleScore['relativeToPar'],
      };
    });

    set({
      activeRound: {
        ...activeRound,
        round: { ...activeRound.round, scores: updatedScores },
      },
    });
  },

  nextHole: () => {
    const { activeRound } = get();
    if (!activeRound) return;
    const max = activeRound.round.scores.length - 1;
    if (activeRound.currentHoleIndex < max) {
      set({
        activeRound: {
          ...activeRound,
          currentHoleIndex: activeRound.currentHoleIndex + 1,
        },
      });
    }
  },

  prevHole: () => {
    const { activeRound } = get();
    if (!activeRound) return;
    if (activeRound.currentHoleIndex > 0) {
      set({
        activeRound: {
          ...activeRound,
          currentHoleIndex: activeRound.currentHoleIndex - 1,
        },
      });
    }
  },

  goToHole: (index) => {
    const { activeRound } = get();
    if (!activeRound) return;
    set({ activeRound: { ...activeRound, currentHoleIndex: index } });
  },

  finishRound: () => {
    const { activeRound } = get();
    if (!activeRound) return null;

    // Compute totals
    const totalScore = activeRound.round.scores.reduce((acc, s) => acc + (s.strokes || 0), 0);
    const totalPar = activeRound.round.scores.reduce((acc, s) => acc + s.par, 0);

    const finishedRound: ActiveRound = {
      ...activeRound,
      round: {
        ...activeRound.round,
        finishedAt: new Date().toISOString(),
        totalScore,
        totalPar,
      },
    };

    set({ activeRound: null, course: null, layout: null, holes: [] });
    return finishedRound;
  },

  abandonRound: () => {
    set({ activeRound: null, course: null, layout: null, holes: [] });
  },
}));
