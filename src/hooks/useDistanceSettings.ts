import { useState, useEffect, useCallback } from 'react';
import { DistanceSettings, DEFAULT_DISTANCE_SETTINGS } from '../types/settings';
import { validateDistanceSettings, autoCorrectSettings } from '../utils/distanceValidation';

// ===================================================================
// DISTANCE SETTINGS HOOK
// ===================================================================

/**
 * Custom hook untuk mengelola distance settings dengan persistence
 * 
 * Fitur:
 * 1. Load settings dari localStorage saat init
 * 2. Auto-save ke localStorage saat settings berubah
 * 3. Validasi real-time
 * 4. Auto-correction untuk nilai yang tidak valid
 * 5. Callback untuk notifikasi perubahan ke parent
 */

const STORAGE_KEY = 'rc_car_distance_settings';

interface UseDistanceSettingsReturn {
  settings: DistanceSettings;
  updateSettings: (newSettings: Partial<DistanceSettings>) => void;
  resetToDefaults: () => void;
  isValid: boolean;
  validationErrors: string[];
  hasUnsavedChanges: boolean;
  saveSettings: () => void;
}

export const useDistanceSettings = (
  onSettingsChange?: (settings: DistanceSettings) => void
): UseDistanceSettingsReturn => {
  
  // ===============================================================
  // STATE MANAGEMENT
  // ===============================================================
  
  const [settings, setSettings] = useState<DistanceSettings>(DEFAULT_DISTANCE_SETTINGS);
  const [savedSettings, setSavedSettings] = useState<DistanceSettings>(DEFAULT_DISTANCE_SETTINGS);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(true);

  // ===============================================================
  // COMPUTED VALUES
  // ===============================================================
  
  const hasUnsavedChanges = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  // ===============================================================
  // INITIALIZATION
  // ===============================================================
  
  /**
   * Load settings dari localStorage saat component mount
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored) as DistanceSettings;
        
        // Validasi dan auto-correct jika diperlukan
        const correctedSettings = autoCorrectSettings(parsedSettings);
        const validation = validateDistanceSettings(correctedSettings);
        
        if (validation.isValid) {
          setSettings(correctedSettings);
          setSavedSettings(correctedSettings);
          setValidationErrors([]);
          setIsValid(true);
          
          // Notify parent component
          onSettingsChange?.(correctedSettings);
        } else {
          // Jika stored settings tidak valid, gunakan default
          console.warn('Invalid stored settings, using defaults:', validation.errors);
          setSettings(DEFAULT_DISTANCE_SETTINGS);
          setSavedSettings(DEFAULT_DISTANCE_SETTINGS);
          onSettingsChange?.(DEFAULT_DISTANCE_SETTINGS);
        }
      } else {
        // Tidak ada stored settings, gunakan default
        onSettingsChange?.(DEFAULT_DISTANCE_SETTINGS);
      }
    } catch (error) {
      console.error('Error loading distance settings:', error);
      setSettings(DEFAULT_DISTANCE_SETTINGS);
      setSavedSettings(DEFAULT_DISTANCE_SETTINGS);
      onSettingsChange?.(DEFAULT_DISTANCE_SETTINGS);
    }
  }, [onSettingsChange]);

  // ===============================================================
  // SETTINGS MANAGEMENT FUNCTIONS
  // ===============================================================
  
  /**
   * Update settings dengan validasi real-time
   */
  const updateSettings = useCallback((newSettings: Partial<DistanceSettings>) => {
    setSettings(prevSettings => {
      const updatedSettings = { ...prevSettings, ...newSettings };
      
      // Validasi settings baru
      const validation = validateDistanceSettings(updatedSettings);
      setValidationErrors(validation.errors);
      setIsValid(validation.isValid);
      
      return updatedSettings;
    });
  }, []);

  /**
   * Save settings ke localStorage dan notify parent
   */
  const saveSettings = useCallback(() => {
    if (!isValid) {
      console.warn('Cannot save invalid settings');
      return;
    }

    try {
      // Auto-correct sebelum save untuk memastikan konsistensi
      const correctedSettings = autoCorrectSettings(settings);
      
      // Save ke localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(correctedSettings));
      
      // Update state
      setSettings(correctedSettings);
      setSavedSettings(correctedSettings);
      
      // Notify parent component
      onSettingsChange?.(correctedSettings);
      
      console.log('Distance settings saved:', correctedSettings);
    } catch (error) {
      console.error('Error saving distance settings:', error);
    }
  }, [settings, isValid, onSettingsChange]);

  /**
   * Reset ke default settings
   */
  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_DISTANCE_SETTINGS);
    setValidationErrors([]);
    setIsValid(true);
    
    // Auto-save defaults
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DISTANCE_SETTINGS));
      setSavedSettings(DEFAULT_DISTANCE_SETTINGS);
      onSettingsChange?.(DEFAULT_DISTANCE_SETTINGS);
    } catch (error) {
      console.error('Error saving default settings:', error);
    }
  }, [onSettingsChange]);

  // ===============================================================
  // RETURN HOOK VALUES
  // ===============================================================
  
  return {
    settings,
    updateSettings,
    resetToDefaults,
    isValid,
    validationErrors,
    hasUnsavedChanges,
    saveSettings,
  };
};