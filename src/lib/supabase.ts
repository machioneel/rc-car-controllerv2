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
 * 2. Database operations (jika diperlukan)
 * 3. Real-time subscriptions (jika diperlukan)
 * 4. Storage operations (jika diperlukan)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ===================================================================
// DATABASE TYPE DEFINITIONS
// ===================================================================

/**
 * Interface untuk Capture table
 * 
 * Struktur data untuk menyimpan informasi capture/screenshot
 * dari RC car camera feed (jika fitur ini diimplementasi)
 */
export interface Capture {
  id: string;              // UUID primary key
  filename: string;        // Nama file capture
  file_path: string;       // Path file di storage
  file_size: number;       // Ukuran file dalam bytes
  mime_type: string;       // MIME type (image/jpeg, dll)
  captured_at: string;     // Timestamp saat capture dibuat
  description?: string;    // Deskripsi optional
  tags?: string[];         // Tags untuk kategorisasi
  created_at: string;      // Timestamp record dibuat
  updated_at: string;      // Timestamp record diupdate
}

/**
 * Note: Interface ini sudah disiapkan untuk fitur future
 * seperti menyimpan screenshot dari camera feed atau
 * recording session data dari RC car operations
 */