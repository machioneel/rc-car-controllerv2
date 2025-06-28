import React, { useRef, useEffect } from 'react';
import { ScrollText, AlertCircle, Info, AlertTriangle, XCircle, Trash2, Database, Loader } from 'lucide-react';

// ===================================================================
// TYPE DEFINITIONS
// ===================================================================

/**
 * Interface untuk single log entry
 * Struktur data yang konsisten untuk setiap log message
 */
interface LogEntry {
  id: string;           // Unique identifier untuk React key
  timestamp: Date;      // Waktu log entry dibuat
  level: string;        // Level log (INFO, ERROR, WARNING, DEBUG)
  message: string;      // Isi pesan log
}

/**
 * Props interface untuk LogPanel component
 */
interface LogPanelProps {
  logs: LogEntry[];         // Array log entries yang akan ditampilkan
  onClearLogs?: () => void; // Optional callback untuk clear logs
  isLoading?: boolean;      // Optional loading state untuk database operations
}

// ===================================================================
// LOG PANEL COMPONENT
// ===================================================================

/**
 * Component untuk menampilkan panel log dengan scroll dan filtering
 * 
 * Fitur:
 * 1. Auto-scroll ke top saat log baru masuk
 * 2. Color coding berdasarkan log level
 * 3. Icon yang sesuai untuk setiap log level
 * 4. Timestamp formatting
 * 5. Responsive design dengan scroll
 * 6. Clear logs functionality dengan database integration
 * 7. Loading state untuk database operations
 * 
 * @param logs - Array log entries yang akan ditampilkan
 * @param onClearLogs - Optional callback untuk clear logs
 * @param isLoading - Optional loading state untuk database operations
 */
export const LogPanel: React.FC<LogPanelProps> = ({ logs, onClearLogs, isLoading = false }) => {
  
  // ===============================================================
  // REFS AND SCROLL MANAGEMENT
  // ===============================================================
  
  /**
   * Ref untuk scroll container
   * Digunakan untuk mengontrol scroll position secara programmatic
   */
  const scrollRef = useRef<HTMLDivElement>(null);

  /**
   * Effect untuk auto-scroll ke top saat ada log baru
   * 
   * Algoritma:
   * 1. Trigger saat logs array berubah (ada log baru)
   * 2. Scroll container ke posisi top (0)
   * 3. Menampilkan log terbaru di atas
   */
  useEffect(() => {
    if (scrollRef.current) {
      // Scroll ke top untuk menampilkan log terbaru
      scrollRef.current.scrollTop = 0;
    }
  }, [logs]); // Dependency: logs array

  // ===============================================================
  // EVENT HANDLERS
  // ===============================================================
  
  /**
   * Handler untuk clear logs dengan konfirmasi
   * 
   * Algoritma:
   * 1. Tampilkan konfirmasi dialog
   * 2. Jika user confirm, panggil onClearLogs callback
   * 3. Parent component akan handle state update dan database operation
   */
  const handleClearLogs = () => {
    if (logs.length === 0) return; // Tidak ada logs untuk dihapus
    
    const confirmed = window.confirm(
      `Apa anda yakin ingin menghapus ${logs.length} entri log? Ini juga akan menghapusnya dari database. Tindakan ini tidak dapat dibatalkan.`
    );
    
    if (confirmed && onClearLogs) {
      onClearLogs();
    }
  };

  // ===============================================================
  // UTILITY FUNCTIONS
  // ===============================================================
  
  /**
   * Function untuk mendapatkan icon yang sesuai berdasarkan log level
   * 
   * Algoritma:
   * 1. Normalize log level ke uppercase
   * 2. Map level ke icon component yang sesuai
   * 3. Return icon dengan color yang konsisten
   * 
   * @param level - Log level string
   * @returns React icon component dengan styling
   */
  const getLogIcon = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'WARN':
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'DEBUG':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      default: // INFO dan level lainnya
        return <Info className="w-4 h-4 text-green-500" />;
    }
  };

  /**
   * Function untuk mendapatkan color scheme berdasarkan log level
   * 
   * Algoritma:
   * 1. Normalize log level ke uppercase
   * 2. Return CSS classes untuk text, background, dan border
   * 3. Konsisten dengan color scheme icon
   * 
   * @param level - Log level string
   * @returns String CSS classes untuk styling
   */
  const getLogColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'WARN':
      case 'WARNING':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'DEBUG':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default: // INFO dan level lainnya
        return 'text-green-400 bg-green-500/10 border-green-500/20';
    }
  };

  /**
   * Function untuk format timestamp ke format yang readable
   * 
   * Algoritma:
   * 1. Convert Date object ke locale time string
   * 2. Format: HH:MM:SS (24-hour format)
   * 3. Konsisten untuk semua log entries
   * 
   * @param timestamp - Date object
   * @returns Formatted time string
   */
  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour12: false,        // 24-hour format
      hour: '2-digit',      // Always 2 digits
      minute: '2-digit',    // Always 2 digits
      second: '2-digit'     // Always 2 digits
    });
  };

  // ===============================================================
  // COMPONENT RENDER
  // ===============================================================
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 flex-1 flex flex-col">
      
      {/* =========================================================
          HEADER SECTION
          ========================================================= */}
      <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <ScrollText className="w-5 h-5 text-cyan-500 mr-2" />
          System Logs
          {/* Database indicator */}
          <Database className="w-4 h-4 text-gray-400 ml-2" title="Logs are stored in database" />
        </h3>
        <div className="flex items-center space-x-3">
          {/* Counter untuk jumlah log entries */}
          <span className="text-xs text-gray-400">
            {logs.length} entries
          </span>
          
          {/* Clear logs button */}
          {logs.length > 0 && onClearLogs && (
            <button
              onClick={handleClearLogs}
              disabled={isLoading}
              className="flex items-center space-x-1 px-2 py-1 bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 rounded-lg transition-colors text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Clear all logs from UI and database"
            >
              {isLoading ? (
                <Loader className="w-3 h-3 animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3" />
              )}
              <span className="text-xs font-medium">Clear</span>
            </button>
          )}
          
          {/* Live indicator */}
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </div>
      
      {/* =========================================================
          LOGS CONTENT SECTION
          ========================================================= */}
      <div 
        ref={scrollRef}
        className="flex-1 p-4 space-y-2 overflow-y-auto max-h-96 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
      >
        {isLoading ? (
          // =====================================================
          // LOADING STATE
          // =====================================================
          <div className="text-center py-8">
            <Loader className="w-12 h-12 text-gray-600 mx-auto mb-3 animate-spin" />
            <p className="text-gray-500 text-sm">Loading logs from database...</p>
          </div>
        ) : logs.length === 0 ? (
          // =====================================================
          // EMPTY STATE
          // =====================================================
          <div className="text-center py-8">
            <ScrollText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No logs available</p>
            <p className="text-gray-600 text-xs mt-1">
              Waiting for ESP32 log messages...
            </p>
          </div>
        ) : (
          // =====================================================
          // LOG ENTRIES LIST
          // =====================================================
          logs.map((log) => (
            <div
              key={log.id}
              className={`p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${getLogColor(log.level)}`}
            >
              <div className="flex items-start space-x-3">
                {/* Log level icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getLogIcon(log.level)}
                </div>
                
                {/* Log content */}
                <div className="flex-1 min-w-0">
                  {/* Header dengan level dan timestamp */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium uppercase tracking-wide">
                      {log.level}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      {formatTime(log.timestamp)}
                    </span>
                  </div>
                  
                  {/* Log message dengan word wrapping */}
                  <p className="text-sm break-words leading-relaxed">
                    {log.message}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* =========================================================
          FOOTER SECTION (hanya tampil jika ada logs)
          ========================================================= */}
      {logs.length > 0 && !isLoading && (
        <div className="p-3 border-t border-gray-700/50 bg-gray-900/30">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Real-time logging active</span>
            <span>Stored in database</span>
          </div>
        </div>
      )}
    </div>
  );
};