// Disc types — aligned with TryDiscs API response schema

export type DiscCategory = 'distance_driver' | 'fairway_driver' | 'midrange' | 'putter';

export interface TryDiscsDisc {
  brand: string;
  disc: string;
  category: string;
  speed: number;
  glide: number;
  turn: number;
  fade: number;
  approved: boolean;
  discontinued: boolean;
  pdga?: {
    diameter?: number;
    height?: number;
    rim_depth?: number;
    rim_width?: number;
    max_weight?: number;
  };
}

export interface Disc {
  id: string;
  brand: string;
  name: string;
  category: DiscCategory;
  speed: number;
  glide: number;
  turn: number;
  fade: number;
  // User customizations (from bag_discs table)
  nickname?: string;
  plastic?: string;
  weightGrams?: number;
  color?: string;
  isWorn?: boolean;
}

export interface BagDisc extends Disc {
  bagId: string;
  bagDiscId: string;  // UUID from bag_discs table
}

export interface Bag {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  discs: BagDisc[];
}

// For the caddie recommendation engine
export interface DiscRecommendation {
  disc: BagDisc;
  reason: string;
  confidence: 'primary' | 'secondary' | 'alternative';
}
