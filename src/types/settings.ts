// ===================================================================
// DISTANCE SETTINGS TYPE DEFINITIONS (in Centimeters) - SIMPLIFIED
// ===================================================================

export interface DistanceSettings {
  minDistance: number; 
}

export const DEFAULT_DISTANCE_SETTINGS: DistanceSettings = {
  minDistance: 15, 
};

export const DISTANCE_CONSTRAINTS = {
  MIN_ALLOWED: 5,
  MAX_ALLOWED: 300,
};

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}