import type { BagDisc, DiscRecommendation } from '../types/disc';
import type { WindContext } from '../types/weather';
import { bearingDegrees } from './distance';

/**
 * ACED Smart Caddie — wind-adjusted rule-based disc recommendation engine
 *
 * Inputs: hole distance, wind, player's bag
 * Output: top 1–3 disc recommendations with reasoning
 */

interface CaddieInput {
  distanceFt: number;
  windSpeedMph: number;
  windDirectionDeg: number;  // where wind is coming FROM, meteorological convention
  teeLat?: number;
  teeLng?: number;
  basketLat?: number;
  basketLng?: number;
  playerBag: BagDisc[];
  isRHBH?: boolean;  // right-hand backhand (default throw style)
}

// Speed ranges → disc category
const SPEED_RANGES = {
  putter:  { min: 1, max: 3, label: 'putter' },
  mid:     { min: 4, max: 5, label: 'mid-range' },
  fairway: { min: 6, max: 8, label: 'fairway driver' },
  driver:  { min: 9, max: 14, label: 'distance driver' },
} as const;

function getSpeedRangeForDistance(distanceFt: number) {
  if (distanceFt <= 150) return SPEED_RANGES.putter;
  if (distanceFt <= 250) return SPEED_RANGES.mid;
  if (distanceFt <= 380) return SPEED_RANGES.fairway;
  return SPEED_RANGES.driver;
}

function computeWindContext(
  windSpeedMph: number,
  windDirectionDeg: number,
  teeLat?: number,
  teeLng?: number,
  basketLat?: number,
  basketLng?: number
): WindContext {
  // If we have GPS coords, compute the hole bearing
  let holeBearingDeg = 0;
  if (teeLat !== undefined && teeLng !== undefined && basketLat !== undefined && basketLng !== undefined) {
    holeBearingDeg = bearingDegrees(teeLat, teeLng, basketLat, basketLng);
  }

  // Wind angle relative to throw direction
  // windDirectionDeg = where wind comes FROM
  // holeBearingDeg = where the disc is going TO
  const relativeDeg = ((windDirectionDeg - holeBearingDeg) + 360) % 360;

  // Component: positive = headwind, negative = tailwind
  const component = Math.round(windSpeedMph * Math.cos((relativeDeg * Math.PI) / 180));
  const crossComponent = windSpeedMph * Math.sin((relativeDeg * Math.PI) / 180);

  let relativeToHole: WindContext['relativeToHole'] = 'calm';
  if (windSpeedMph < 5) {
    relativeToHole = 'calm';
  } else if (Math.abs(component) >= Math.abs(crossComponent)) {
    relativeToHole = component > 0 ? 'headwind' : 'tailwind';
  } else {
    relativeToHole = crossComponent > 0 ? 'left-crosswind' : 'right-crosswind';
  }

  return {
    speedMph: windSpeedMph,
    directionDeg: windDirectionDeg,
    relativeToHole,
    component,
  };
}

function adjustedDistance(distanceFt: number, wind: WindContext): number {
  // Headwind: disc doesn't fly as far → need more disc → add effective distance
  // Tailwind: disc flies farther → less disc → subtract effective distance
  if (wind.relativeToHole === 'headwind') {
    return distanceFt + (wind.component / 5) * 12;
  }
  if (wind.relativeToHole === 'tailwind') {
    return distanceFt + (wind.component / 5) * 10; // component is negative
  }
  return distanceFt;
}

function scoreDisc(
  disc: BagDisc,
  speedRange: typeof SPEED_RANGES[keyof typeof SPEED_RANGES],
  wind: WindContext,
  isRHBH: boolean
): number {
  let score = 0;

  // Speed range match
  if (disc.speed >= speedRange.min && disc.speed <= speedRange.max) {
    score += 100;
  } else {
    const distance = Math.min(
      Math.abs(disc.speed - speedRange.min),
      Math.abs(disc.speed - speedRange.max)
    );
    score -= distance * 15;
  }

  // Wind stability adjustment
  if (wind.relativeToHole === 'headwind') {
    // Into headwind: prefer overstable (higher fade, less turn)
    score += disc.fade * 8;
    score -= disc.turn * 5;
  } else if (wind.relativeToHole === 'tailwind') {
    // Tailwind: understable is fine, disc won't flip as much
    score += disc.glide * 5;
  } else if (wind.relativeToHole === 'left-crosswind') {
    // RHBH: left cross = hyzer side, prefer overstable
    score += (isRHBH ? disc.fade * 6 : disc.turn * 6);
  } else if (wind.relativeToHole === 'right-crosswind') {
    // RHBH: right cross = anhyzer side, prefer understable
    score += (isRHBH ? -disc.turn * 6 : -disc.fade * 6);
  }

  // Prefer non-worn discs
  if (disc.isWorn) score -= 10;

  return score;
}

function buildReason(
  disc: BagDisc,
  wind: WindContext,
  effectiveDist: number,
  speedRange: typeof SPEED_RANGES[keyof typeof SPEED_RANGES]
): string {
  const parts: string[] = [];

  parts.push(`${disc.nickname ?? disc.name} (${speedRange.label})`);

  if (wind.relativeToHole === 'headwind' && wind.speedMph >= 5) {
    parts.push(`overstable into ${wind.speedMph} mph headwind`);
  } else if (wind.relativeToHole === 'tailwind' && wind.speedMph >= 5) {
    parts.push(`tailwind-friendly glide`);
  } else if (wind.relativeToHole === 'left-crosswind') {
    parts.push(`handles left crosswind with fade`);
  } else if (wind.relativeToHole === 'right-crosswind') {
    parts.push(`understable for right crosswind`);
  } else {
    parts.push(`clean flight for ${Math.round(effectiveDist)} ft`);
  }

  return parts.join(' — ');
}

export function getDiscRecommendations(input: CaddieInput): DiscRecommendation[] {
  const { distanceFt, windSpeedMph, windDirectionDeg, playerBag, isRHBH = true } = input;

  if (!playerBag || playerBag.length === 0) return [];

  const wind = computeWindContext(
    windSpeedMph,
    windDirectionDeg,
    input.teeLat,
    input.teeLng,
    input.basketLat,
    input.basketLng
  );

  const effectiveDist = adjustedDistance(distanceFt, wind);
  const speedRange = getSpeedRangeForDistance(effectiveDist);

  // Score all discs in the bag
  const scored = playerBag.map((disc) => ({
    disc,
    score: scoreDisc(disc, speedRange, wind, isRHBH),
    reason: '',
  }));

  scored.sort((a, b) => b.score - a.score);

  // Build top 3 recommendations
  return scored.slice(0, 3).map((item, index) => ({
    disc: item.disc,
    reason: buildReason(item.disc, wind, effectiveDist, speedRange),
    confidence: (index === 0 ? 'primary' : index === 1 ? 'secondary' : 'alternative') as
      DiscRecommendation['confidence'],
  }));
}

export { computeWindContext };
