import React, { useState } from 'react';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// ===================================================================
// USER PROFILE COMPONENT
// ===================================================================

/**
 * Component untuk menampilkan user profile dengan dropdown menu
 * 
 * Fitur:
 * 1. User avatar dengan gradient background
 * 2. Dropdown menu dengan animasi
 * 3. User info display (email, status)
 * 4. Settings dan logout actions
 * 5. Click outside to close functionality
 * 6. Responsive design
 */
export const UserProfile: React.FC = () => {
  
  // ===============================================================
  // STATE MANAGEMENT
  // ===============================================================
  
  /**
   * State untuk mengontrol visibility dropdown menu
   */
  const [isOpen, setIsOpen] = useState(false);
  
  /**
   * Auth context untuk mendapatkan user data dan functions
   */
  const { user, signOut } = useAuth();

  // ===============================================================
  // EVENT HANDLERS
  // ===============================================================
  
  /**
   * Handler untuk sign out action
   * 
   * Algoritma:
   * 1. Call signOut function dari auth context
   * 2. Close dropdown menu
   * 3. Auth state akan otomatis update dan redirect ke login
   */
  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false); // Close dropdown setelah logout
  };

  // ===============================================================
  // CONDITIONAL RENDERING
  // ===============================================================
  
  /**
   * Early return jika user tidak ada (tidak authenticated)
   * Component hanya render untuk authenticated users
   */
  if (!user) return null;

  // ===============================================================
  // COMPONENT RENDER
  // ===============================================================
  
  return (
    <div className="relative">
      
      {/* =========================================================
          PROFILE TRIGGER BUTTON
          ========================================================= */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
      >
        {/* User avatar dengan gradient background */}
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
        </div>
        
        {/* User info (hidden pada mobile) */}
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-white truncate max-w-32">
            {user.email}
          </p>
          <p className="text-xs text-gray-400">Online</p>
        </div>
        
        {/* Dropdown chevron dengan rotasi animasi */}
        <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* =========================================================
          DROPDOWN MENU
          ========================================================= */}
      {isOpen && (
        <>
          {/* Backdrop untuk click outside to close */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown content */}
          <div className="absolute right-0 top-full mt-2 w-56 sm:w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20">
            
            {/* =====================================================
                USER INFO SECTION
                ===================================================== */}
            <div className="p-3 sm:p-4 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                {/* Larger avatar untuk dropdown */}
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                
                {/* User details */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">
                    {user.email}
                  </p>
                  <p className="text-xs text-gray-400">
                    Authenticated User
                  </p>
                </div>
              </div>
            </div>
            
            {/* =====================================================
                MENU ACTIONS
                ===================================================== */}
            <div className="p-2">
              
              {/* Settings menu item */}
              {/*<button
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">Settings</span>
              </button>*/}
              
              {/* Sign out menu item dengan styling khusus */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-red-600/20 rounded-lg transition-colors text-red-400 hover:text-red-300"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};