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

export type GameType =
  | 'stroke'
  | 'skins'
  | 'match'
  | 'best_shot'
  | 'alternate_shot'
  | 'worst_shot'
  | 'disc_roulette'
  | 'one_disc'
  | 'birdie_battle'
  | 'wolf';

export interface Player {
  id: string;
  name: string;
  handicap: number;
  isUser?: boolean;
}

export interface PlayerScore {
  playerId: string;
  playerName: string;
  scores: HoleScore[];
}

export interface GameSettings {
  useHandicap?: boolean;
  skinsPerHole?: number;
  carryTies?: boolean;
  selectedDisc?: string;
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
  players?: Player[];
  playerScores?: PlayerScore[];
  gameType?: GameType;
  gameSettings?: GameSettings;
  weatherSnapshot?: import('./weather').Weather;
}

export interface ActiveRound {
  round: Round;
  currentHoleIndex: number;
  bagId?: string;
}
