import { useState, useEffect, useCallback } from 'react';
import { DistanceSettings, DEFAULT_DISTANCE_SETTINGS } from '../types/settings';
import { validateDistanceSettings, autoCorrectSettings } from '../utils/distanceValidation';

// ===================================================================
// DISTANCE SETTINGS HOOK - SIMPLIFIED
// ===================================================================

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
  
  const [settings, setSettings] = useState<DistanceSettings>(DEFAULT_DISTANCE_SETTINGS);
  const [savedSettings, setSavedSettings] = useState<DistanceSettings>(DEFAULT_DISTANCE_SETTINGS);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(true);

  const hasUnsavedChanges = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  /**
   * Load settings dari localStorage saat component mount
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored) as DistanceSettings;
        
        const correctedSettings = autoCorrectSettings(parsedSettings);
        const validation = validateDistanceSettings(correctedSettings);
        
        if (validation.isValid) {
          setSettings(correctedSettings);
          setSavedSettings(correctedSettings);
          setValidationErrors([]);
          setIsValid(true);
          
          onSettingsChange?.(correctedSettings);
        } else {
          console.warn('Pengaturan tersimpan tidak valid, menggunakan default:', validation.errors);
          setSettings(DEFAULT_DISTANCE_SETTINGS);
          setSavedSettings(DEFAULT_DISTANCE_SETTINGS);
          onSettingsChange?.(DEFAULT_DISTANCE_SETTINGS);
        }
      } else {
        onSettingsChange?.(DEFAULT_DISTANCE_SETTINGS);
      }
    } catch (error) {
      console.error('Error memuat pengaturan jarak:', error);
      setSettings(DEFAULT_DISTANCE_SETTINGS);
      setSavedSettings(DEFAULT_DISTANCE_SETTINGS);
      onSettingsChange?.(DEFAULT_DISTANCE_SETTINGS);
    }
  }, [onSettingsChange]);

  /**
   * Update settings dengan validasi real-time
   */
  const updateSettings = useCallback((newSettings: Partial<DistanceSettings>) => {
    setSettings(prevSettings => {
      const updatedSettings = { ...prevSettings, ...newSettings };
      
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
      console.warn('Tidak dapat menyimpan pengaturan yang tidak valid');
      return;
    }

    try {
      const correctedSettings = autoCorrectSettings(settings);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(correctedSettings));
      
      setSettings(correctedSettings);
      setSavedSettings(correctedSettings);
      
      onSettingsChange?.(correctedSettings);
      
      console.log('Pengaturan jarak disimpan:', correctedSettings);
    } catch (error) {
      console.error('Error menyimpan pengaturan jarak:', error);
    }
  }, [settings, isValid, onSettingsChange]);

  /**
   * Reset ke default settings
   */
  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_DISTANCE_SETTINGS);
    setValidationErrors([]);
    setIsValid(true);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DISTANCE_SETTINGS));
      setSavedSettings(DEFAULT_DISTANCE_SETTINGS);
      onSettingsChange?.(DEFAULT_DISTANCE_SETTINGS);
    } catch (error) {
      console.error('Error menyimpan pengaturan default:', error);
    }
  }, [onSettingsChange]);

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