import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Loader2, ArrowRight } from 'lucide-react';
import { API_URL } from '../../context/AuthContext';

const CustomerLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/customer-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid credentials. Please try again.');

      // Store in customer specific token
      localStorage.setItem('customerToken', data.token);
      localStorage.setItem('customerUsername', data.username);
      
      navigate('/portal/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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

      <div className={`relative z-20 w-full max-w-lg p-6 transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
        
        {/* Luxury Logo Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl mb-6 transform hover:scale-105 transition-transform duration-500">
            <User className="w-8 h-8 text-emerald-400" strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-light text-white tracking-wide mb-3">
            Welcome <span className="font-bold italic text-emerald-400">Back</span>
          </h1>
          <p className="text-gray-400 font-light tracking-wider text-xs uppercase">
            Exclusive Client Portal Access
          </p>
        </div>

        {/* Glassmorphism Login Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden group">
          {/* Subtle internal reflection effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-200 rounded-2xl text-xs font-semibold text-center backdrop-blur-md animate-fade-in-up">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-2">Username / Phone</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within/input:text-emerald-400 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your registered ID"
                  className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/5 text-white placeholder-gray-600 rounded-2xl focus:outline-none focus:border-emerald-500/50 focus:bg-black/60 focus:ring-1 focus:ring-emerald-500/50 transition-all duration-300 text-sm"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-2">Access Code</label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within/input:text-emerald-400 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your secure password"
                  className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/5 text-white placeholder-gray-600 rounded-2xl focus:outline-none focus:border-emerald-500/50 focus:bg-black/60 focus:ring-1 focus:ring-emerald-500/50 transition-all duration-300 text-sm"
                  required
                />
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#006838] to-[#008c4a] hover:from-[#007b42] hover:to-[#00a356] text-white rounded-2xl font-bold text-sm tracking-widest uppercase transition-all duration-300 shadow-[0_0_20px_rgba(0,104,56,0.3)] hover:shadow-[0_0_30px_rgba(0,104,56,0.6)] flex items-center justify-center gap-3 group/btn relative overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover/btn:animate-[shine_1s_ease-in-out]"></div>
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Sign In Securely
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>

            <div className="pt-4 text-center">
              <p className="text-gray-400 text-xs font-light">
                Employee? <Link to="/login" className="text-emerald-400 font-bold hover:text-emerald-300 hover:underline transition-colors">ERP Login</Link>
              </p>
            </div>
          </form>
        </div>

        {/* Footer Brand */}
        <div className="mt-12 text-center opacity-60 hover:opacity-100 transition-opacity duration-300 cursor-default">
          <div className="text-gray-400 font-black text-xl tracking-tighter">
            JOHN<span className="font-light text-gray-500">BUILDWELL</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 font-light tracking-widest uppercase">
            &copy; {new Date().getFullYear()} John Buildwell India
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;
