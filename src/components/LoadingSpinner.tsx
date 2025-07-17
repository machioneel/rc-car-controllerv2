import React from 'react';
import { Loader, Car } from 'lucide-react';

// ===================================================================
// LOADING SPINNER COMPONENT
// ===================================================================
export const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
      <div className="text-center">
        
        {/* =========================================================
            MAIN ICON WITH SPINNER OVERLAY
            ========================================================= */}
        <div className="relative mb-8">
          {/* Main app icon container */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-cyan-500/20 rounded-2xl">
            <Car className="w-10 h-10 text-cyan-500" />
          </div>
          
          {/* Loading spinner overlay */}
          <div className="absolute -top-2 -right-2">
            <Loader className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        </div>
        
        {/* =========================================================
            LOADING TEXT
            ========================================================= */}
        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
          RC Car Controller
        </h2>
        <p className="text-gray-400 animate-pulse">
          Initializing system...
        </p>
        
        {/* =========================================================
            ANIMATED DOTS INDICATOR
            ========================================================= */}
        <div className="mt-6 flex justify-center">
          <div className="flex space-x-1">
            {/* Dot 1 - no delay */}
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></div>
            
            {/* Dot 2 - 0.1s delay */}
            <div 
              className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" 
              style={{ animationDelay: '0.1s' }}
            ></div>
            
            {/* Dot 3 - 0.2s delay */}
            <div 
              className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" 
              style={{ animationDelay: '0.2s' }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};