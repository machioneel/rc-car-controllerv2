import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Camera, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Square, Gauge, RotateCw, Bot, Play, Pause, Shield, Settings } from 'lucide-react';

// Import komponen dan hooks yang diperlukan
import { useMQTT } from './hooks/useMQTT'; 
import { MQTTStatus } from './components/MQTTStatus';
import { LogPanel } from './components/LogPanel';
import { LoginForm } from './components/LoginForm';
import { LoadingSpinner } from './components/LoadingSpinner';
import { UserProfile } from './components/UserProfile';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { saveLogToDatabase, clearLogsFromDatabase, getLogsFromDatabase } from './lib/supabase';
import { DistanceSettingsPanel } from './components/DistanceSettingsPanel';
import { DistanceSettings } from './types/settings';

// ===================================================================
// KONFIGURASI UTAMA APLIKASI
// ===================================================================

function getStableClientId() {
  const STORAGE_KEY = 'rc_car_mqtt_client_id';
  let clientId = localStorage.getItem(STORAGE_KEY);
  
  // Jika belum ada client ID, buat yang baru
  if (!clientId) {
    // Generate random string 8 karakter untuk uniqueness
    clientId = `rccar_web_controller_${Math.random().toString(16).substr(2, 8)}`;
    localStorage.setItem(STORAGE_KEY, clientId);
  }
  return clientId;
}

/**
 * Konfigurasi koneksi MQTT
 * 
 * Struktur:
 * - brokerUrl: WebSocket Secure URL untuk koneksi MQTT
 * - options: Parameter koneksi (clientId, credentials, timeout)
 */
const mqttConfig = {
  brokerUrl: 'wss://098567b786d74be2863e6859abdf1f0e.s1.eu.hivemq.cloud:8884/mqtt',
  options: {
    clientId: getStableClientId(), // ID unik untuk setiap browser session
    username: 'web-user', // Username untuk autentikasi MQTT
    password: 'Jangan999', // Password untuk autentikasi MQTT
    clean: true, // Clean session untuk menghindari message queue lama
    connectTimeout: 4000, // Timeout koneksi dalam milliseconds
  }
};

const MQTT_TOPICS = {
  CONTROL:    'esp32/car/control/move',
  SPEED:      'esp32/car/control/speed',
  FLASH:      'esp32/car/control/flash',
  DISTANCE_SETTINGS: 'esp32/car/config/distance',
  STATUS:     'esp32/car/status',
  CAMERA:     'esp32/cam/stream',
  LOG:        'esp32/car/log',
  AUTONOMOUS: 'esp32/car/command/autonomous',
  SENSOR_DISTANCE: 'esp32/car/sensor/distance'
};

// ===================================================================
// KOMPONEN CONTROLLER UTAMA (Logika RC Car)
// ===================================================================

const RCCarController: React.FC = () => {
  // ===============================================================
  // STATE MANAGEMENT
  // ===============================================================
  
  const [speedPercent, setSpeedPercent] = useState<number>(50);
  const [ledPercent, setLedPercent] = useState<number>(0);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [cameraUrl, setCameraUrl] = useState<string>('');
  const [rotation, setRotation] = useState<number>(90);
  const [isAutonomous, setIsAutonomous] = useState<boolean>(false);
  const [logs, setLogs] = useState<Array<{id: string, timestamp: Date, level: string, message: string}>>([]);
  const [distance, setDistance] = useState<number | null>(null);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Hook MQTT untuk komunikasi dengan ESP32
  const { isConnected, connectionStatus, publish, subscribe, lastMessage } = useMQTT(mqttConfig);

  // ===============================================================
  // DATABASE OPERATIONS
  // ===============================================================
  
  const loadLogsFromDatabase = useCallback(async () => {
    setIsLoadingLogs(true);
    
    try {
      const result = await getLogsFromDatabase(100, 'esp32_car');
      
      if (result.success && result.data) {
        // Convert database format ke UI format
        const dbLogs = result.data.map(dbLog => ({
          id: dbLog.id,
          timestamp: new Date(dbLog.timestamp),
          level: dbLog.level,
          message: dbLog.message
        }));
        
        setLogs(dbLogs);
      }
    } catch (error) {
      console.error('Error loading logs from database:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  /**
   * Effect untuk load logs dari database saat component mount
   */
  useEffect(() => {
    loadLogsFromDatabase();
  }, [loadLogsFromDatabase]);

  // ===============================================================
  // ALGORITMA PEMROSESAN LOG MESSAGES
  // ===============================================================
  
  const handleLogMessage = useCallback(async (logData: string) => {
    // Algoritma deteksi level log berdasarkan keyword
    let level = 'INFO'; // Default level
    if (logData.toUpperCase().includes("ERROR")) level = 'ERROR';
    if (logData.toUpperCase().includes("WARNING")) level = 'WARNING';
    if (logData.toUpperCase().includes("DEBUG")) level = 'DEBUG';
    
    // Buat log entry dengan metadata lengkap
    const newLog = {
      id: Math.random().toString(36).substr(2, 9), // Generate unique ID
      timestamp: new Date(), // Timestamp saat log diterima
      level: level, // Level log yang terdeteksi
      message: logData // Pesan log asli
    };
    
    // Simpan ke database secara asynchronous (tidak menunggu hasil)
    saveLogToDatabase({
      level: level,
      message: logData,
      device_id: 'esp32_car',
      timestamp: newLog.timestamp.toISOString()
    }).catch(error => {
      console.error('Failed to save log to database:', error);
      // Tidak mengganggu UI flow jika database save gagal
    });
    
    // Update state logs dengan batasan maksimal 100 entries
    // Menggunakan slice(0, 99) untuk mempertahankan 99 log lama + 1 log baru
    setLogs(prevLogs => [newLog, ...prevLogs.slice(0, 99)]);
  }, []);

  const handleClearLogs = useCallback(async () => {
    try {
      // Hapus logs dari database
      const result = await clearLogsFromDatabase('esp32_car');
      
      if (result.success) {
        // Reset logs state
        setLogs([]);
        
        // Tambahkan log entry untuk mencatat aksi clear
        const clearLog = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date(),
          level: 'INFO',
          message: '[WEB] System logs cleared by user'
        };
        
        // Simpan clear log ke database
        await saveLogToDatabase({
          level: 'INFO',
          message: '[WEB] System logs cleared by user',
          device_id: 'esp32_car'
        });
        
        // Set logs dengan hanya clear log entry
        setTimeout(() => {
          setLogs([clearLog]);
        }, 100); // Delay kecil untuk smooth transition
      } else {
        console.error('Failed to clear logs from database:', result.error);
        // Tetap clear UI logs meskipun database operation gagal
        setLogs([]);
      }
    } catch (error) {
      console.error('Error clearing logs:', error);
      // Fallback: clear UI logs
      setLogs([]);
    }
  }, []);

  // ===============================================================
  // DISTANCE SETTINGS MANAGEMENT
  // ===============================================================
  
  const handleDistanceSettingsChange = useCallback((settings: DistanceSettings) => {
    if (isConnected) {
      // Kirim settings ke ESP32 dalam format JSON
      const settingsPayload = JSON.stringify({
        minDistance: settings.minDistance,
        timestamp: new Date().toISOString()
      });
      
      publish(MQTT_TOPICS.DISTANCE_SETTINGS, settingsPayload);
      
      // Log perubahan
      handleLogMessage(`Pengaturan jarak diperbarui: Minimum=${settings.minDistance}cm`);
    }
  }, [isConnected, publish, handleLogMessage]);

  // ===============================================================
  // ALGORITMA PEMROSESAN MQTT MESSAGES
  // ===============================================================
  
  /**
   * Effect untuk menangani pesan MQTT yang masuk
   * 
   * Algoritma pemrosesan berdasarkan topic:
   * 1. CAMERA: Convert binary data ke Object URL untuk display
   * 2. LOG: Parse dan tambahkan ke log panel + database
   * 3. STATUS: Log status mobil ke console
   * 4. SENSOR_DISTANCE: Update nilai sensor jarak
   * 
   * Memory management: Revoke URL lama untuk mencegah memory leak
   */
  useEffect(() => {
    if (lastMessage) {
      const { topic, message } = lastMessage;
      
      // Pemrosesan stream kamera
      if (topic === MQTT_TOPICS.CAMERA) {
        const blob = new Blob([message as Buffer]);
        const newUrl = URL.createObjectURL(blob);
        setCameraUrl(prevUrl => {
          if (prevUrl) URL.revokeObjectURL(prevUrl); // Cleanup memory
          return newUrl;
        });
      } 
      // Pemrosesan log messages
      else if (topic === MQTT_TOPICS.LOG) {
        handleLogMessage(message.toString());
      } 
      // Pemrosesan status mobil
      else if (topic === MQTT_TOPICS.STATUS) {
        console.log('Status dari Mobil:', message.toString());
      } 
      // Pemrosesan data sensor jarak
      else if (topic === MQTT_TOPICS.SENSOR_DISTANCE) {
        // Convert string ke float untuk nilai numerik
        setDistance(parseFloat(message.toString()));
      }
    }
  }, [lastMessage, handleLogMessage]);

  // ===============================================================
  // ALGORITMA SUBSCRIPTION MQTT TOPICS
  // ===============================================================
  
  /**
   * Effect untuk subscribe ke topic MQTT saat koneksi berhasil
   * 
   * Algoritma:
   * 1. Tunggu hingga koneksi MQTT established
   * 2. Subscribe ke semua topic yang diperlukan untuk menerima data
   * 3. Dependency array memastikan re-subscription saat koneksi berubah
   */
  useEffect(() => {
    if (isConnected) {
      // Subscribe ke topic-topic yang diperlukan
      subscribe(MQTT_TOPICS.CAMERA);        // Stream kamera
      subscribe(MQTT_TOPICS.STATUS);        // Status mobil
      subscribe(MQTT_TOPICS.LOG);           // Log messages
      subscribe(MQTT_TOPICS.SENSOR_DISTANCE); // Data sensor
    }
  }, [isConnected, subscribe]);

  // ===============================================================
  // ALGORITMA PENGIRIMAN PERINTAH KE ESP32
  // ===============================================================
  
  /**
   * Fungsi terpusat untuk mengirim perintah ke ESP32
   * 
   * Algoritma:
   * 1. Validasi koneksi MQTT aktif
   * 2. Cek mode autonomous - hanya perintah autonomous yang diizinkan saat mode aktif
   * 3. Map tipe perintah ke topic MQTT yang sesuai
   * 4. Publish perintah ke topic dengan QoS 0
   * 
   * @param type - Jenis perintah (move, speed, flash, autonomous)
   * @param value - Nilai perintah (string atau number)
   */
  const sendCommand = useCallback((type: 'move' | 'speed' | 'flash' | 'autonomous', value: string | number) => {
    // Validasi koneksi MQTT
    if (isConnected) {
      // Algoritma kontrol mode autonomous:
      // - Jika perintah autonomous: selalu izinkan
      // - Jika mode autonomous aktif: blokir perintah manual
      // - Jika mode manual: izinkan semua perintah
      if (type === 'autonomous' || !isAutonomous) {
        // Mapping tipe perintah ke topic MQTT
        let topic: string;
        switch(type) {
          case 'move':       topic = MQTT_TOPICS.CONTROL; break;
          case 'speed':      topic = MQTT_TOPICS.SPEED; break;
          case 'flash':      topic = MQTT_TOPICS.FLASH; break;
          case 'autonomous': topic = MQTT_TOPICS.AUTONOMOUS; break;
          default: return; // Invalid command type
        }
        
        // Publish perintah ke ESP32
        publish(topic, String(value));
      }
    }
  }, [isConnected, publish, isAutonomous]);
  
  // ===============================================================
  // HANDLER FUNCTIONS UNTUK INTERAKSI UI
  // ===============================================================
  
  /**
   * Toggle mode autonomous driving
   * 
   * Algoritma:
   * 1. Flip boolean state isAutonomous
   * 2. Kirim perintah 'on'/'off' ke ESP32
   * 3. Log perubahan mode untuk debugging
   */
  const toggleAutonomousMode = () => {
    const newMode = !isAutonomous;
    setIsAutonomous(newMode);
    sendCommand('autonomous', newMode ? 'on' : 'off');
    handleLogMessage(`[WEB] Autonomous mode set to ${newMode ? 'ON' : 'OFF'}`);
  };

  /**
   * Rotasi gambar kamera 90 derajat
   * 
   * Algoritma: Increment rotasi dengan modulo 360 untuk cycling
   * (0° → 90° → 180° → 270° → 0°)
   */
  const handleRotate = () => setRotation(p => (p + 90) % 360);
  
  /**
   * Handler perubahan kecepatan
   * 
   * Algoritma konversi:
   * 1. Input: Persentase 0-100% dari UI slider
   * 2. Konversi ke range ESP32: 100-255 (100 = stop, 255 = max speed)
   * 3. Formula: 100 + (percentage/100 * 155)
   */
  const handleSpeedChange = (v: number) => { 
    setSpeedPercent(v); 
    // Konversi persentase ke nilai PWM ESP32 (100-255)
    sendCommand('speed', Math.round(100 + (v / 100) * 155)); 
  };
  
  /**
   * Handler perubahan intensitas LED
   * 
   * Algoritma konversi:
   * 1. Input: Persentase 0-100% dari UI slider
   * 2. Konversi ke range PWM: 0-255
   * 3. Formula: (percentage/100 * 255)
   */
  const handleLEDChange = (v: number) => { 
    setLedPercent(v); 
    // Konversi persentase ke nilai PWM (0-255)
    sendCommand('flash', Math.round((v / 100) * 255)); 
  };
  
  /**
   * Handler kontrol arah pergerakan
   * Direct mapping dari UI button ke MQTT command
   */
  const handleDirectionControl = (dir: string) => sendCommand('move', dir);
  
  // ===============================================================
  // ALGORITMA KEYBOARD INPUT HANDLING
  // ===============================================================
  
  /**
   * Handler untuk key press events
   * 
   * Algoritma:
   * 1. Filter key repeat events untuk mencegah spam
   * 2. Blokir input saat mode autonomous aktif
   * 3. Validasi key yang diizinkan (W, A, S, D)
   * 4. Update visual feedback (activeKeys state)
   * 5. Map key ke perintah pergerakan
   * 6. Kirim perintah ke ESP32
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Algoritma filtering:
    // - event.repeat: mencegah spam saat key ditahan
    // - isAutonomous: blokir manual control saat autonomous mode
    if (event.repeat || isAutonomous) return;
    
    const key = event.key.toLowerCase();
    
    // Validasi key yang diizinkan untuk kontrol
    if (['w', 'a', 's', 'd'].includes(key)) {
      event.preventDefault(); // Mencegah default browser behavior
      
      // Update visual feedback - tambahkan key ke active set
      setActiveKeys(prev => new Set(prev).add(key));
      
      // Algoritma mapping key ke perintah pergerakan
      let direction = 'stop'; // Default fallback
      switch (key) {
        case 'w': direction = 'forward'; break;
        case 's': direction = 'backward'; break;
        case 'a': direction = 'left'; break;
        case 'd': direction = 'right'; break;
      }
      
      // Kirim perintah pergerakan ke ESP32
      sendCommand('move', direction);
    }
  }, [sendCommand, activeKeys, isAutonomous]);

  /**
   * Handler untuk key release events
   * 
   * Algoritma:
   * 1. Blokir jika mode autonomous aktif
   * 2. Validasi key yang diizinkan
   * 3. Update visual feedback (hapus dari activeKeys)
   * 4. Kirim perintah stop ke ESP32
   */
  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (isAutonomous) return; // Blokir saat autonomous mode
    
    const key = event.key.toLowerCase();
    
    if (['w', 'a', 's', 'd'].includes(key)) {
      // Update visual feedback - hapus key dari active set
      setActiveKeys(prev => {
        const newKeys = new Set(prev);
        newKeys.delete(key);
        return newKeys;
      });
      
      // Kirim perintah stop saat key dilepas
      sendCommand('move', 'stop');
    }
  }, [sendCommand, isAutonomous]);

  /**
   * Effect untuk menambahkan/menghapus keyboard event listeners
   * 
   * Algoritma:
   * 1. Tambahkan global event listeners saat component mount
   * 2. Cleanup listeners saat component unmount
   * 3. Re-attach listeners saat handler functions berubah
   */
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Cleanup function untuk mencegah memory leaks
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
  
  // ===============================================================
  // UTILITY FUNCTIONS
  // ===============================================================
  
  /**
   * Fungsi untuk styling indikator keyboard
   * 
   * Algoritma:
   * 1. Cek apakah key sedang aktif dan tidak dalam mode autonomous
   * 2. Return class CSS yang sesuai untuk visual feedback
   * 
   * @param key - Karakter key yang akan dicek
   * @returns String class CSS untuk styling
   */
  const getKeyIndicatorClass = (key: string) => 
    `text-xs px-2 py-1 rounded transition-all duration-200 ${ 
      activeKeys.has(key) && !isAutonomous 
        ? 'bg-cyan-500 text-white'      // Active state
        : 'bg-gray-700 text-gray-400'   // Inactive state
    }`;

  // ===============================================================
  // RENDER UI COMPONENTS
  // ===============================================================
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white select-none">
      {/* Header dengan status koneksi dan user profile */}
      <header className="p-4 sm:p-6 border-b border-gray-700/50 backdrop-blur-sm bg-gray-900/80 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-1.5 sm:p-2 bg-cyan-500/20 rounded-lg">
              <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-500" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                RC Car Controller
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">ESP32-CAM Internet Control</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <MQTTStatus status={connectionStatus} isConnected={isConnected} />
            <UserProfile />
          </div>
        </div>
      </header>

      {/* Main content area dengan grid layout responsif */}
      <main className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Panel kiri: Sensor data dan logs - Hidden pada mobile, tampil di tablet+ */}
          <div className="hidden lg:block lg:col-span-1 space-y-4">
            {/* Panel sensor proximity */}
            <div className="bg-gray-800/50 p-4 sm:p-6 rounded-2xl">
              <h3 className="text-sm sm:text-base font-semibold mb-2">Sensor Jarak</h3>
              <p className="text-sm sm:text-base">Jarak: {distance !== null ? `${distance.toFixed(1)} cm` : 'Membaca...'}</p>
            </div>
            
            {/* Panel pengaturan jarak (collapsible) */}
            <DistanceSettingsPanel 
              onSettingsChange={handleDistanceSettingsChange}
              isConnected={isConnected}
            />
            
            {/* Panel logs dengan scroll dan clear functionality */}
            <LogPanel 
              logs={logs} 
              onClearLogs={handleClearLogs}
              isLoading={isLoadingLogs}
            />
          </div>

          {/* Panel tengah: Live camera feed */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden">
              <div className="p-3 sm:p-4 border-b border-gray-700/50 flex justify-between items-center">
                <h2 className="text-base sm:text-lg font-semibold flex items-center space-x-2">
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500" />
                  <span>Live Feed</span>
                </h2>
                <button 
                  onClick={handleRotate} 
                  className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg" 
                  title="Putar Gambar"
                >
                  <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              
              {/* Container untuk video stream dengan aspect ratio 4:3 */}
              <div className="aspect-[4/3] bg-black relative flex items-center justify-center overflow-hidden">
                {cameraUrl ? (
                  // Tampilkan stream jika tersedia
                  <img 
                    src={cameraUrl} 
                    alt="Stream" 
                    className="max-w-full max-h-full object-contain" 
                    style={{ 
                      transform: `rotate(${rotation}deg)`, 
                      transition: 'transform 0.4s ease' 
                    }} 
                  />
                ) : (
                  // Placeholder saat stream tidak tersedia
                  <div className="text-center">
                    <Camera className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto" />
                    <p className="text-sm sm:text-base text-gray-500">
                      {!isConnected ? 'Koneksi Terputus' : 'Menunggu Stream...'}
                    </p>
                  </div>
                )}
                
                {/* Indikator LIVE saat stream aktif */}
                {cameraUrl && isConnected && (
                  <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-red-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 sm:space-x-2">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"></div>
                    <span>LIVE</span>
                  </div>
                )}
                
                {/* Indikator mode autonomous */}
                {isAutonomous && (
                  <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-green-500/90 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex items-center space-x-1 sm:space-x-2">
                    <Shield className="w-3 h-3" />
                    <span>AUTO MODE</span>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile-only sensor info */}
            <div className="lg:hidden mt-4 bg-gray-800/50 p-4 rounded-2xl">
              <h3 className="text-sm font-semibold mb-2 flex items-center">
                <Gauge className="w-4 h-4 text-orange-500 mr-2" />
                Sensor Jarak
              </h3>
              <p className="text-sm">Jarak: {distance !== null ? `${distance.toFixed(1)} cm` : 'Membaca...'}</p>
            </div>
          </div>

          {/* Panel kanan: Controls */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            
            {/* Panel kontrol mode autonomous */}
            <div className="bg-gray-800/50 p-4 sm:p-6 rounded-2xl border border-gray-700/50">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2" />
                Autonomous Mode
              </h3>
              <button 
                onClick={toggleAutonomousMode} 
                disabled={!isConnected} 
                className={`w-full flex items-center justify-center space-x-2 px-4 py-3 sm:py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${
                  !isConnected 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : isAutonomous 
                      ? 'bg-red-600 hover:bg-red-500 text-white' 
                      : 'bg-green-600 hover:bg-green-500 text-white'
                }`}
              >
                {isAutonomous ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5" />}
                <span>{isAutonomous ? 'Stop Autonomous' : 'Start Autonomous'}</span>
              </button>
            </div>
            
            {/* Panel kontrol power dan lighting */}
            <div className="bg-gray-800/50 p-4 sm:p-6 rounded-2xl border border-gray-700/50">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center">
                <Gauge className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 mr-2" />
                Power & Lighting
              </h3>
              
              {/* Slider kontrol kecepatan */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-400">Speed</span>
                  <span className="text-orange-500 font-mono">{speedPercent}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={speedPercent} 
                  onChange={(e) => handleSpeedChange(parseInt(e.target.value))} 
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-orange" 
                  disabled={!isConnected || isAutonomous} 
                />
              </div>
              
              {/* Slider kontrol LED flash */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-400">Flash</span>
                  <span className="text-yellow-500 font-mono">{ledPercent}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={ledPercent} 
                  onChange={(e) => handleLEDChange(parseInt(e.target.value))} 
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-yellow" 
                  disabled={!isConnected} 
                />
              </div>
            </div>
            
            {/* Header kontrol arah dengan indikator keyboard */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold">Kontrol Manual</h3>
              <div className="hidden sm:flex items-center space-x-2 text-xs">
                <span className="text-gray-400">Keys:</span>
                <span className={getKeyIndicatorClass('w')}>W</span>
                <span className={getKeyIndicatorClass('a')}>A</span>
                <span className={getKeyIndicatorClass('s')}>S</span>
                <span className={getKeyIndicatorClass('d')}>D</span>
              </div>
            </div>
            
            {/* Grid kontrol arah (3x3 dengan tombol di posisi + ) - Optimized untuk mobile */}
            <div className="flex justify-center">
              <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full max-w-xs mx-auto">
                <div></div>
                {/* Tombol Forward */}
                <button 
                  onMouseDown={() => handleDirectionControl('forward')} 
                  onMouseUp={() => handleDirectionControl('stop')} 
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleDirectionControl('forward');
                  }} 
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleDirectionControl('stop');
                  }} 
                  disabled={!isConnected || isAutonomous} 
                  className="p-3 sm:p-4 bg-gray-700 hover:bg-cyan-500 active:bg-cyan-600 disabled:bg-gray-600 rounded-lg transition-colors touch-manipulation"
                >
                  <ArrowUp className="w-6 h-6 sm:w-8 sm:h-8 mx-auto" />
                </button>
                <div></div>
                
                {/* Tombol Left */}
                <button 
                  onMouseDown={() => handleDirectionControl('left')} 
                  onMouseUp={() => handleDirectionControl('stop')} 
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleDirectionControl('left');
                  }} 
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleDirectionControl('stop');
                  }} 
                  disabled={!isConnected || isAutonomous} 
                  className="p-3 sm:p-4 bg-gray-700 hover:bg-cyan-500 active:bg-cyan-600 disabled:bg-gray-600 rounded-lg transition-colors touch-manipulation"
                >
                  <ArrowLeft className="w-6 h-6 sm:w-8 sm:h-8 mx-auto" />
                </button>
                
                {/* Tombol Stop */}
                <button 
                  onClick={() => handleDirectionControl('stop')} 
                  disabled={!isConnected || isAutonomous} 
                  className="p-3 sm:p-4 bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:bg-gray-600 rounded-lg transition-colors touch-manipulation"
                >
                  <Square className="w-6 h-6 sm:w-8 sm:h-8 mx-auto" />
                </button>
                
                {/* Tombol Right */}
                <button 
                  onMouseDown={() => handleDirectionControl('right')} 
                  onMouseUp={() => handleDirectionControl('stop')} 
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleDirectionControl('right');
                  }} 
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleDirectionControl('stop');
                  }} 
                  disabled={!isConnected || isAutonomous} 
                  className="p-3 sm:p-4 bg-gray-700 hover:bg-cyan-500 active:bg-cyan-600 disabled:bg-gray-600 rounded-lg transition-colors touch-manipulation"
                >
                  <ArrowRight className="w-6 h-6 sm:w-8 sm:h-8 mx-auto" />
                </button>
                
                <div></div>
                {/* Tombol Backward */}
                <button 
                  onMouseDown={() => handleDirectionControl('backward')} 
                  onMouseUp={() => handleDirectionControl('stop')} 
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleDirectionControl('backward');
                  }} 
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleDirectionControl('stop');
                  }} 
                  disabled={!isConnected || isAutonomous} 
                  className="p-3 sm:p-4 bg-gray-700 hover:bg-cyan-500 active:bg-cyan-600 disabled:bg-gray-600 rounded-lg transition-colors touch-manipulation"
                >
                  <ArrowDown className="w-6 h-6 sm:w-8 sm:h-8 mx-auto" />
                </button>
                <div></div>
              </div>
            </div>

            {/* Mobile keyboard indicator */}
            <div className="sm:hidden flex items-center justify-center space-x-2 text-xs mt-4">
              <span className="text-gray-400">Keyboard:</span>
              <span className={getKeyIndicatorClass('w')}>W</span>
              <span className={getKeyIndicatorClass('a')}>A</span>
              <span className={getKeyIndicatorClass('s')}>S</span>
              <span className={getKeyIndicatorClass('d')}>D</span>
            </div>
          </div>
        </div>

        {/* Mobile-only logs section */}
        <div className="lg:hidden">
          <LogPanel 
            logs={logs} 
            onClearLogs={handleClearLogs}
            isLoading={isLoadingLogs}
          />
        </div>
      </main>
    </div>
  );
};

// ===================================================================
// KOMPONEN UTAMA APP (Dengan Authentication Wrapper)
// ===================================================================

/**
 * Komponen wrapper untuk menangani authentication state
 * 
 * Algoritma:
 * 1. Cek loading state dari auth context
 * 2. Jika loading: tampilkan loading spinner
 * 3. Jika tidak ada user: tampilkan login form
 * 4. Jika user authenticated: tampilkan RC car controller
 */
const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  // Tampilkan loading spinner saat proses autentikasi
  if (loading) {
    return <LoadingSpinner />;
  }

  // Tampilkan login form jika user belum authenticated
  if (!user) {
    return <LoginForm />;
  }

  // Tampilkan main application jika user sudah authenticated
  return (
    <Routes>
      <Route path="/" element={<RCCarController />} />
    </Routes>
  );
};

/**
 * Root component dengan AuthProvider wrapper dan Router
 * 
 * Struktur:
 * Router -> AuthProvider -> AppContent -> (LoadingSpinner | LoginForm | Routes)
 */
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;