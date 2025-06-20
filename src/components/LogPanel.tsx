import React, { useRef, useEffect } from 'react';
import { ScrollText, AlertCircle, Info, AlertTriangle, XCircle } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: string;
  message: string;
}

interface LogPanelProps {
  logs: LogEntry[];
}

export const LogPanel: React.FC<LogPanelProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs]);

  const getLogIcon = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'WARN':
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'DEBUG':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4 text-green-500" />;
    }
  };

  const getLogColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'WARN':
      case 'WARNING':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'DEBUG':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default:
        return 'text-green-400 bg-green-500/10 border-green-500/20';
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 flex-1 flex flex-col">
      <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <ScrollText className="w-5 h-5 text-cyan-500 mr-2" />
          System Logs
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">
            {logs.length} entries
          </span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 p-4 space-y-2 overflow-y-auto max-h-96 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
      >
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <ScrollText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No logs available</p>
            <p className="text-gray-600 text-xs mt-1">
              Waiting for ESP32 log messages...
            </p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${getLogColor(log.level)}`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getLogIcon(log.level)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium uppercase tracking-wide">
                      {log.level}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      {formatTime(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm break-words leading-relaxed">
                    {log.message}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {logs.length > 0 && (
        <div className="p-3 border-t border-gray-700/50 bg-gray-900/30">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Real-time logging active</span>
            <span>Max 100 entries</span>
          </div>
        </div>
      )}
    </div>
  );
};