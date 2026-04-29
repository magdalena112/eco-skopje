export type ReportType = 'dump' | 'container' | 'air';

export interface UserProfile {
  uid: string;
  email: string;
  points: number;
  displayName?: string;
  photoURL?: string;
}

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface EnvironmentalReport {
  id?: string;
  type: ReportType;
  userId: string;
  photoUrl?: string;
  location: GeoLocation;
  description: string;
  timestamp: any; // Firestore Timestamp
  pointsAwarded: boolean;
}

export interface EcoEvent {
  id: string;
  userId: string;
  title: string;
  description: string;
  date: any; // Firestore Timestamp
  location: string;
  pointsReward: number;
  participants: string[];
  image?: string;
}

export interface WasteTransport {
  id: string;
  userId: string;
  userName: string;
  location: GeoLocation;
  description: string;
  timestamp: any; // Firestore Timestamp
  status: 'active' | 'full' | 'completed';
  capacity: string;
  interestedUsers: string[];
}
