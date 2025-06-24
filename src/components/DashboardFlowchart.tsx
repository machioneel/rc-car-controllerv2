import React from 'react';
import { ArrowLeft, Download, Printer } from 'lucide-react';

// ===================================================================
// DASHBOARD FLOWCHART COMPONENT
// ===================================================================

/**
 * Component untuk menampilkan flowchart dashboard RC Car Controller
 * Menggunakan simbol flowchart standar sesuai dengan aturan yang diberikan
 */
export const DashboardFlowchart: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <header className="p-6 border-b border-gray-700/50 backdrop-blur-sm bg-gray-900/80 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => window.history.back()}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Dashboard Flowchart
              </h1>
              <p className="text-sm text-gray-400">RC Car Controller - System Flow Diagram</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              <span className="text-sm">Export</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
              <Printer className="w-4 h-4" />
              <span className="text-sm">Print</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          
          {/* SVG Flowchart */}
          <svg 
            viewBox="0 0 1200 1600" 
            className="w-full h-auto"
            style={{ maxHeight: '80vh' }}
          >
            {/* Definitions for reusable elements */}
            <defs>
              {/* Arrow marker */}
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#374151"
                />
              </marker>
              
              {/* Drop shadow filter */}
              <filter id="dropshadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.3"/>
              </filter>
            </defs>

            {/* START - Terminator Symbol */}
            <rect x="500" y="20" width="200" height="60" rx="30" ry="30" 
                  fill="#10b981" stroke="#065f46" strokeWidth="2" filter="url(#dropshadow)"/>
            <text x="600" y="45" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="14" fontWeight="bold">MULAI</text>
            <text x="600" y="60" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="12">Dashboard Load</text>

            {/* Arrow 1 */}
            <line x1="600" y1="80" x2="600" y2="120" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>

            {/* Authentication Check - Decision Symbol */}
            <polygon points="600,120 720,170 600,220 480,170" 
                     fill="#f59e0b" stroke="#d97706" strokeWidth="2" filter="url(#dropshadow)"/>
            <text x="600" y="165" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="12" fontWeight="bold">User</text>
            <text x="600" y="180" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="12" fontWeight="bold">Authenticated?</text>

            {/* Arrow to Login (NO) */}
            <line x1="480" y1="170" x2="350" y2="170" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>
            <text x="415" y="165" textAnchor="middle" fill="#374151" fontSize="12" fontWeight="bold">TIDAK</text>

            {/* Login Form - Processing Symbol */}
            <rect x="250" y="140" width="200" height="60" 
                  fill="#ef4444" stroke="#dc2626" strokeWidth="2" filter="url(#dropshadow)"/>
            <text x="350" y="165" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="12" fontWeight="bold">LOGIN FORM</text>
            <text x="350" y="180" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="11">Input Email & Password</text>

            {/* Arrow back to auth check */}
            <path d="M 250 170 Q 200 170 200 120 Q 200 70 480 70 Q 480 120 480 170" 
                  fill="none" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>

            {/* Arrow to Dashboard (YES) */}
            <line x1="600" y1="220" x2="600" y2="280" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>
            <text x="620" y="250" fill="#374151" fontSize="12" fontWeight="bold">YA</text>

            {/* MQTT Connection Check - Decision Symbol */}
            <polygon points="600,280 720,330 600,380 480,330" 
                     fill="#f59e0b" stroke="#d97706" strokeWidth="2" filter="url(#dropshadow)"/>
            <text x="600" y="320" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="12" fontWeight="bold">MQTT</text>
            <text x="600" y="335" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="12" fontWeight="bold">Connected?</text>

            {/* Arrow to Connection Process (NO) */}
            <line x1="480" y1="330" x2="350" y2="330" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>
            <text x="415" y="325" textAnchor="middle" fill="#374151" fontSize="12" fontWeight="bold">TIDAK</text>

            {/* MQTT Connection - Processing Symbol */}
            <rect x="250" y="300" width="200" height="60" 
                  fill="#8b5cf6" stroke="#7c3aed" strokeWidth="2" filter="url(#dropshadow)"/>
            <text x="350" y="320" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="12" fontWeight="bold">MQTT CONNECTION</text>
            <text x="350" y="335" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="11">Connecting to Broker</text>

            {/* Arrow back to MQTT check */}
            <path d="M 250 330 Q 200 330 200 280 Q 200 230 480 230 Q 480 280 480 330" 
                  fill="none" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>

            {/* Arrow to Dashboard Main (YES) */}
            <line x1="600" y1="380" x2="600" y2="440" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>
            <text x="620" y="410" fill="#374151" fontSize="12" fontWeight="bold">YA</text>

            {/* Dashboard Main - Processing Symbol */}
            <rect x="500" y="440" width="200" height="60" 
                  fill="#06b6d4" stroke="#0891b2" strokeWidth="2" filter="url(#dropshadow)"/>
            <text x="600" y="465" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="12" fontWeight="bold">DASHBOARD MAIN</text>
            <text x="600" y="480" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="11">Initialize Components</text>

            {/* Arrow to parallel processes */}
            <line x1="600" y1="500" x2="600" y2="540" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>

            {/* Parallel Processes - Input/Output Symbol */}
            <polygon points="500,540 700,540 680,600 480,600" 
                     fill="#64748b" stroke="#475569" strokeWidth="2" filter="url(#dropshadow)"/>
            <text x="590" y="565" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="12" fontWeight="bold">PARALLEL PROCESSES</text>
            <text x="590" y="580" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="11">Subscribe MQTT Topics</text>

            {/* Three parallel branches */}
            <line x1="590" y1="600" x2="590" y2="640" stroke="#374151" strokeWidth="2"/>
            <line x1="590" y1="640" x2="300" y2="640" stroke="#374151" strokeWidth="2"/>
            <line x1="590" y1="640" x2="590" y2="640" stroke="#374151" strokeWidth="2"/>
            <line x1="590" y1="640" x2="880" y2="640" stroke="#374151" strokeWidth="2"/>
            
            <line x1="300" y1="640" x2="300" y2="680" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>
            <line x1="590" y1="640" x2="590" y2="680" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>
            <line x1="880" y1="640" x2="880" y2="680" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>

            {/* Left Branch - Sensor & Logs */}
            <rect x="200" y="680" width="200" height="80" 
                  fill="#16a34a" stroke="#15803d" strokeWidth="2" filter="url(#dropshadow)"/>
            <text x="300" y="705" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="12" fontWeight="bold">SENSOR & LOGS</text>
            <text x="300" y="720" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="10">• Distance Sensor Data</text>
            <text x="300" y="735" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="10">• System Log Messages</text>
            <text x="300" y="750" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="10">• Real-time Updates</text>

            {/* Center Branch - Camera Stream */}
            <rect x="490" y="680" width="200" height="80" 
                  fill="#dc2626" stroke="#b91c1c" strokeWidth="2" filter="url(#dropshadow)"/>
            <text x="590" y="705" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="12" fontWeight="bold">CAMERA STREAM</text>
            <text x="590" y="720" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="10">• Live Video Feed</text>
            <text x="590" y="735" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="10">• Image Rotation</text>
            <text x="590" y="750" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="10">• LIVE Indicator</text>

            {/* Right Branch - Controls */}
            <rect x="780" y="680" width="200" height="80" 
                  fill="#7c3aed" stroke="#6d28d9" strokeWidth="2" filter="url(#dropshadow)"/>
            <text x="880" y="705" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="12" fontWeight="bold">CONTROLS</text>
            <text x="880" y="720" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="10">• Autonomous Mode</text>
            <text x="880" y="735" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="10">• Speed & LED Control</text>
            <text x="880" y="750" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="10">• Direction Control</text>

            {/* User Input Decision */}
            <line x1="880" y1="760" x2="880" y2="820" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>

            <polygon points="880,820 1000,870 880,920 760,870" 
                     fill="#f59e0b" stroke="#d97706" strokeWidth="2" filter="url(#dropshadow)"/>
            <text x="880" y="860" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="12" fontWeight="bold">User Input</text>
            <text x="880" y="875" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="12" fontWeight="bold">Detected?</text>

            {/* Autonomous Mode Check */}
            <line x1="880" y1="920" x2="880" y2="980" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>

            <polygon points="880,980 1000,1030 880,1080 760,1030" 
                     fill="#f59e0b" stroke="#d97706" strokeWidth="2" filter="url(#dropshadow)"/>
            <text x="880" y="1020" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="12" fontWeight="bold">Autonomous</text>
            <text x="880" y="1035" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="12" fontWeight="bold">Mode Active?</text>

            {/* Manual Control Branch */}
            <line x1="760" y1="1030" x2="650" y2="1030" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>
            <text x="705" y="1025" textAnchor="middle" fill="#374151" fontSize="12" fontWeight="bold">TIDAK</text>

            <rect x="550" y="1000" width="200" height="60" 
                  fill="#059669" stroke="#047857" strokeWidth="2" filter="url(#dropshadow)"/>
            <text x="650" y="1020" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="12" fontWeight="bold">MANUAL CONTROL</text>
            <text x="650" y="1035" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="11">Send MQTT Commands</text>

            {/* Autonomous Control Branch */}
            <line x1="1000" y1="1030" x2="1110" y2="1030" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>
            <text x="1055" y="1025" textAnchor="middle" fill="#374151" fontSize="12" fontWeight="bold">YA</text>

            <rect x="1010" y="1000" width="200" height="60" 
                  fill="#dc2626" stroke="#b91c1c" strokeWidth="2" filter="url(#dropshadow)"/>
            <text x="1110" y="1020" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="12" fontWeight="bold">BLOCK INPUT</text>
            <text x="1110" y="1035" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="11">Autonomous Active</text>

            {/* Merge back */}
            <line x1="650" y1="1060" x2="650" y2="1140" stroke="#374151" strokeWidth="2"/>
            <line x1="1110" y1="1060" x2="1110" y2="1140" stroke="#374151" strokeWidth="2"/>
            <line x1="650" y1="1140" x2="880" y2="1140" stroke="#374151" strokeWidth="2"/>
            <line x1="1110" y1="1140" x2="880" y2="1140" stroke="#374151" strokeWidth="2"/>
            <line x1="880" y1="1140" x2="880" y2="1180" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>

            {/* MQTT Publish */}
            <rect x="780" y="1180" width="200" height="60" 
                  fill="#0891b2" stroke="#0e7490" strokeWidth="2" filter="url(#dropshadow)"/>
            <text x="880" y="1205" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="12" fontWeight="bold">MQTT PUBLISH</text>
            <text x="880" y="1220" textAnchor="middle" dominantBaseline="middle" 
                  fill="white" fontSize="11">Send to ESP32</text>

            {/* Loop back */}
            <line x1="880" y1="1240" x2="880" y2="1280" stroke="#374151" strokeWidth="2"/>
            <path d="M 880 1280 Q 1050 1280 1050 870 Q 1000 870 1000 870" 
                  fill="none" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>

            {/* Continuous Loop Label */}
            <text x="1050" y="1075" textAnchor="middle" fill="#374151" fontSize="11" fontWeight="bold">Continuous</text>
            <text x="1050" y="1090" textAnchor="middle" fill="#374151" fontSize="11" fontWeight="bold">Loop</text>

            {/* Legend */}
            <g transform="translate(50, 1300)">
              <rect x="0" y="0" width="300" height="250" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" rx="10"/>
              <text x="150" y="25" textAnchor="middle" fill="#1e293b" fontSize="14" fontWeight="bold">LEGEND</text>
              
              {/* Terminator */}
              <rect x="20" y="40" width="60" height="25" rx="12" fill="#10b981" stroke="#065f46"/>
              <text x="100" y="55" fill="#1e293b" fontSize="11">Terminator (Start/End)</text>
              
              {/* Process */}
              <rect x="20" y="70" width="60" height="25" fill="#06b6d4" stroke="#0891b2"/>
              <text x="100" y="85" fill="#1e293b" fontSize="11">Process</text>
              
              {/* Decision */}
              <polygon points="20,105 50,95 80,105 50,115" fill="#f59e0b" stroke="#d97706"/>
              <text x="100" y="108" fill="#1e293b" fontSize="11">Decision</text>
              
              {/* Input/Output */}
              <polygon points="20,130 75,130 70,145 15,145" fill="#64748b" stroke="#475569"/>
              <text x="100" y="140" fill="#1e293b" fontSize="11">Input/Output</text>
              
              {/* Manual Operation */}
              <polygon points="20,160 80,160 70,175 30,175" fill="#059669" stroke="#047857"/>
              <text x="100" y="170" fill="#1e293b" fontSize="11">Manual Operation</text>
              
              {/* Flow Direction */}
              <line x1="20" y1="190" x2="60" y2="190" stroke="#374151" strokeWidth="2" markerEnd="url(#arrowhead)"/>
              <text x="100" y="195" fill="#1e293b" fontSize="11">Flow Direction</text>
              
              {/* Connector */}
              <circle cx="40" cy="210" r="8" fill="#8b5cf6" stroke="#7c3aed"/>
              <text x="100" y="215" fill="#1e293b" fontSize="11">Connector</text>
            </g>
          </svg>
        </div>

        {/* Description */}
        <div className="mt-8 bg-gray-800/50 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-cyan-400 mb-4">Deskripsi Flowchart</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
            <div>
              <h3 className="font-semibold text-white mb-2">Alur Utama:</h3>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Start:</strong> Dashboard dimuat</li>
                <li>• <strong>Authentication:</strong> Validasi user login</li>
                <li>• <strong>MQTT Connection:</strong> Koneksi ke broker</li>
                <li>• <strong>Dashboard Main:</strong> Inisialisasi komponen</li>
                <li>• <strong>Parallel Processes:</strong> Subscribe topic MQTT</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Komponen Dashboard:</h3>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Sensor & Logs:</strong> Data sensor dan log sistem</li>
                <li>• <strong>Camera Stream:</strong> Live feed dari ESP32-CAM</li>
                <li>• <strong>Controls:</strong> Kontrol manual dan autonomous</li>
                <li>• <strong>User Input:</strong> Keyboard dan UI controls</li>
                <li>• <strong>MQTT Publish:</strong> Kirim perintah ke ESP32</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};