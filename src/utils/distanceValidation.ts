import { DistanceSettings, DISTANCE_CONSTRAINTS, ValidationResult } from '../types/settings';

// ===================================================================
// DISTANCE SETTINGS VALIDATION UTILITIES (Centimeters)
// ===================================================================

/**
 * Validasi komprehensif untuk distance settings dalam centimeter
 * 
 * Algoritma validasi:
 * 1. Validasi range absolut (5cm - 300cm)
 * 2. Validasi relasi antar jarak (min < safe < max)
 * 3. Validasi rasio keamanan
 * 4. Return hasil validasi dengan error messages
 * 
 * @param settings - Distance settings yang akan divalidasi
 * @returns ValidationResult dengan status dan error messages
 */
export const validateDistanceSettings = (settings: DistanceSettings): ValidationResult => {
  const errors: string[] = [];
  const { minDistance, safeDistance } = settings;
  const { MIN_ALLOWED, MAX_ALLOWED, MIN_SAFE_RATIO } = DISTANCE_CONSTRAINTS;

  // Validasi range absolut
  if (minDistance < MIN_ALLOWED || minDistance > MAX_ALLOWED) {
    errors.push(`Jarak minimum harus antara ${MIN_ALLOWED}cm - ${MAX_ALLOWED}cm`);
  }

  if (safeDistance < MIN_ALLOWED || safeDistance > MAX_ALLOWED) {
    errors.push(`Jarak aman harus antara ${MIN_ALLOWED}cm - ${MAX_ALLOWED}cm`);
  }

  // Validasi relasi antar jarak
  if (minDistance >= safeDistance) {
    errors.push('Jarak minimum harus lebih kecil dari jarak aman');
  }

  // Validasi rasio keamanan
  if (safeDistance < minDistance * MIN_SAFE_RATIO) {
    errors.push(`Jarak aman harus minimal ${MIN_SAFE_RATIO}x jarak minimum (${Math.round(minDistance * MIN_SAFE_RATIO)}cm)`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitasi input untuk memastikan nilai dalam range yang aman
 * 
 * @param value - Nilai input yang akan disanitasi
 * @returns Nilai yang sudah disanitasi dalam range yang aman
 */
export const sanitizeDistanceValue = (value: number): number => {
  const { MIN_ALLOWED, MAX_ALLOWED } = DISTANCE_CONSTRAINTS;
  return Math.max(MIN_ALLOWED, Math.min(MAX_ALLOWED, value));
};

/**
 * Auto-correct settings untuk memastikan konsistensi
 * 
 * @param settings - Settings yang akan di-auto-correct
 * @returns Settings yang sudah di-correct
 */
export const autoCorrectSettings = (settings: DistanceSettings): DistanceSettings => {
  let { minDistance, safeDistance } = settings;

  // Sanitasi semua nilai
  minDistance = sanitizeDistanceValue(minDistance);
  safeDistance = sanitizeDistanceValue(safeDistance);

  // Auto-correct relasi - pastikan safe distance lebih besar dari minimum
  if (safeDistance <= minDistance) {
    safeDistance = minDistance + 10; // Tambah 10cm
  }

  return { minDistance, safeDistance };
};