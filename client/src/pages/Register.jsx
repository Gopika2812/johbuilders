import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Lock, Mail, User, Eye, EyeOff, Loader2 } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(name, email, password);
      // Automatically navigates to dashboard. If not approved, guard displays pending screen.
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#050907] font-sans selection:bg-[#006838] selection:text-white">
      {/* Dynamic Background Layer */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-[#0a140f]/80 to-[#006838]/30 z-10"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay animate-[pulse_10s_ease-in-out_infinite] transform scale-105" 
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80')" }}
        ></div>
      </div>

      {/* Decorative Animated Shapes for Depth */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#006838]/20 rounded-full blur-[120px] animate-[pulse_8s_ease-in-out_infinite_alternate]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[100px] animate-[pulse_6s_ease-in-out_infinite_alternate-reverse]"></div>

      <div className="relative z-20 w-full max-w-lg p-6 animate-fadeIn">
        
        {/* Luxury Logo Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl mb-6 transform hover:scale-105 transition-transform duration-500">
            <Building2 className="w-8 h-8 text-emerald-400" strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-light text-white tracking-wide mb-3">
            Create <span className="font-bold italic text-emerald-400">Account</span>
          </h1>
          <p className="text-gray-400 font-light tracking-wider text-xs uppercase">
            Register as a Builders ERP Employee
          </p>
        </div>

        {/* Glassmorphism Register Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden group">
          {/* Subtle internal reflection effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-200 rounded-2xl text-xs font-semibold text-center backdrop-blur-md animate-fade-in-up">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-2">Full Name</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within/input:text-emerald-400 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/5 text-white placeholder-gray-600 rounded-2xl focus:outline-none focus:border-emerald-500/50 focus:bg-black/60 focus:ring-1 focus:ring-emerald-500/50 transition-all duration-300 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-2">Email Address</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within/input:text-emerald-400 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="john.doe@example.com"
                  className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/5 text-white placeholder-gray-600 rounded-2xl focus:outline-none focus:border-emerald-500/50 focus:bg-black/60 focus:ring-1 focus:ring-emerald-500/50 transition-all duration-300 text-sm"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-2">Password</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within/input:text-emerald-400 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-4 bg-black/40 border border-white/5 text-white placeholder-gray-600 rounded-2xl focus:outline-none focus:border-emerald-500/50 focus:bg-black/60 focus:ring-1 focus:ring-emerald-500/50 transition-all duration-300 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 hover:text-emerald-400 transition focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#006838] to-[#008c4a] hover:from-[#007b42] hover:to-[#00a356] text-white rounded-2xl font-bold text-sm tracking-widest uppercase transition-all duration-300 shadow-[0_0_20px_rgba(0,104,56,0.3)] hover:shadow-[0_0_30px_rgba(0,104,56,0.6)] flex items-center justify-center gap-3 group/btn relative overflow-hidden disabled:opacity-50"
              >
                <div className="absolute inset-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover/btn:animate-[shine_1s_ease-in-out]"></div>
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Register'
                )}
              </button>
            </div>

            <div className="pt-6 text-center">
              <p className="text-gray-400 text-xs font-light">
                Already have an account?{' '}
                <Link to="/login" className="text-emerald-400 font-bold hover:text-emerald-300 hover:underline transition-colors">
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
