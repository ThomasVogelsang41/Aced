// Course types — aligned with DiscGolfAPI + ACED's own hole/layout tables

export interface DiscGolfApiCourse {
  id: string;
  name: string;
  location: {
    city: string;
    state: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  hole_count: number;
  rating?: number;
  status?: 'open' | 'closed' | 'unknown';
  pdga_id?: string;
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
  distanceMiles?: number;  // computed at runtime
  rating?: number;
  status?: 'open' | 'closed' | 'unknown';
  layouts?: CourseLayout[];
}

export interface CourseLayout {
  id: string;
  courseId: string;
  name: string;           // "Blue", "White", "Pro"
  parTotal: number;
  holes: Hole[];
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
  notes?: string;
}
