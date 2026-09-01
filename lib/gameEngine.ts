// ACED Game Engine — Universal scoring calculation layer

import type { HoleScore, GameType, Player, GameSettings } from '../types/round';

export interface GameStatusSummary {
  headline: string;
  subline: string;
  badgeColor?: string;
  details: { playerName: string; valueText: string; highlight?: boolean }[];
}

export function getHandicapStrokesForHole(
  player: Player,
  lowestHandicap: number,
  holeNumber: number
): number {
  const diff = Math.max(0, player.handicap - lowestHandicap);
  const fullStrokes = Math.floor(diff / 18);
  const remainder = Math.round(diff % 18);
  const handicapOrder = [2, 5, 7, 11, 14, 17, 1, 4, 8, 10, 13, 16, 3, 6, 9, 12, 15, 18];
  const getsExtra = handicapOrder.slice(0, remainder).includes(holeNumber);
  return fullStrokes + (getsExtra ? 1 : 0);
}

export function computeGameStatus(
  gameType: GameType = 'stroke',
  players: Player[] = [],
  playerScores: { [playerId: string]: HoleScore[] } = {},
  currentHoleIndex: number = 0,
  settings: GameSettings = {}
): GameStatusSummary {
  const currentHoleNum = currentHoleIndex + 1;
  const lowestHandicap = players.length > 0 ? Math.min(...players.map((p) => p.handicap)) : 0;

  // 1. SKINS GAME
  if (gameType === 'skins') {
    let carriedSkins = 0;
    const skinTallies: { [playerId: string]: number } = {};
    players.forEach((p) => (skinTallies[p.id] = 0));

    for (let h = 0; h <= currentHoleIndex; h++) {
      const holeStrokes = players.map((p) => {
        const raw = playerScores[p.id]?.[h]?.strokes || 0;
        const extraStrokes = settings.useHandicap
          ? getHandicapStrokesForHole(p, lowestHandicap, h + 1)
          : 0;
        const net = raw > 0 ? Math.max(1, raw - extraStrokes) : 999;
        return { playerId: p.id, raw, net };
      });

      const validScores = holeStrokes.filter((x) => x.raw > 0);
      if (validScores.length === 0) continue;

      const minNet = Math.min(...validScores.map((x) => x.net));
      const winners = validScores.filter((x) => x.net === minNet);

      if (winners.length === 1) {
        const winnerId = winners[0].playerId;
        skinTallies[winnerId] = (skinTallies[winnerId] || 0) + 1 + carriedSkins;
        carriedSkins = 0;
      } else {
        if (settings.carryTies !== false) {
          carriedSkins += 1;
        }
      }
    }

    const currentAvailableSkins = 1 + carriedSkins;
    const headline = carriedSkins > 0 ? `🔥 ${currentAvailableSkins} SKINS CARRYING` : `🔥 1 SKIN AVAILABLE`;

    return {
      headline,
      subline: players.map((p) => `${p.name}: ${skinTallies[p.id] || 0} skins`).join(' • '),
      badgeColor: '#D97706',
      details: players.map((p) => ({
        playerName: p.name,
        valueText: `${skinTallies[p.id] || 0} skins`,
      })),
    };
  }

  // 2. MATCH PLAY
  if (gameType === 'match') {
    if (players.length < 2) {
      return { headline: 'MATCH PLAY', subline: 'Add opponent to calculate match state', details: [] };
    }
    const p1 = players[0];
    const p2 = players[1];
    let p1Wins = 0;
    let p2Wins = 0;

    for (let h = 0; h <= currentHoleIndex; h++) {
      const s1Raw = playerScores[p1.id]?.[h]?.strokes || 0;
      const s2Raw = playerScores[p2.id]?.[h]?.strokes || 0;

      if (s1Raw > 0 && s2Raw > 0) {
        const h1Extra = settings.useHandicap ? getHandicapStrokesForHole(p1, lowestHandicap, h + 1) : 0;
        const h2Extra = settings.useHandicap ? getHandicapStrokesForHole(p2, lowestHandicap, h + 1) : 0;
        const net1 = Math.max(1, s1Raw - h1Extra);
        const net2 = Math.max(1, s2Raw - h2Extra);

        if (net1 < net2) p1Wins++;
        else if (net2 < net1) p2Wins++;
      }
    }

    const diff = p1Wins - p2Wins;
    let headline = 'ALL SQUARE';
    if (diff > 0) headline = `${p1.name} ${diff} UP`;
    else if (diff < 0) headline = `${p2.name} ${Math.abs(diff)} UP`;

    return {
      headline,
      subline: `Hole ${currentHoleNum} of 18`,
      badgeColor: '#2563EB',
      details: [
        { playerName: p1.name, valueText: `${p1Wins} holes won` },
        { playerName: p2.name, valueText: `${p2Wins} holes won` },
      ],
    };
  }

  // 3. BIRDIE BATTLE
  if (gameType === 'birdie_battle') {
    const points: { [playerId: string]: number } = {};
    players.forEach((p) => (points[p.id] = 0));

    players.forEach((p) => {
      (playerScores[p.id] || []).forEach((s) => {
        if (s.strokes <= 0) return;
        const diff = s.strokes - s.par;
        if (s.strokes === 1) points[p.id] += 10;
        else if (diff <= -2) points[p.id] += 5;
        else if (diff === -1) points[p.id] += 2;
        else if (diff === 0) points[p.id] += 0;
        else if (diff >= 1) points[p.id] -= 1;
      });
    });

    return {
      headline: '🎯 BIRDIE BATTLE',
      subline: players.map((p) => `${p.name}: ${points[p.id] || 0} pts`).join(' • '),
      badgeColor: '#10B981',
      details: players.map((p) => ({
        playerName: p.name,
        valueText: `${points[p.id] || 0} pts`,
      })),
    };
  }

  // 4. DISC ROULETTE
  if (gameType === 'disc_roulette') {
    return {
      headline: '🎲 DISC ROULETTE',
      subline: settings.selectedDisc ? `Throw your ${settings.selectedDisc}!` : 'Randomized Disc per Hole',
      badgeColor: '#8B5CF6',
      details: [],
    };
  }

  // 5. ONE DISC
  if (gameType === 'one_disc') {
    return {
      headline: '🥏 ONE DISC CHALLENGE',
      subline: settings.selectedDisc ? `Selected Disc: ${settings.selectedDisc}` : 'Use 1 disc for all 18 holes',
      badgeColor: '#EC4899',
      details: [],
    };
  }

  // DEFAULT: STROKE PLAY
  const details = players.map((p) => {
    const pSc = playerScores[p.id] || [];
    let relToPar = 0;
    pSc.forEach((s, idx) => {
      if (s.strokes > 0) {
        const extraStrokes = settings.useHandicap
          ? getHandicapStrokesForHole(p, lowestHandicap, idx + 1)
          : 0;
        relToPar += Math.max(1, s.strokes - extraStrokes) - s.par;
      }
    });
    const relStr = relToPar === 0 ? 'E' : relToPar > 0 ? `+${relToPar}` : `${relToPar}`;
    return {
      playerName: p.name,
      valueText: relStr,
    };
  });

  return {
    headline: 'STROKE PLAY',
    subline: details.map((d) => `${d.playerName} ${d.valueText}`).join(' • '),
    details,
  };
}
