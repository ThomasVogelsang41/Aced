import type { Weather } from '../types/weather';

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

// WMO weather code → description mapping (abbreviated)
const WMO_DESCRIPTIONS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Icy fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  80: 'Light showers',
  81: 'Showers',
  82: 'Heavy showers',
  95: 'Thunderstorm',
  99: 'Thunderstorm with hail',
};

function celsiusToFahrenheit(c: number): number {
  return Math.round(c * 9 / 5 + 32);
}

function kmhToMph(kmh: number): number {
  return Math.round(kmh * 0.621371);
}

export async function getCurrentWeather(lat: number, lng: number): Promise<Weather> {
  const url = new URL(BASE_URL);
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lng));
  url.searchParams.set(
    'current',
    'temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code'
  );
  url.searchParams.set('temperature_unit', 'celsius');
  url.searchParams.set('wind_speed_unit', 'kmh');
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '1');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
  const data = await res.json();
  const c = data.current;

  const weatherCode: number = c.weather_code ?? 0;

  return {
    temperature: celsiusToFahrenheit(c.temperature_2m),
    windSpeed: kmhToMph(c.wind_speed_10m),
    windDirection: c.wind_direction_10m,
    windGust: c.wind_gusts_10m ? kmhToMph(c.wind_gusts_10m) : undefined,
    weatherCode,
    description: WMO_DESCRIPTIONS[weatherCode] ?? 'Unknown',
    timestamp: c.time,
  };
}

/**
 * Returns a cardinal direction string from degrees
 * N, NE, E, SE, S, SW, W, NW
 */
export function degreesToCardinal(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(deg / 45) % 8;
  return dirs[index];
}

/**
 * Returns a wind emoji based on speed
 */
export function windEmoji(speedMph: number): string {
  if (speedMph < 5) return '🍃';
  if (speedMph < 12) return '💨';
  if (speedMph < 20) return '🌬️';
  return '💨💨';
}
