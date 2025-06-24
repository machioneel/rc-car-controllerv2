import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Camera, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Square, Gauge, RotateCw, Bot, Play, Pause, Shield, GitBranch } from 'lucide-react';

// Import komponen dan hooks yang diperlukan
import { useMQTT } from './hooks/useMQTT'; 
import { MQTTStatus } from './components/MQTTStatus';
import { LogPanel } from './components/LogPanel';
import { LoginForm } from './components/LoginForm';
import { LoadingSpinner } from './components/LoadingSpinner';
import { UserProfile } from './components/UserProfile';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import FlowchartPage from './pages/FlowchartPage';

// ===================================================================
// KONFIGURASI UTAMA APLIKASI
// ===================================================================

/**
 * Fungsi untuk menghasilkan Client ID yang stabil untuk koneksi MQTT
 * 
 * Algoritma:
 * 1. Cek apakah sudah ada client ID tersimpan di localStorage
 * 2. Jika belum ada, generate ID baru dengan format: rccar_web_controller_[random8char]
 * 3. Simpan ID ke localStorage untuk konsistensi koneksi
 * 4. Return client ID yang stabil
 * 
 * Tujuan: Mencegah multiple connection dari browser yang sama
 */
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

/**
 * Definisi MQTT Topics untuk komunikasi dengan ESP32
 * 
 * Struktur komunikasi:
 * - CONTROL: Perintah pergerakan mobil (forward, backward, left, right, stop)
 * - SPEED: Kontrol kecepatan motor (0-255)
 * - FLASH: Kontrol intensitas LED flash (0-255)
 * - STATUS: Menerima status dari ESP32
 * - CAMERA: Menerima stream gambar dari ESP32-CAM
 * - LOG: Menerima log messages dari ESP32
 * - AUTONOMOUS: Mengaktifkan/menonaktifkan mode autonomous
 * - SENSOR_DISTANCE: Menerima data sensor jarak proximity
 */
const MQTT_TOPICS = {
  CONTROL:    'esp32/car/control/move',
  SPEED:      'esp32/car/control/speed',
  FLASH:      'esp32/car/control/flash',
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
  
  /**
   * State untuk kontrol RC car
   * 
   * speedPercent: Persentase kecepatan (0-100%) untuk UI display
   * ledPercent: Persentase intensitas LED (0-100%) untuk UI display
   * activeKeys: Set untuk tracking tombol keyboard yang sedang ditekan
   * cameraUrl: Object URL untuk menampilkan stream kamera
   * rotation: Derajat rotasi gambar kamera (0, 90, 180, 270)
   * isAutonomous: Flag untuk mode autonomous driving
   * logs: Array untuk menyimpan log messages dengan metadata
   * distance: Nilai sensor jarak dalam centimeter
   */
  const [speedPercent, setSpeedPercent] = useState<number>(50);
  const [ledPercent, setLedPercent] = useState<number>(0);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [cameraUrl, setCameraUrl] = useState<string>('');
  const [rotation, setRotation] = useState<number>(90);
  const [isAutonomous, setIsAutonomous] = useState<boolean>(false);
  const [logs, setLogs] = useState<Array<{id: string, timestamp: Date, level: string, message: string}>>([]);
  const [distance, setDistance] = useState<number | null>(null);

  // Hook MQTT untuk komunikasi dengan ESP32
  const { isConnected, connectionStatus, publish, subscribe, lastMessage } = useMQTT(mqttConfig);

  // ===============================================================
  // ALGORITMA PEMROSESAN LOG MESSAGES
  // ===============================================================
  
  /**
   * Handler untuk memproses log messages dari ESP32
   * 
   * Algoritma:
   * 1. Analisis level log berdasarkan keyword dalam message
   * 2. Buat object log dengan metadata (id, timestamp, level, message)
   * 3. Tambahkan ke array logs dengan batasan maksimal 100 entries
   * 4. Gunakan useCallback untuk optimasi performa
   * 
   * @param logData - String log message dari ESP32
   */
  const handleLogMessage = useCallback((logData: string) => {
    // Algoritma deteksi level log berdasarkan keyword
    let level = 'INFO'; // Default level
    if (logData.toUpperCase().includes("ERROR")) level = 'ERROR';
    if (logData.toUpperCase().includes("WARNING")) level = 'WARNING';
    
    // Buat log entry dengan metadata lengkap
    const newLog = {
      id: Math.random().toString(36).substr(2, 9), // Generate unique ID
      timestamp: new Date(), // Timestamp saat log diterima
      level: level, // Level log yang terdeteksi
      message: logData // Pesan log asli
    };
    
    // Update state logs dengan batasan maksimal 100 entries
    // Menggunakan slice(0, 99) untuk mempertahankan 99 log lama + 1 log baru
    setLogs(prevLogs => [newLog, ...prevLogs.slice(0, 99)]);
  }, []);

  // ===============================================================
  // ALGORITMA PEMROSESAN MQTT MESSAGES
  // ===============================================================
  
  /**
   * Effect untuk menangani pesan MQTT yang masuk
   * 
   * Algoritma pemrosesan berdasarkan topic:
   * 1. CAMERA: Convert binary data ke Object URL untuk display
   * 2. LOG: Parse dan tambahkan ke log panel
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
        // Algoritma konversi binary data ke displayable image:
        // 1. Buat Blob dari Buffer data
        // 2. Generate Object URL dari Blob
        // 3. Revoke URL lama untuk memory management
        // 4. Set URL baru untuk display
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
      <header className="p-6 border-b border-gray-700/50 backdrop-blur-sm bg-gray-900/80 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Camera className="w-8 h-8 text-cyan-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                RC Car Controller
              </h1>
              <p className="text-sm text-gray-400">ESP32-CAM Internet Control</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              to="/flowchart" 
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <GitBranch className="w-4 h-4" />
              <span className="text-sm">Flowchart</span>
            </Link>
            <MQTTStatus status={connectionStatus} isConnected={isConnected} />
            <UserProfile />
          </div>
        </div>
      </header>

      {/* Main content area dengan grid layout responsif */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* Panel kiri: Sensor data dan logs */}
          <div className="xl:col-span-1 space-y-4">
            {/* Panel sensor proximity */}
            <div className="bg-gray-800/50 p-6 rounded-2xl">
              <h3>Proximity Sensor</h3>
              <p>Jarak: {distance !== null ? `${distance.toFixed(1)} cm` : 'Membaca...'}</p>
            </div>
            {/* Panel logs dengan scroll */}
            <LogPanel logs={logs} />
          </div>

          {/* Panel tengah: Live camera feed */}
          <div className="xl:col-span-2">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden">
              <div className="p-4 border-b border-gray-700/50 flex justify-between items-center">
                <h2 className="text-lg font-semibold flex items-center space-x-2">
                  <Camera className="w-5 h-5 text-cyan-500" />
                  <span>Live Feed</span>
                </h2>
                <button 
                  onClick={handleRotate} 
                  className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg" 
                  title="Putar Gambar"
                >
                  <RotateCw className="w-5 h-5" />
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
                    <Camera className="w-16 h-16 text-gray-600 mx-auto" />
                    <p className="text-gray-500">
                      {!isConnected ? 'Koneksi Terputus' : 'Menunggu Stream...'}
                    </p>
                  </div>
                )}
                
                {/* Indikator LIVE saat stream aktif */}
                {cameraUrl && isConnected && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span>LIVE</span>
                  </div>
                )}
                
                {/* Indikator mode autonomous */}
                {isAutonomous && (
                  <div className="absolute top-4 right-4 bg-green-500/90 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2">
                    <Shield className="w-3 h-3" />
                    <span>AUTO MODE</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Panel kanan: Controls */}
          <div className="xl:col-span-1 space-y-6">
            
            {/* Panel kontrol mode autonomous */}
            <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Bot className="w-5 h-5 text-green-500 mr-2" />
                Autonomous Mode
              </h3>
              <button 
                onClick={toggleAutonomousMode} 
                disabled={!isConnected} 
                className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  !isConnected 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : isAutonomous 
                      ? 'bg-red-600 hover:bg-red-500 text-white' 
                      : 'bg-green-600 hover:bg-green-500 text-white'
                }`}
              >
                {isAutonomous ? <Pause /> : <Play />}
                <span>{isAutonomous ? 'Stop Autonomous' : 'Start Autonomous'}</span>
              </button>
            </div>
            
            {/* Panel kontrol power dan lighting */}
            <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50">
              <h3 className="text-lg font-semibold flex items-center">
                <Gauge className="w-5 h-5 text-orange-500 mr-2" />
                Power & Lighting
              </h3>
              
              {/* Slider kontrol kecepatan */}
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Speed</span>
                  <span className="text-orange-500 font-mono">{speedPercent}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={speedPercent} 
                  onChange={(e) => handleSpeedChange(parseInt(e.target.value))} 
                  className="w-full" 
                  disabled={!isConnected || isAutonomous} 
                />
              </div>
              
              {/* Slider kontrol LED flash */}
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Flash</span>
                  <span className="text-yellow-500 font-mono">{ledPercent}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={ledPercent} 
                  onChange={(e) => handleLEDChange(parseInt(e.target.value))} 
                  className="w-full" 
                  disabled={!isConnected} 
                />
              </div>
            </div>
            
            {/* Header kontrol arah dengan indikator keyboard */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Direction Controls</h3>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-gray-400">Keys:</span>
                <span className={getKeyIndicatorClass('w')}>W</span>
                <span className={getKeyIndicatorClass('a')}>A</span>
                <span className={getKeyIndicatorClass('s')}>S</span>
                <span className={getKeyIndicatorClass('d')}>D</span>
              </div>
            </div>
            
            {/* Grid kontrol arah (3x3 dengan tombol di posisi + ) */}
            <div className="flex justify-center">
              <div className="grid grid-cols-3 gap-4 w-64">
                <div></div>
                {/* Tombol Forward */}
                <button 
                  onMouseDown={() => handleDirectionControl('forward')} 
                  onMouseUp={() => handleDirectionControl('stop')} 
                  onTouchStart={() => handleDirectionControl('forward')} 
                  onTouchEnd={() => handleDirectionControl('stop')} 
                  disabled={!isConnected || isAutonomous} 
                  className="p-4 bg-gray-700 rounded-lg active:bg-cyan-500 disabled:bg-gray-600"
                >
                  <ArrowUp />
                </button>
                <div></div>
                
                {/* Tombol Left */}
                <button 
                  onMouseDown={() => handleDirectionControl('left')} 
                  onMouseUp={() => handleDirectionControl('stop')} 
                  onTouchStart={() => handleDirectionControl('left')} 
                  onTouchEnd={() => handleDirectionControl('stop')} 
                  disabled={!isConnected || isAutonomous} 
                  className="p-4 bg-gray-700 rounded-lg active:bg-cyan-500 disabled:bg-gray-600"
                >
                  <ArrowLeft />
                </button>
                
                {/* Tombol Stop */}
                <button 
                  onClick={() => handleDirectionControl('stop')} 
                  disabled={!isConnected || isAutonomous} 
                  className="p-4 bg-red-600 rounded-lg active:bg-red-500 disabled:bg-gray-600"
                >
                  <Square />
                </button>
                
                {/* Tombol Right */}
                <button 
                  onMouseDown={() => handleDirectionControl('right')} 
                  onMouseUp={() => handleDirectionControl('stop')} 
                  onTouchStart={() => handleDirectionControl('right')} 
                  onTouchEnd={() => handleDirectionControl('stop')} 
                  disabled={!isConnected || isAutonomous} 
                  className="p-4 bg-gray-700 rounded-lg active:bg-cyan-500 disabled:bg-gray-600"
                >
                  <ArrowRight />
                </button>
                
                <div></div>
                {/* Tombol Backward */}
                <button 
                  onMouseDown={() => handleDirectionControl('backward')} 
                  onMouseUp={() => handleDirectionControl('stop')} 
                  onTouchStart={() => handleDirectionControl('backward')} 
                  onTouchEnd={() => handleDirectionControl('stop')} 
                  disabled={!isConnected || isAutonomous} 
                  className="p-4 bg-gray-700 rounded-lg active:bg-cyan-500 disabled:bg-gray-600"
                >
                  <ArrowDown />
                </button>
                <div></div>
              </div>
            </div>
          </div>
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
      <Route path="/flowchart" element={<FlowchartPage />} />
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