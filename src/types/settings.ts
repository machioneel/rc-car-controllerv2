// ===================================================================
// DISTANCE SETTINGS TYPE DEFINITIONS (in Centimeters) - SIMPLIFIED
// ===================================================================

/**
 * Interface untuk pengaturan jarak minimum dalam centimeter
 */
export interface DistanceSettings {
  minDistance: number;    // Jarak minimum dalam cm (untuk stop/mundur)
}

/**
 * Default values untuk distance settings
 */
export const DEFAULT_DISTANCE_SETTINGS: DistanceSettings = {
  minDistance: 15,    // 15cm - jarak minimum untuk stop
};

/**
 * Validation constraints untuk distance settings
 */
export const DISTANCE_CONSTRAINTS = {
  MIN_ALLOWED: 5,       // 5cm - batas minimum absolut
  MAX_ALLOWED: 300,     // 300cm - batas maksimum absolut
};

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}