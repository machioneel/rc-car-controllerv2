import React from 'react';
import { Loader, Car } from 'lucide-react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-cyan-500/20 rounded-2xl">
            <Car className="w-10 h-10 text-cyan-500" />
          </div>
          <div className="absolute -top-2 -right-2">
            <Loader className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
          RC Car Controller
        </h2>
        <p className="text-gray-400 animate-pulse">
          Initializing system...
        </p>
        
        <div className="mt-6 flex justify-center">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};