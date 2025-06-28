import { createClient } from '@supabase/supabase-js';

// ===================================================================
// SUPABASE CONFIGURATION
// ===================================================================

/**
 * Konfigurasi Supabase Client
 * 
 * Algoritma:
 * 1. Ambil environment variables untuk URL dan anon key
 * 2. Validasi keberadaan environment variables
 * 3. Throw error jika konfigurasi tidak lengkap
 * 4. Create dan export Supabase client instance
 */

// Ambil environment variables dari Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Validasi environment variables
 * 
 * Algoritma validasi:
 * 1. Cek apakah kedua environment variables tersedia
 * 2. Throw descriptive error jika ada yang missing
 * 3. Membantu debugging saat deployment
 */
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Create Supabase client instance
 * 
 * Client ini akan digunakan untuk:
 * 1. Authentication (login, logout, session management)
 * 2. Database operations (device logs storage)
 * 3. Real-time subscriptions (jika diperlukan)
 * 4. Storage operations (jika diperlukan)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ===================================================================
// DATABASE TYPE DEFINITIONS
// ===================================================================

/**
 * Interface untuk Device Logs table
 * 
 * Struktur data untuk menyimpan log messages dari ESP32
 * dan sistem lainnya dengan metadata lengkap
 */
export interface DeviceLog {
  id: string;              // UUID primary key
  timestamp: string;       // ISO timestamp saat log diterima
  level: string;           // Log level (INFO, WARNING, ERROR, DEBUG)
  message: string;         // Isi pesan log
  device_id: string;       // Identifier perangkat (default: 'esp32_car')
  created_at: string;      // Timestamp record dibuat
}

/**
 * Type untuk insert data ke device_logs table
 * Beberapa field optional karena ada default values
 */
export interface DeviceLogInsert {
  timestamp?: string;      // Optional, default: now()
  level: string;           // Required
  message: string;         // Required
  device_id?: string;      // Optional, default: 'esp32_car'
}

// ===================================================================
// DATABASE HELPER FUNCTIONS
// ===================================================================

/**
 * Function untuk menyimpan log ke database
 * 
 * @param logData - Data log yang akan disimpan
 * @returns Promise dengan result atau error
 */
export const saveLogToDatabase = async (logData: DeviceLogInsert) => {
  try {
    const { data, error } = await supabase
      .from('device_logs')
      .insert([logData])
      .select();

    if (error) {
      console.error('Error saving log to database:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Unexpected error saving log:', err);
    return { success: false, error: err };
  }
};

/**
 * Function untuk mengambil logs dari database
 * 
 * @param limit - Jumlah maksimal logs yang diambil
 * @param deviceId - Filter berdasarkan device ID (optional)
 * @returns Promise dengan array logs atau error
 */
export const getLogsFromDatabase = async (limit: number = 100, deviceId?: string) => {
  try {
    let query = supabase
      .from('device_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (deviceId) {
      query = query.eq('device_id', deviceId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching logs from database:', error);
      return { success: false, error };
    }

    return { success: true, data: data || [] };
  } catch (err) {
    console.error('Unexpected error fetching logs:', err);
    return { success: false, error: err };
  }
};

/**
 * Function untuk menghapus semua logs dari database
 * 
 * @param deviceId - Filter berdasarkan device ID (optional)
 * @returns Promise dengan result atau error
 */
export const clearLogsFromDatabase = async (deviceId?: string) => {
  try {
    let query = supabase.from('device_logs').delete();

    if (deviceId) {
      query = query.eq('device_id', deviceId);
    } else {
      query = query.neq('id', ''); // Delete all records
    }

    const { error } = await query;

    if (error) {
      console.error('Error clearing logs from database:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error clearing logs:', err);
    return { success: false, error: err };
  }
};

/**
 * Function untuk cleanup logs lama (keep only latest 1000)
 * 
 * @returns Promise dengan result atau error
 */
export const cleanupOldLogs = async () => {
  try {
    const { error } = await supabase.rpc('cleanup_old_logs');

    if (error) {
      console.error('Error cleaning up old logs:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error cleaning up logs:', err);
    return { success: false, error: err };
  }
};