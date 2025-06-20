import React from 'react';
import { Wifi, WifiOff, AlertCircle, Loader } from 'lucide-react';

interface MQTTStatusProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  isConnected: boolean;
}

export const MQTTStatus: React.FC<MQTTStatusProps> = ({ status, isConnected }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: <Wifi className="w-5 h-5 text-green-500" />,
          text: 'Connected',
          textColor: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20'
        };
      case 'connecting':
        return {
          icon: <Loader className="w-5 h-5 text-yellow-500 animate-spin" />,
          text: 'Connecting...',
          textColor: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-5 h-5 text-red-500" />,
          text: 'Connection Error',
          textColor: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20'
        };
      default:
        return {
          icon: <WifiOff className="w-5 h-5 text-gray-500" />,
          text: 'Disconnected',
          textColor: 'text-gray-500',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/20'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`flex items-center space-x-3 px-4 py-2 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
      {config.icon}
      <div>
        <span className={`${config.textColor} text-sm font-medium`}>
          {config.text}
        </span>
        {isConnected && (
          <p className="text-xs text-gray-400">Private Cluster</p>
        )}
      </div>
    </div>
  );
};