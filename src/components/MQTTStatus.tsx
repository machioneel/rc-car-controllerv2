import React from 'react';
import { Wifi, WifiOff, AlertCircle, Loader } from 'lucide-react';

// ===================================================================
// TYPE DEFINITIONS
// ===================================================================

/**
 * Props interface untuk MQTTStatus component
 */
interface MQTTStatusProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';  // Status koneksi MQTT
  isConnected: boolean;                                           // Boolean flag koneksi
}

// ===================================================================
// MQTT STATUS COMPONENT
// ===================================================================

/**
 * Component untuk menampilkan status koneksi MQTT dengan visual indicator
 * 
 * Fitur:
 * 1. Visual indicator berdasarkan status koneksi
 * 2. Color coding yang konsisten
 * 3. Icon yang sesuai untuk setiap status
 * 4. Additional info untuk connected state
 * 5. Responsive design
 * 
 * @param status - Status koneksi detail
 * @param isConnected - Boolean flag untuk koneksi
 */
export const MQTTStatus: React.FC<MQTTStatusProps> = ({ status, isConnected }) => {
  
  // ===============================================================
  // STATUS CONFIGURATION ALGORITHM
  // ===============================================================
  
  /**
   * Function untuk mendapatkan konfigurasi visual berdasarkan status
   * 
   * Algoritma:
   * 1. Switch berdasarkan status string
   * 2. Return object dengan icon, text, dan color scheme
   * 3. Konsistensi visual untuk setiap status
   * 
   * @returns Object dengan konfigurasi visual (icon, text, colors)
   */
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: <Wifi className="w-5 h-5 text-green-500" />,
          text: 'Connected',
          textColor: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20'
        };
        
      case 'connecting':
        return {
          icon: <Loader className="w-5 h-5 text-yellow-500 animate-spin" />,
          text: 'Connecting...',
          textColor: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20'
        };
        
      case 'error':
        return {
          icon: <AlertCircle className="w-5 h-5 text-red-500" />,
          text: 'Connection Error',
          textColor: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20'
        };
        
      default: // 'disconnected' dan status lainnya
        return {
          icon: <WifiOff className="w-5 h-5 text-gray-500" />,
          text: 'Disconnected',
          textColor: 'text-gray-500',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/20'
        };
    }
  };

  // Get konfigurasi visual berdasarkan status saat ini
  const config = getStatusConfig();

  // ===============================================================
  // COMPONENT RENDER
  // ===============================================================
  
  return (
    <div className={`flex items-center space-x-3 px-4 py-2 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
      
      {/* Status icon dengan animasi jika diperlukan */}
      {config.icon}
      
      {/* Status text dan additional info */}
      <div>
        {/* Main status text */}
        <span className={`${config.textColor} text-sm font-medium`}>
          {config.text}
        </span>
        
        {/* Additional info untuk connected state */}
        {isConnected && (
          <p className="text-xs text-gray-400">MQTT Broker</p>
        )}
      </div>
    </div>
  );
};