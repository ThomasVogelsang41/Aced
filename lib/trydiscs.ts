import Constants from 'expo-constants';
import type { TryDiscsDisc } from '../types/disc';

const BASE_URL = 'https://api.trydiscs.com/v1';
const API_KEY = Constants.expoConfig?.extra?.tryDiscsApiKey as string;

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

export async function searchDiscs(params: {
  query?: string;
  brand?: string;
  category?: string;
  minSpeed?: number;
  maxSpeed?: number;
  limit?: number;
  offset?: number;
}): Promise<TryDiscsDisc[]> {
  const url = new URL(`${BASE_URL}/discs`);
  if (params.query) url.searchParams.set('search', params.query);
  if (params.brand) url.searchParams.set('brand', params.brand);
  if (params.category) url.searchParams.set('category', params.category);
  if (params.minSpeed !== undefined) url.searchParams.set('min_speed', String(params.minSpeed));
  if (params.maxSpeed !== undefined) url.searchParams.set('max_speed', String(params.maxSpeed));
  if (params.limit !== undefined) url.searchParams.set('limit', String(params.limit));
  if (params.offset !== undefined) url.searchParams.set('offset', String(params.offset));
  // Exclude discontinued by default
  url.searchParams.set('discontinued', 'false');

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error(`TryDiscs API error: ${res.status}`);
  const data = await res.json();
  return data.discs ?? data ?? [];
}

export async function getDisc(brand: string, disc: string): Promise<TryDiscsDisc | null> {
  const encodedBrand = encodeURIComponent(brand);
  const encodedDisc = encodeURIComponent(disc);
  const res = await fetch(`${BASE_URL}/discs/${encodedBrand}/${encodedDisc}`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`TryDiscs API error: ${res.status}`);
  return res.json();
}

export async function getBrands(): Promise<Array<{ brand: string; disc_count: number }>> {
  const res = await fetch(`${BASE_URL}/brands`, { headers });
  if (!res.ok) throw new Error(`TryDiscs API error: ${res.status}`);
  return res.json();
}

export async function getDiscsByBrand(brand: string): Promise<TryDiscsDisc[]> {
  const encodedBrand = encodeURIComponent(brand);
  const res = await fetch(`${BASE_URL}/discs/${encodedBrand}`, { headers });
  if (!res.ok) throw new Error(`TryDiscs API error: ${res.status}`);
  const data = await res.json();
  return data.discs ?? data ?? [];
}

// Attribution — must be shown wherever TryDiscs data appears
export const TRYDISCS_ATTRIBUTION = {
  text: 'Disc data by Try Discs',
  url: 'https://trydiscs.com',
};
