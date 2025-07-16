// ===================================================================
// DISTANCE SETTINGS TYPE DEFINITIONS (in Centimeters)
// ===================================================================

/**
 * Interface untuk pengaturan jarak autonomous dalam centimeter
 */
export interface DistanceSettings {
  minDistance: number;    // Jarak minimum dalam cm (untuk stop/mundur)
  maxDistance: number;    // Jarak maksimum dalam cm (untuk deteksi obstacle)
  safeDistance: number;   // Jarak aman untuk navigasi normal dalam cm
}

/**
 * Default values untuk distance settings
 */
export const DEFAULT_DISTANCE_SETTINGS: DistanceSettings = {
  minDistance: 15,    // 15cm - jarak minimum untuk stop
  maxDistance: 100,   // 100cm - jarak maksimum deteksi
  safeDistance: 30,   // 30cm - jarak aman untuk navigasi
};

/**
 * Validation constraints untuk distance settings
 */
export const DISTANCE_CONSTRAINTS = {
  MIN_ALLOWED: 5,       // 5cm - batas minimum absolut
  MAX_ALLOWED: 300,     // 300cm - batas maksimum absolut
  MIN_SAFE_RATIO: 1.5,  // safeDistance harus minimal 1.5x minDistance
  MAX_SAFE_RATIO: 0.8,  // safeDistance harus maksimal 0.8x maxDistance
};

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];