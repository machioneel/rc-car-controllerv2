import React, { useState } from 'react';
import { Settings, Save, RotateCcw, AlertTriangle, CheckCircle, Ruler, Shield, Target } from 'lucide-react';
import { useDistanceSettings } from '../hooks/useDistanceSettings';
import { DistanceSettings } from '../types/settings';

// ===================================================================
// DISTANCE SETTINGS PANEL COMPONENT
// ===================================================================

interface DistanceSettingsPanelProps {
  onSettingsChange?: (settings: DistanceSettings) => void;
  isConnected: boolean;
}

/**
 * Component untuk mengatur distance settings autonomous mode
 * 
 * Fitur:
 * 1. Real-time input validation
 * 2. Visual feedback untuk validation errors
 * 3. Auto-save functionality
 * 4. Reset to defaults
 * 5. Responsive design
 * 6. Safety indicators
 */
export const DistanceSettingsPanel: React.FC<DistanceSettingsPanelProps> = ({ 
  onSettingsChange, 
  isConnected 
}) => {
  
  // ===============================================================
  // HOOKS AND STATE
  // ===============================================================
  
  const {
    settings,
    updateSettings,
    resetToDefaults,
    isValid,
    validationErrors,
    hasUnsavedChanges,
    saveSettings,
  } = useDistanceSettings(onSettingsChange);

  const [isExpanded, setIsExpanded] = useState(false);

  // ===============================================================
  // EVENT HANDLERS
  // ===============================================================
  
  /**
   * Handler untuk perubahan input dengan debouncing
   */
  const handleInputChange = (field: keyof DistanceSettings, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      updateSettings({ [field]: numValue });
    }
  };

  /**
   * Handler untuk save settings
   */
  const handleSave = () => {
    if (isValid) {
      saveSettings();
    }
  };

  /**
   * Handler untuk reset ke defaults
   */
  const handleReset = () => {
    if (window.confirm('Reset semua pengaturan jarak ke nilai default?')) {
      resetToDefaults();
    }
  };

  // ===============================================================
  // UTILITY FUNCTIONS
  // ===============================================================
  
  /**
   * Get input field styling berdasarkan validation state
   */
  const getInputStyling = (field: keyof DistanceSettings) => {
    const hasFieldError = validationErrors.some(error => 
      error.toLowerCase().includes(field === 'minDistance' ? 'minimum' : 
                                  field === 'maxDistance' ? 'maksimum' : 'aman')
    );
    
    return hasFieldError 
      ? 'border-red-500 bg-red-500/10 focus:ring-red-500' 
      : 'border-gray-600 bg-gray-700/50 focus:ring-cyan-500';
  };

  // ===============================================================
  // COMPONENT RENDER
  // ===============================================================
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50">
      
      {/* =========================================================
          HEADER WITH TOGGLE
          ========================================================= */}
      <div 
        className="p-4 border-b border-gray-700/50 cursor-pointer hover:bg-gray-700/20 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center">
            <Ruler className="w-5 h-5 text-orange-500 mr-2" />
            Pengaturan Jarak
          </h3>
          
          <div className="flex items-center space-x-2">
            {/* Status indicator */}
            {isValid ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            )}
            
            {/* Unsaved changes indicator */}
            {hasUnsavedChanges && (
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            )}
            
            {/* Expand/collapse indicator */}
            <Settings className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </div>
        </div>
        
        {/* Quick status info */}
        <div className="mt-2 text-sm text-gray-400">
          Min: {settings.minDistance}cm | Safe: {settings.safeDistance}cm | Max: {settings.maxDistance}cm
        </div>
      </div>

      {/* =========================================================
          EXPANDABLE CONTENT
          ========================================================= */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          
          {/* =====================================================
              VALIDATION ERRORS DISPLAY
              ===================================================== */}
          {validationErrors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-medium text-sm mb-1">Pengaturan Tidak Valid:</p>
                  <ul className="text-red-300 text-xs space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================
              DISTANCE INPUT FIELDS
              ===================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Minimum Distance */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                <Shield className="w-4 h-4 text-red-500 mr-1" />
                Jarak Minimum
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="300"
                  step="1"
                  value={settings.minDistance}
                  onChange={(e) => handleInputChange('minDistance', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border transition-all text-white placeholder-gray-400 ${getInputStyling('minDistance')}`}
                  placeholder="15"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">cm</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Jarak untuk berhenti/mundur</p>
            </div>

            {/* Safe Distance */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                <Target className="w-4 h-4 text-green-500 mr-1" />
                Jarak Aman
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="300"
                  step="1"
                  value={settings.safeDistance}
                  onChange={(e) => handleInputChange('safeDistance', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border transition-all text-white placeholder-gray-400 ${getInputStyling('safeDistance')}`}
                  placeholder="30"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">cm</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Jarak untuk navigasi normal</p>
            </div>

            {/* Maximum Distance */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                <Ruler className="w-4 h-4 text-blue-500 mr-1" />
                Jarak Maksimum
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="300"
                  step="1"
                  value={settings.maxDistance}
                  onChange={(e) => handleInputChange('maxDistance', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border transition-all text-white placeholder-gray-400 ${getInputStyling('maxDistance')}`}
                  placeholder="100"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">cm</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Jarak deteksi maksimum</p>
            </div>
          </div>

          {/* =====================================================
              VISUAL DISTANCE INDICATOR
              ===================================================== */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Visualisasi Jarak</h4>
            <div className="relative h-8 bg-gray-700 rounded-lg overflow-hidden">
              {/* Distance zones */}
              <div 
                className="absolute left-0 top-0 h-full bg-red-500/30 border-r-2 border-red-500"
                style={{ width: `${(settings.minDistance / settings.maxDistance) * 100}%` }}
              />
              <div 
                className="absolute top-0 h-full bg-green-500/30 border-r-2 border-green-500"
                style={{ 
                  left: `${(settings.minDistance / settings.maxDistance) * 100}%`,
                  width: `${((settings.safeDistance - settings.minDistance) / settings.maxDistance) * 100}%`
                }}
              />
              <div 
                className="absolute top-0 h-full bg-blue-500/30"
                style={{ 
                  left: `${(settings.safeDistance / settings.maxDistance) * 100}%`,
                  width: `${((settings.maxDistance - settings.safeDistance) / settings.maxDistance) * 100}%`
                }}
              />
              
              {/* Labels */}
              <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-medium">
                <span className="text-red-300">STOP</span>
                <span className="text-green-300">SAFE</span>
                <span className="text-blue-300">DETECT</span>
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>0cm</span>
              <span>{settings.minDistance}cm</span>
              <span>{settings.safeDistance}cm</span>
              <span>{settings.maxDistance}cm</span>
            </div>
          </div>

          {/* =====================================================
              ACTION BUTTONS
              ===================================================== */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Default</span>
            </button>

            <div className="flex items-center space-x-3">
              {hasUnsavedChanges && (
                <span className="text-xs text-yellow-400">Perubahan belum disimpan</span>
              )}
              
              <button
                onClick={handleSave}
                disabled={!isValid || !hasUnsavedChanges || !isConnected}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  isValid && hasUnsavedChanges && isConnected
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan</span>
              </button>
            </div>
          </div>

          {/* =====================================================
              CONNECTION STATUS WARNING
              ===================================================== */}
          {!isConnected && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <p className="text-yellow-400 text-sm">
                  Koneksi terputus. Pengaturan akan diterapkan setelah koneksi pulih.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};