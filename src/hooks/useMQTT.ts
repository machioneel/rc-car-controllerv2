import { useEffect, useRef, useState, useCallback } from 'react';
import mqtt, { MqttClient, IClientOptions } from 'mqtt';

// ===================================================================
// TYPE DEFINITIONS
// ===================================================================

/**
 * Definisi tipe data untuk status koneksi MQTT
 * Memastikan konsistensi status di seluruh aplikasi
 */
export type MqttConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Interface untuk konfigurasi MQTT connection
 */
interface MQTTConfig {
  brokerUrl: string;      // WebSocket URL broker MQTT
  options: IClientOptions; // Opsi koneksi (credentials, timeout, dll)
}

/**
 * Interface untuk return value dari useMQTT hook
 */
interface MQTTHookReturn {
  isConnected: boolean;                                    // Status koneksi boolean
  connectionStatus: MqttConnectionStatus;                  // Status koneksi detail
  publish: (topic: string, message: string | Buffer) => void; // Fungsi publish message
  subscribe: (topic: string) => void;                      // Fungsi subscribe topic
  lastMessage: { topic: string; message: Buffer } | null;  // Message terakhir yang diterima
}

// ===================================================================
// CUSTOM HOOK: useMQTT
// ===================================================================

/**
 * Custom React Hook untuk mengelola koneksi MQTT
 * 
 * Algoritma utama:
 * 1. Inisialisasi koneksi MQTT dengan konfigurasi yang diberikan
 * 2. Mengelola state koneksi dan status
 * 3. Menyediakan fungsi publish dan subscribe
 * 4. Menangani reconnection otomatis
 * 5. Cleanup koneksi saat component unmount
 * 
 * @param config - Konfigurasi MQTT (broker URL dan options)
 * @returns Object dengan status koneksi dan fungsi-fungsi MQTT
 */
export const useMQTT = (config: MQTTConfig): MQTTHookReturn => {
  
  // ===============================================================
  // STATE MANAGEMENT
  // ===============================================================
  
  /**
   * useRef untuk menyimpan instance MQTT client
   * Menggunakan ref agar tidak trigger re-render saat client berubah
   */
  const clientRef = useRef<MqttClient | null>(null);
  
  /**
   * State untuk tracking status koneksi
   */
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<MqttConnectionStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<{ topic: string; message: Buffer } | null>(null);

  // ===============================================================
  // MQTT FUNCTIONS
  // ===============================================================
  
  /**
   * Fungsi untuk publish message ke MQTT topic
   * 
   * Algoritma:
   * 1. Validasi client exists dan connected
   * 2. Publish message dengan QoS 0 (fire and forget)
   * 3. Menggunakan useCallback untuk optimasi performa
   * 
   * @param topic - MQTT topic tujuan
   * @param message - Pesan yang akan dikirim (string atau Buffer)
   */
  const publish = useCallback((topic: string, message: string | Buffer) => {
    if (clientRef.current && clientRef.current.connected) {
      // QoS 0: At most once delivery (fastest, no guarantee)
      clientRef.current.publish(topic, message, { qos: 0 });
    }
  }, []);

  /**
   * Fungsi untuk subscribe ke MQTT topic
   * 
   * Algoritma:
   * 1. Validasi client exists dan connected
   * 2. Subscribe dengan QoS 0
   * 3. Menggunakan useCallback untuk optimasi performa
   * 
   * @param topic - MQTT topic yang akan di-subscribe
   */
  const subscribe = useCallback((topic: string) => {
    if (clientRef.current && clientRef.current.connected) {
      // QoS 0: At most once delivery
      clientRef.current.subscribe(topic, { qos: 0 });
    }
  }, []);
  
  // ===============================================================
  // MQTT CONNECTION MANAGEMENT
  // ===============================================================
  
  /**
   * Effect untuk mengelola lifecycle koneksi MQTT
   * 
   * Algoritma:
   * 1. Cek apakah sudah ada koneksi aktif (prevent duplicate)
   * 2. Buat koneksi baru dengan konfigurasi yang diberikan
   * 3. Setup event listeners untuk semua MQTT events
   * 4. Cleanup koneksi saat component unmount
   * 
   * Dependency array kosong memastikan effect hanya berjalan sekali
   */
  useEffect(() => {
    // Algoritma pencegahan duplicate connection:
    // Hanya buat koneksi baru jika belum ada client aktif
    if (!clientRef.current) {
      // Set status ke connecting saat mulai koneksi
      setConnectionStatus('connecting');
      
      // Inisialisasi MQTT client dengan konfigurasi
      const client = mqtt.connect(config.brokerUrl, config.options);
      clientRef.current = client;

      // =========================================================
      // EVENT LISTENERS SETUP
      // =========================================================
      
      /**
       * Event: Koneksi berhasil established
       * 
       * Algoritma:
       * 1. Update state koneksi ke true
       * 2. Update status ke 'connected'
       * 3. Client siap untuk publish/subscribe
       */
      client.on('connect', () => {
        setIsConnected(true);
        setConnectionStatus('connected');
      });

      /**
       * Event: Error dalam koneksi atau komunikasi
       * 
       * Algoritma:
       * 1. Log error untuk debugging
       * 2. Update state dan status
       * 3. Force close koneksi untuk trigger reconnect
       */
      client.on('error', (error) => {
        console.error('MQTT Connection Error:', error);
        setIsConnected(false);
        setConnectionStatus('error');
        // Force close untuk memicu reconnection logic
        client.end(true);
      });
      
      /**
       * Event: Client mencoba reconnect
       * 
       * Algoritma:
       * Update status ke 'connecting' untuk UI feedback
       */
      client.on('reconnect', () => {
        setConnectionStatus('connecting');
      });

      /**
       * Event: Koneksi ditutup (normal atau error)
       * 
       * Algoritma:
       * 1. Update state koneksi ke false
       * 2. Update status ke 'disconnected'
       * 3. MQTT client akan otomatis mencoba reconnect
       */
      client.on('close', () => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
      });

      /**
       * Event: Message diterima dari subscribed topic
       * 
       * Algoritma:
       * 1. Terima topic dan payload dari MQTT broker
       * 2. Update lastMessage state untuk trigger re-render
       * 3. Component lain akan memproses message ini
       * 
       * @param topic - Topic asal message
       * @param payload - Data message dalam bentuk Buffer
       */
      client.on('message', (topic, payload) => {
        setLastMessage({ topic, message: payload });
      });
    }

    // =========================================================
    // CLEANUP FUNCTION
    // =========================================================
    
    /**
     * Cleanup function untuk mencegah memory leaks
     * 
     * Algoritma:
     * 1. Tutup koneksi MQTT jika masih aktif
     * 2. Reset client reference ke null
     * 3. Dipanggil saat component unmount atau effect cleanup
     */
    return () => {
      if (clientRef.current) {
        clientRef.current.end(); // Graceful disconnect
        clientRef.current = null;
      }
    };
  }, []); // Empty dependency array = run once on mount

  // ===============================================================
  // RETURN HOOK VALUES
  // ===============================================================
  
  /**
   * Return object dengan semua state dan functions yang diperlukan
   * oleh component yang menggunakan hook ini
   */
  return {
    isConnected,      // Boolean status koneksi
    connectionStatus, // Detail status koneksi
    publish,          // Fungsi untuk mengirim message
    subscribe,        // Fungsi untuk subscribe topic
    lastMessage       // Message terakhir yang diterima
  };
};