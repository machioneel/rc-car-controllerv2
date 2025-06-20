import { useState, useEffect, useCallback } from 'react';
import { Camera, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Square, Gauge, RotateCw, Bot, Play, Pause, Shield } from 'lucide-react';

// Components and hooks
import { useMQTT } from './hooks/useMQTT'; 
import { MQTTStatus } from './components/MQTTStatus';
import { LogPanel } from './components/LogPanel';
import { LoginForm } from './components/LoginForm';
import { LoadingSpinner } from './components/LoadingSpinner';
import { UserProfile } from './components/UserProfile';
import { AuthProvider, useAuth } from './contexts/AuthContext';


// --- KONFIGURASI UTAMA (di luar komponen) ---
function getStableClientId() {
  const STORAGE_KEY = 'rc_car_mqtt_client_id';
  let clientId = localStorage.getItem(STORAGE_KEY);
  if (!clientId) {
    clientId = `rccar_web_controller_${Math.random().toString(16).substr(2, 8)}`;
    localStorage.setItem(STORAGE_KEY, clientId);
  }
  return clientId;
}

const mqttConfig = {
  brokerUrl: 'wss://098567b786d74be2863e6859abdf1f0e.s1.eu.hivemq.cloud:8884/mqtt',
  options: {
    clientId: getStableClientId(),
    username: 'web-user', // GANTI DENGAN USERNAME ANDA
    password: 'Jangan999', // GANTI DENGAN PASSWORD ANDA
    clean: true,
    connectTimeout: 4000,
  }
};

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

// --- KOMPONEN CONTROLLER (Logika RC Car) ---
const RCCarController: React.FC = () => {
  // State untuk kontrol RC car
  const [speedPercent, setSpeedPercent] = useState<number>(50);
  const [ledPercent, setLedPercent] = useState<number>(0);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [cameraUrl, setCameraUrl] = useState<string>('');
  const [rotation, setRotation] = useState<number>(90);
  const [isAutonomous, setIsAutonomous] = useState<boolean>(false);
  const [logs, setLogs] = useState<Array<{id: string, timestamp: Date, level: string, message: string}>>([]);
  const [distance, setDistance] = useState<number | null>(null);

  // Hook MQTT
  const { isConnected, connectionStatus, publish, subscribe, lastMessage } = useMQTT(mqttConfig);

  const handleLogMessage = useCallback((logData: string) => {
    let level = 'INFO';
    if (logData.toUpperCase().includes("ERROR")) level = 'ERROR';
    if (logData.toUpperCase().includes("WARNING")) level = 'WARNING';
    
    const newLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      level: level,
      message: logData
    };
    setLogs(prevLogs => [newLog, ...prevLogs.slice(0, 99)]);
  }, []);

  // Efek untuk menangani pesan MQTT yang masuk
  useEffect(() => {
    if (lastMessage) {
      const { topic, message } = lastMessage;
      if (topic === MQTT_TOPICS.CAMERA) {
        const blob = new Blob([message as Buffer]);
        const newUrl = URL.createObjectURL(blob);
        setCameraUrl(prevUrl => {
          if (prevUrl) URL.revokeObjectURL(prevUrl);
          return newUrl;
        });
      } else if (topic === MQTT_TOPICS.LOG) {
        handleLogMessage(message.toString());
      } else if (topic === MQTT_TOPICS.STATUS) {
        console.log('Status dari Mobil:', message.toString());
      } else if (topic === MQTT_TOPICS.SENSOR_DISTANCE) {
        setDistance(parseFloat(message.toString()));
      }
    }
  }, [lastMessage, handleLogMessage]);

  // Efek untuk subscribe ke topic saat koneksi berhasil
  useEffect(() => {
    if (isConnected) {
      subscribe(MQTT_TOPICS.CAMERA);
      subscribe(MQTT_TOPICS.STATUS);
      subscribe(MQTT_TOPICS.LOG);
      subscribe(MQTT_TOPICS.SENSOR_DISTANCE);
    }
  }, [isConnected, subscribe]);

  // Fungsi terpusat untuk mengirim perintah ke ESP32
  const sendCommand = useCallback((type: 'move' | 'speed' | 'flash' | 'autonomous', value: string | number) => {
    if (isConnected) {
      if (type === 'autonomous' || !isAutonomous) {
        let topic: string;
        switch(type) {
          case 'move':       topic = MQTT_TOPICS.CONTROL; break;
          case 'speed':      topic = MQTT_TOPICS.SPEED; break;
          case 'flash':      topic = MQTT_TOPICS.FLASH; break;
          case 'autonomous': topic = MQTT_TOPICS.AUTONOMOUS; break;
          default: return;
        }
        publish(topic, String(value));
      }
    }
  }, [isConnected, publish, isAutonomous]);
  
  // Handlers untuk interaksi UI
  const toggleAutonomousMode = () => {
    const newMode = !isAutonomous;
    setIsAutonomous(newMode);
    sendCommand('autonomous', newMode ? 'on' : 'off');
    handleLogMessage(`[WEB] Autonomous mode set to ${newMode ? 'ON' : 'OFF'}`);
  };

  const handleRotate = () => setRotation(p => (p + 90) % 360);
  const handleSpeedChange = (v: number) => { setSpeedPercent(v); sendCommand('speed', Math.round(100 + (v / 100) * 155)); };
  const handleLEDChange = (v: number) => { setLedPercent(v); sendCommand('flash', Math.round((v / 100) * 255)); };
  const handleDirectionControl = (dir: string) => sendCommand('move', dir);
  
  // Handlers untuk Keyboard
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.repeat || isAutonomous) return;
    const key = event.key.toLowerCase();
    if (['w', 'a', 's', 'd'].includes(key)) {
      event.preventDefault();
      setActiveKeys(prev => new Set(prev).add(key));
      let direction = 'stop';
      switch (key) {
        case 'w': direction = 'forward'; break;
        case 's': direction = 'backward'; break;
        case 'a': direction = 'left'; break;
        case 'd': direction = 'right'; break;
      }
      sendCommand('move', direction);
    }
  }, [sendCommand, activeKeys, isAutonomous]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (isAutonomous) return;
    const key = event.key.toLowerCase();
    if (['w', 'a', 's', 'd'].includes(key)) {
      setActiveKeys(prev => {
        const newKeys = new Set(prev);
        newKeys.delete(key);
        return newKeys;
      });
      sendCommand('move', 'stop');
    }
  }, [sendCommand, isAutonomous]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
  
  const getKeyIndicatorClass = (key: string) => `text-xs px-2 py-1 rounded transition-all duration-200 ${ activeKeys.has(key) && !isAutonomous ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-400' }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white select-none">
      <header className="p-6 border-b border-gray-700/50 backdrop-blur-sm bg-gray-900/80 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg"><Camera className="w-8 h-8 text-cyan-500" /></div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">RC Car Controller</h1>
              <p className="text-sm text-gray-400">ESP32-CAM Internet Control</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <MQTTStatus status={connectionStatus} isConnected={isConnected} />
            <UserProfile />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
           <div className="xl:col-span-1 space-y-4">
              <div className="bg-gray-800/50 p-6 rounded-2xl">
                <h3>Proximity Sensor</h3>
                <p>Jarak: {distance !== null ? `${distance.toFixed(1)} cm` : 'Membaca...'}</p>
              </div>
              <LogPanel logs={logs} />
            </div>

          <div className="xl:col-span-2">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden">
              <div className="p-4 border-b border-gray-700/50 flex justify-between items-center">
                <h2 className="text-lg font-semibold flex items-center space-x-2"><Camera className="w-5 h-5 text-cyan-500" /><span>Live Feed</span></h2>
                <button onClick={handleRotate} className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg" title="Putar Gambar"><RotateCw className="w-5 h-5" /></button>
              </div>
              <div className="aspect-[4/3] bg-black relative flex items-center justify-center overflow-hidden">
                {cameraUrl ? <img src={cameraUrl} alt="Stream" className="max-w-full max-h-full object-contain" style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.4s ease' }} /> : <div className="text-center"><Camera className="w-16 h-16 text-gray-600 mx-auto" /><p className="text-gray-500">{!isConnected ? 'Koneksi Terputus' : 'Menunggu Stream...'}</p></div>}
                {cameraUrl && isConnected && <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-2"><div className="w-2 h-2 bg-white rounded-full animate-pulse"></div><span>LIVE</span></div>}
                {isAutonomous && <div className="absolute top-4 right-4 bg-green-500/90 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2"><Shield className="w-3 h-3" /><span>AUTO MODE</span></div>}
              </div>
            </div>
          </div>

          <div className="xl:col-span-1 space-y-6">
            <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50">
              <h3 className="text-lg font-semibold mb-4 flex items-center"><Bot className="w-5 h-5 text-green-500 mr-2" />Autonomous Mode</h3>
              <button onClick={toggleAutonomousMode} disabled={!isConnected} className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${!isConnected ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : isAutonomous ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'}`}>
                {isAutonomous ? <Pause /> : <Play />}<span>{isAutonomous ? 'Stop Autonomous' : 'Start Autonomous'}</span>
              </button>
            </div>
            <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50">
              <h3 className="text-lg font-semibold flex items-center"><Gauge className="w-5 h-5 text-orange-500 mr-2" />Power & Lighting</h3>
              <div>
                <div className="flex items-center justify-between text-sm"><span className="text-gray-400">Speed</span><span className="text-orange-500 font-mono">{speedPercent}%</span></div>
                <input type="range" min="0" max="100" value={speedPercent} onChange={(e) => handleSpeedChange(parseInt(e.target.value))} className="w-full" disabled={!isConnected || isAutonomous} />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm"><span className="text-gray-400">Flash</span><span className="text-yellow-500 font-mono">{ledPercent}%</span></div>
                <input type="range" min="0" max="100" value={ledPercent} onChange={(e) => handleLEDChange(parseInt(e.target.value))} className="w-full" disabled={!isConnected} />
              </div>
            </div>
            <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-semibold">Direction Controls</h3><div className="flex items-center space-x-2 text-xs"><span className="text-gray-400">Keys:</span><span className={getKeyIndicatorClass('w')}>W</span><span className={getKeyIndicatorClass('a')}>A</span><span className={getKeyIndicatorClass('s')}>S</span><span className={getKeyIndicatorClass('d')}>D</span></div></div>
            <div className="flex justify-center">
              <div className="grid grid-cols-3 gap-4 w-64">
                <div></div>
                <button onMouseDown={() => handleDirectionControl('forward')} onMouseUp={() => handleDirectionControl('stop')} onTouchStart={() => handleDirectionControl('forward')} onTouchEnd={() => handleDirectionControl('stop')} disabled={!isConnected || isAutonomous} className="p-4 bg-gray-700 rounded-lg active:bg-cyan-500 disabled:bg-gray-600"><ArrowUp /></button>
                <div></div>
                <button onMouseDown={() => handleDirectionControl('left')} onMouseUp={() => handleDirectionControl('stop')} onTouchStart={() => handleDirectionControl('left')} onTouchEnd={() => handleDirectionControl('stop')} disabled={!isConnected || isAutonomous} className="p-4 bg-gray-700 rounded-lg active:bg-cyan-500 disabled:bg-gray-600"><ArrowLeft /></button>
                <button onClick={() => handleDirectionControl('stop')} disabled={!isConnected || isAutonomous} className="p-4 bg-red-600 rounded-lg active:bg-red-500 disabled:bg-gray-600"><Square /></button>
                <button onMouseDown={() => handleDirectionControl('right')} onMouseUp={() => handleDirectionControl('stop')} onTouchStart={() => handleDirectionControl('right')} onTouchEnd={() => handleDirectionControl('stop')} disabled={!isConnected || isAutonomous} className="p-4 bg-gray-700 rounded-lg active:bg-cyan-500 disabled:bg-gray-600"><ArrowRight /></button>
                <div></div>
                <button onMouseDown={() => handleDirectionControl('backward')} onMouseUp={() => handleDirectionControl('stop')} onTouchStart={() => handleDirectionControl('backward')} onTouchEnd={() => handleDirectionControl('stop')} disabled={!isConnected || isAutonomous} className="p-4 bg-gray-700 rounded-lg active:bg-cyan-500 disabled:bg-gray-600"><ArrowDown /></button>
                <div></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// --- KOMPONEN UTAMA APP (Dengan Auth Wrapper) ---
const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <LoginForm />;
  }

  return <RCCarController />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;