// Round and scoring types

export type ScoreRelativeToPar =
  | 'ace'       // hole-in-one
  | 'eagle'     // -2
  | 'birdie'    // -1
  | 'par'       // 0
  | 'bogey'     // +1
  | 'double'    // +2
  | 'triple'    // +3+
  | 'unknown';

export interface HoleScore {
  holeNumber: number;
  par: number;
  strokes: number;
  discUsed?: string;
  notes?: string;
  relativeToPar?: ScoreRelativeToPar;
}

export interface Round {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  layoutId?: string;
  layoutName?: string;
  startedAt: string;
  finishedAt?: string;
  totalScore?: number;
  totalPar?: number;
  scores: HoleScore[];
  weatherSnapshot?: import('./weather').Weather;
}

export interface ActiveRound {
  round: Round;
  currentHoleIndex: number;
  bagId?: string;
}
