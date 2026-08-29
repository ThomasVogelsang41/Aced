/**
 * Haversine distance formula — returns distance in miles between two GPS coordinates
 */
export function haversineDistanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Returns distance in feet between two GPS coordinates
 */
export function haversineDistanceFeet(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  return haversineDistanceMiles(lat1, lng1, lat2, lng2) * 5280;
}

/**
 * Bearing in degrees from point A to point B (0 = North, clockwise)
 */
export function bearingDegrees(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Format feet to a human-readable string
 * <300 ft → "XXX ft", ≥300 ft → "XXX ft" (we stay in feet for disc golf)
 */
export function formatDistance(feet: number): string {
  if (feet < 1) return '—';
  return `${Math.round(feet)} ft`;
}
