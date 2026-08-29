// Weather types — Open-Meteo API response

export interface Weather {
  temperature: number;           // °F
  windSpeed: number;             // mph
  windDirection: number;         // degrees (0–360, 0=N)
  windGust?: number;             // mph
  weatherCode: number;           // WMO weather code
  description: string;           // human-readable
  timestamp: string;             // ISO string
}

export interface WindContext {
  speedMph: number;
  directionDeg: number;
  relativeToHole: 'headwind' | 'tailwind' | 'left-crosswind' | 'right-crosswind' | 'calm';
  component: number;             // signed mph — positive = headwind
}
