import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// ===================================================================
// TYPE DEFINITIONS
// ===================================================================

/**
 * Interface untuk Authentication Context
 * Mendefinisikan semua state dan functions yang tersedia
 * untuk components yang menggunakan authentication
 */
interface AuthContextType {
  user: User | null;                                          // Current authenticated user
  session: Session | null;                                    // Current session data
  loading: boolean;                                           // Loading state untuk UI
  signIn: (email: string, password: string) => Promise<{ error: any }>; // Login function
  signOut: () => Promise<void>;                               // Logout function
}

// ===================================================================
// CONTEXT CREATION
// ===================================================================

/**
 * Create React Context untuk Authentication
 * Initial value undefined untuk memaksa penggunaan dalam Provider
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ===================================================================
// CUSTOM HOOK: useAuth
// ===================================================================

/**
 * Custom hook untuk mengakses Authentication Context
 * 
 * Algoritma:
 * 1. Ambil context value dari AuthContext
 * 2. Validasi context tersedia (dalam AuthProvider)
 * 3. Throw error jika digunakan di luar Provider
 * 4. Return context value jika valid
 * 
 * @returns AuthContextType object dengan auth state dan functions
 * @throws Error jika digunakan di luar AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  // Algoritma validasi context:
  // Memastikan hook hanya digunakan dalam AuthProvider tree
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// ===================================================================
// AUTH PROVIDER COMPONENT
// ===================================================================

/**
 * Authentication Provider Component
 * 
 * Algoritma utama:
 * 1. Inisialisasi auth state (user, session, loading)
 * 2. Setup Supabase auth state listener
 * 3. Provide auth functions (signIn, signOut)
 * 4. Wrap children dengan context provider
 * 
 * @param children - Child components yang akan memiliki akses ke auth context
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  
  // ===============================================================
  // STATE MANAGEMENT
  // ===============================================================
  
  /**
   * State untuk menyimpan authentication data
   */
  const [user, setUser] = useState<User | null>(null);           // Current user object
  const [session, setSession] = useState<Session | null>(null);   // Current session object
  const [loading, setLoading] = useState(true);                  // Loading state untuk initial load

  // ===============================================================
  // AUTHENTICATION LIFECYCLE MANAGEMENT
  // ===============================================================
  
  /**
   * Effect untuk mengelola authentication state lifecycle
   * 
   * Algoritma:
   * 1. Get initial session saat component mount
   * 2. Setup auth state change listener
   * 3. Update state berdasarkan auth events
   * 4. Cleanup listener saat component unmount
   */
  useEffect(() => {
    
    // =========================================================
    // INITIAL SESSION RETRIEVAL
    // =========================================================
    
    /**
     * Algoritma initial session check:
     * 1. Query Supabase untuk session yang tersimpan
     * 2. Extract session dan user data
     * 3. Update state dengan data yang ditemukan
     * 4. Set loading false setelah initial check selesai
     */
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);                    // Set session data
      setUser(session?.user ?? null);        // Extract user dari session
      setLoading(false);                      // Initial loading selesai
    });

    // =========================================================
    // AUTH STATE CHANGE LISTENER
    // =========================================================
    
    /**
     * Setup listener untuk perubahan authentication state
     * 
     * Algoritma:
     * 1. Listen untuk semua auth events (login, logout, token refresh, dll)
     * 2. Update state berdasarkan session baru
     * 3. Set loading false setelah setiap perubahan
     * 
     * Events yang di-handle:
     * - SIGNED_IN: User berhasil login
     * - SIGNED_OUT: User logout
     * - TOKEN_REFRESHED: Session token di-refresh
     * - USER_UPDATED: User data diupdate
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);                    // Update session state
      setUser(session?.user ?? null);        // Update user state
      setLoading(false);                      // Loading selesai
    });

    // =========================================================
    // CLEANUP FUNCTION
    // =========================================================
    
    /**
     * Cleanup subscription untuk mencegah memory leaks
     * Dipanggil saat component unmount
     */
    return () => subscription.unsubscribe();
  }, []); // Empty dependency array = run once on mount

  // ===============================================================
  // AUTHENTICATION FUNCTIONS
  // ===============================================================
  
  /**
   * Function untuk user sign in
   * 
   * Algoritma:
   * 1. Call Supabase signInWithPassword dengan credentials
   * 2. Return error object untuk handling di UI
   * 3. Auth state akan otomatis update via listener
   * 
   * @param email - User email address
   * @param password - User password
   * @returns Promise dengan error object (null jika sukses)
   */
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // Return error untuk handling di component
    // Success case akan di-handle oleh auth state listener
    return { error };
  };

  /**
   * Function untuk user sign out
   * 
   * Algoritma:
   * 1. Call Supabase signOut function
   * 2. Auth state akan otomatis update via listener
   * 3. User dan session akan di-clear otomatis
   */
  const signOut = async () => {
    await supabase.auth.signOut();
    // State cleanup akan di-handle oleh auth state listener
  };

  // ===============================================================
  // CONTEXT VALUE PREPARATION
  // ===============================================================
  
  /**
   * Prepare context value object
   * Berisi semua state dan functions yang akan tersedia
   * untuk components yang menggunakan useAuth hook
   */
  const value = {
    user,           // Current authenticated user
    session,        // Current session data
    loading,        // Loading state
    signIn,         // Login function
    signOut,        // Logout function
  };

  // ===============================================================
  // PROVIDER RENDER
  // ===============================================================
  
  /**
   * Render AuthContext.Provider dengan value dan children
   * Semua child components akan memiliki akses ke auth context
   */
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};