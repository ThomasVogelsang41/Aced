// Course types — aligned with DiscGolfAPI + OpenStreetMap Overpass disc_golf feature geometry

export interface DiscGolfApiCourse {
  id: string;
  slug?: string;
  name: string;
  lat?: number;
  lon?: number;
  latitude?: number;
  longitude?: number;
  locality?: string;
  city?: string;
  region_code?: string;
  state?: string;
  country_code?: string;
  country?: string;
  holes?: number;
  hole_count?: number;
  holes_count?: number;
  operational_status?: string;
  primary_layout?: {
    id?: string;
    name?: string;
    holes?: number;
    par_total?: number | null;
    length_meters?: number | null;
  };
  location?: {
    city: string;
    state: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  rating?: number;
  status?: 'open' | 'closed' | 'unknown';
}

export interface Course {
  id: string;            // DiscGolfAPI id
  name: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  holeCount: number;
  totalDistanceFt?: number;
  parTotal?: number;
  distanceMiles?: number;  // computed at runtime
  rating?: number;
  status?: 'open' | 'closed' | 'unknown';
  layouts?: CourseLayout[];
  hasOsmGeometry?: boolean;
}

export interface CourseLayout {
  id: string;
  courseId: string;
  name: string;           // "Main", "Blue", "White", "Pro"
  parTotal: number;
  holes: Hole[];
  isOsmVerified?: boolean;
}

export interface Mando {
  lat: number;
  lng: number;
  direction?: string;
}

export interface OutOfBoundsZone {
  coordinates: { lat: number; lng: number }[];
}

export interface Hole {
  id: string;
  layoutId: string;
  holeNumber: number;
  par: number;
  distanceFt: number;
  distanceProFt?: number;
  teeLat?: number;
  teeLng?: number;
  basketLat?: number;
  basketLng?: number;
  fairwayPath?: { lat: number; lng: number }[];
  mandos?: Mando[];
  outOfBounds?: OutOfBoundsZone[];
  dropZone?: { lat: number; lng: number };
  isOsmVerified?: boolean;
  notes?: string;
}
