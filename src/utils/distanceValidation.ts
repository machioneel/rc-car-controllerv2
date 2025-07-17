import { DistanceSettings, DISTANCE_CONSTRAINTS, ValidationResult } from '../types/settings';

// ===================================================================
// DISTANCE SETTINGS VALIDATION UTILITIES (Centimeters) - SIMPLIFIED
// ===================================================================

/**
 * Validasi untuk distance settings dalam centimeter
 * 
 * @param settings - Distance settings yang akan divalidasi
 * @returns ValidationResult dengan status dan error messages
 */
export const validateDistanceSettings = (settings: DistanceSettings): ValidationResult => {
  const errors: string[] = [];
  const { minDistance } = settings;
  const { MIN_ALLOWED, MAX_ALLOWED } = DISTANCE_CONSTRAINTS;

  // Validasi range absolut
  if (minDistance < MIN_ALLOWED || minDistance > MAX_ALLOWED) {
    errors.push(`Jarak minimum harus antara ${MIN_ALLOWED}cm - ${MAX_ALLOWED}cm`);
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
  let { minDistance } = settings;

  // Sanitasi nilai
  minDistance = sanitizeDistanceValue(minDistance);

  return { minDistance };
};