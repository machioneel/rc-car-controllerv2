import { useEffect, useRef, useState, useCallback } from 'react';
import mqtt, { MqttClient, IClientOptions } from 'mqtt';

// Definisikan tipe data untuk status koneksi agar konsisten
export type MqttConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface MQTTConfig {
  brokerUrl: string;
  options: IClientOptions;
}

interface MQTTHookReturn {
  isConnected: boolean;
  connectionStatus: MqttConnectionStatus;
  publish: (topic: string, message: string | Buffer) => void;
  subscribe: (topic: string) => void;
  lastMessage: { topic: string; message: Buffer } | null;
}

export const useMQTT = (config: MQTTConfig): MQTTHookReturn => {
  const clientRef = useRef<MqttClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<MqttConnectionStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<{ topic: string; message: Buffer } | null>(null);

  const publish = useCallback((topic: string, message: string | Buffer) => {
    if (clientRef.current && clientRef.current.connected) {
      clientRef.current.publish(topic, message, { qos: 0 });
    }
  }, []);

  const subscribe = useCallback((topic: string) => {
    if (clientRef.current && clientRef.current.connected) {
      clientRef.current.subscribe(topic, { qos: 0 });
    }
  }, []);
  
  // Gunakan useEffect untuk menangani koneksi, hanya berjalan sekali
  useEffect(() => {
    // Pastikan tidak ada koneksi aktif sebelum membuat yang baru
    if (!clientRef.current) {
      setConnectionStatus('connecting');
      
      const client = mqtt.connect(config.brokerUrl, config.options);
      clientRef.current = client;

      client.on('connect', () => {
        setIsConnected(true);
        setConnectionStatus('connected');
      });

      // [DIPERBAIKI] Gunakan nilai 'error' yang valid
      client.on('error', (error) => {
        console.error('MQTT Connection Error:', error);
        setIsConnected(false);
        setConnectionStatus('error');
        client.end(true); // Tutup koneksi secara paksa saat error
      });
      
      // [DIPERBAIKI] Gunakan nilai 'connecting' yang valid
      client.on('reconnect', () => {
        setConnectionStatus('connecting');
      });

      client.on('close', () => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
      });

      client.on('message', (topic, payload) => {
        setLastMessage({ topic, message: payload });
      });
    }

    // Fungsi cleanup
    return () => {
      if (clientRef.current) {
        clientRef.current.end();
        clientRef.current = null;
      }
    };
  }, []); // Dependensi kosong agar hanya berjalan sekali

  return {
    isConnected,
    connectionStatus,
    publish,
    subscribe,
    lastMessage
  };
};