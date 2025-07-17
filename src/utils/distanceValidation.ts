import { DistanceSettings, DISTANCE_CONSTRAINTS, ValidationResult } from '../types/settings';

// Distance settings validation utilities (Centimeters)

/**
 * Validates distance settings in centimeters
 */
export const validateDistanceSettings = (settings: DistanceSettings): ValidationResult => {
  const errors: string[] = [];
  const { minDistance } = settings;
  const { MIN_ALLOWED, MAX_ALLOWED } = DISTANCE_CONSTRAINTS;

  if (minDistance < MIN_ALLOWED || minDistance > MAX_ALLOWED) {
    errors.push(`Jarak minimum harus antara ${MIN_ALLOWED}cm - ${MAX_ALLOWED}cm`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitizes input to ensure value is within safe range
 */
export const sanitizeDistanceValue = (value: number): number => {
  const { MIN_ALLOWED, MAX_ALLOWED } = DISTANCE_CONSTRAINTS;
  return Math.max(MIN_ALLOWED, Math.min(MAX_ALLOWED, value));
};

/**
 * Auto-corrects settings to ensure consistency
 */
export const autoCorrectSettings = (settings: DistanceSettings): DistanceSettings => {
  let { minDistance } = settings;
  minDistance = sanitizeDistanceValue(minDistance);
  return { minDistance };
};