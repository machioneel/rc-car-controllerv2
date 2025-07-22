import React, { useState } from 'react';
import { Settings, Save, RotateCcw, AlertTriangle, CheckCircle, Ruler } from 'lucide-react';
import { useDistanceSettings } from '../hooks/useDistanceSettings';
import { DistanceSettings } from '../types/settings';

interface DistanceSettingsPanelProps {
  onSettingsChange?: (settings: DistanceSettings) => void;
  isConnected: boolean;
}

export const DistanceSettingsPanel: React.FC<DistanceSettingsPanelProps> = ({ 
  onSettingsChange, 
  isConnected 
}) => {
  
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

  const handleInputChange = (field: keyof DistanceSettings, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      updateSettings({ [field]: numValue });
    }
  };

  const handleSave = () => {
    if (isValid) {
      saveSettings();
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset pengaturan jarak ke nilai default?')) {
      resetToDefaults();
    }
  };

  const getInputStyling = () => {
    return validationErrors.length > 0
      ? 'border-red-500 bg-red-500/10 focus:ring-red-500' 
      : 'border-gray-600 bg-gray-700/50 focus:ring-cyan-500';
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50">
      
      {/* Header with toggle */}
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
            {isValid ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            )}
            
            {hasUnsavedChanges && (
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            )}
            
            <Settings className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </div>
        </div>
        
        <div className="mt-2 text-sm text-gray-400">
          Jarak Minimum: {settings.minDistance}cm
        </div>
      </div>

      {/* Expandable content */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          
          {/* Validation errors */}
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

          {/* Minimum distance input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Jarak Minimum (cm)
            </label>
            <div className="relative">
              <input
                type="number"
                min="5"
                max="300"
                step="1"
                value={settings.minDistance}
                onChange={(e) => handleInputChange('minDistance', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border transition-all text-white placeholder-gray-400 ${getInputStyling()}`}
                placeholder="15"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">cm</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Jarak untuk berhenti atau mundur (5-300cm)</p>
          </div>

          {/* Action buttons */}
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

          {/* Connection status warning */}
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