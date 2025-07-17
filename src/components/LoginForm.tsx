import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader, Car } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// ===================================================================
// LOGIN FORM COMPONENT
// ===================================================================
export const LoginForm: React.FC = () => {
  
  // ===============================================================
  // STATE MANAGEMENT
  // ===============================================================
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  /**
   * UI state untuk interaksi
   */
  const [showPassword, setShowPassword] = useState(false);  // Toggle password visibility
  const [loading, setLoading] = useState(false);           // Loading state untuk submit
  const [error, setError] = useState('');                  // Error message display

  /**
   * Auth context untuk sign in function
   */
  const { signIn } = useAuth();

  // ===============================================================
  // EVENT HANDLERS
  // ===============================================================
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    
    // Set loading state
    setLoading(true);
    setError(''); // Clear previous errors

    try {
      // Attempt sign in dengan email dan password
      const { error } = await signIn(email, password);

      // Handle error response dari Supabase
      if (error) {
        setError(error.message);
      }
      
    } catch (err) {
      // Handle unexpected errors
      setError('An unexpected error occurred');
    } finally {
      // Reset loading state regardless of outcome
      setLoading(false);
    }
  };

  // ===============================================================
  // COMPONENT RENDER
  // ===============================================================
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* =========================================================
            HEADER SECTION
            ========================================================= */}
        <div className="text-center mb-8">
          {/* App icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-500/20 rounded-2xl mb-4">
            <Car className="w-8 h-8 text-cyan-500" />
          </div>
          
          {/* App title dengan gradient text */}
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            RC Car Controller
          </h1>
          
          {/* Subtitle */}
          <p className="text-gray-400 mt-2">
            Sign in to control your RC car
          </p>
        </div>

        {/* =========================================================
            LOGIN FORM
            ========================================================= */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* =====================================================
                EMAIL FIELD
                ===================================================== */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                {/* Email icon */}
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                
                {/* Email input */}
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* =====================================================
                PASSWORD FIELD
                ===================================================== */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                {/* Lock icon */}
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                
                {/* Password input dengan dynamic type */}
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-400 transition-all"
                  placeholder="Enter your password"
                  required
                />
                
                {/* Show/hide password toggle button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* =====================================================
                ERROR MESSAGE DISPLAY
                ===================================================== */}
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* =====================================================
                SUBMIT BUTTON
                ===================================================== */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {loading ? (
                // Loading state dengan spinner
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                // Normal state
                <>
                  <Lock className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* =========================================================
            FOOTER
            ========================================================= */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            Secure authentication powered by Supabase
          </p>
        </div>
      </div>
    </div>
  );
};