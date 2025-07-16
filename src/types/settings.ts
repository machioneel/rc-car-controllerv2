// ===================================================================
// SETTINGS TYPE DEFINITIONS
// ===================================================================

/**
 * Interface untuk pengaturan jarak autonomous
 */
export interface DistanceSettings {
  minDistance: number;    // Jarak minimum dalam meter (untuk stop/mundur)
  maxDistance: number;    // Jarak maksimum dalam meter (untuk deteksi obstacle)
  safeDistance: number;   // Jarak aman untuk navigasi normal
}

/**
 * Default values untuk distance settings
 */
export const DEFAULT_DISTANCE_SETTINGS: DistanceSettings = {
  minDistance: 0.3,   // 30cm - jarak minimum untuk stop
  maxDistance: 2.0,   // 2m - jarak maksimum deteksi
  safeDistance: 1.0,  // 1m - jarak aman untuk navigasi
};

/**
 * Validation constraints untuk distance settings
 */
export const DISTANCE_CONSTRAINTS = {
  MIN_ALLOWED: 0.1,     // 10cm - batas minimum absolut
  MAX_ALLOWED: 10.0,    // 10m - batas maksimum absolut
  MIN_SAFE_RATIO: 1.5,  // safeDistance harus minimal 1.5x minDistance
  MAX_SAFE_RATIO: 0.8,  // safeDistance harus maksimal 0.8x maxDistance
};

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}