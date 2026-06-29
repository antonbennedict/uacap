'use client';

import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Heart, Eye, EyeOff, Loader2, Shield, Activity, Users,
  FileText, ChevronRight, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const STATS = [
  { label: 'Registered Members', value: '4.2M+', color: '#00843D' },
  { label: 'Partner Clinics', value: '12,400+', color: '#1D4ED8' },
  { label: 'Daily Consultations', value: '98,000+', color: '#7C3AED' },
];

const FEATURES = [
  { icon: Shield, label: 'PhilHealth Certified', desc: 'Compliant with PHIC standards' },
  { icon: Activity, label: 'Real-time Sync', desc: 'Live data with PhilHealth servers' },
  { icon: Users, label: 'YAKAP Program', desc: 'Outpatient benefit management' },
  { icon: FileText, label: 'Complete EMR', desc: 'End-to-end clinical documentation' },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        username,
        password,
      });

      if (result?.error) {
        setError('Invalid username or password. Please try again.');
        toast.error('Authentication failed');
      } else {
        toast.success('Welcome back! Redirecting...');
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Left Panel — Branding */}
      <div
        className="hidden lg:flex lg:w-[55%] flex-col relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #050d1a 0%, #0A1628 40%, #0d2040 70%, #0a1e35 100%)',
        }}
      >
        {/* Animated background grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />

        {/* Glowing orbs */}
        <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,132,61,0.15) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-100px] right-[-80px] w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(29,78,216,0.2) 0%, transparent 70%)' }} />
        <div className="absolute top-[45%] right-[10%] w-[200px] h-[200px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />

        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #00843D, #00a84f)' }}>
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl tracking-tight">UACAP</h1>
              <p className="text-white/40 text-xs tracking-wide">PhilHealth EMR Portal</p>
            </div>
          </div>

          {/* Main hero text */}
          <div className="my-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
              style={{ background: 'rgba(0,132,61,0.15)', border: '1px solid rgba(0,132,61,0.3)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs font-semibold tracking-wider uppercase">System Online</span>
            </div>

            <h2 className="text-white text-4xl font-bold leading-tight mb-4">
              Healthcare <span style={{ color: '#00843D' }}>Simplified.</span><br />
              Patients <span style={{ color: '#3B82F6' }}>Empowered.</span>
            </h2>
            <p className="text-white/50 text-base leading-relaxed max-w-md mb-10">
              The official PhilHealth outpatient EMR system connecting patients,
              physicians, and healthcare facilities under the YAKAP program.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-10">
              {STATS.map((stat) => (
                <div key={stat.label} className="rounded-2xl p-4"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-white/40 text-xs leading-snug">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(0,132,61,0.15)', border: '1px solid rgba(0,132,61,0.25)' }}>
                    <Icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{label}</p>
                    <p className="text-white/35 text-xs">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-auto pt-8 border-t border-white/10">
            <p className="text-white/25 text-xs">© 2026 Philippine Health Insurance Corporation</p>
            <div className="flex items-center gap-2 text-white/25 text-xs">
              <Shield className="w-3 h-3" />
              <span>ISO 27001 · HIPAA Compliant</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative"
        style={{ background: '#f8fafc' }}>

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #00843D, #00a84f)' }}>
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900">eKonsulta</h1>
            <p className="text-gray-400 text-xs">PhilHealth EMR Portal</p>
          </div>
        </div>

        <div className={`w-full max-w-md transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Card */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
            style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)' }}>

            {/* Card top accent */}
            <div className="h-1" style={{ background: 'linear-gradient(90deg, #00843D, #1D4ED8, #7C3AED)' }} />

            <div className="p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
                <p className="text-gray-500 text-sm">Sign in to access the eKonsulta portal</p>
              </div>

              {/* Demo credentials hint */}
              <div className="flex items-start gap-3 p-4 rounded-2xl mb-6"
                style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#dcfce7' }}>
                  <Shield className="w-4 h-4" style={{ color: '#16a34a' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#15803d' }}>Demo Credentials</p>
                  <p className="text-xs mt-0.5" style={{ color: '#4ade80' }}>
                    Username: <code className="font-mono font-bold">admin</code> &nbsp;|&nbsp;
                    Password: <code className="font-mono font-bold">admin123</code>
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    Username or Employee ID
                  </label>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(''); }}
                    placeholder="Enter your username"
                    className="w-full px-4 py-3 text-sm border rounded-xl transition-all duration-200 outline-none"
                    style={{
                      border: error ? '1.5px solid #fca5a5' : '1.5px solid #e5e7eb',
                      background: '#f9fafb',
                      color: '#111827',
                    }}
                    onFocus={(e) => {
                      if (!error) e.target.style.border = '1.5px solid #00843D';
                      e.target.style.boxShadow = '0 0 0 3px rgba(0,132,61,0.1)';
                      e.target.style.background = '#fff';
                    }}
                    onBlur={(e) => {
                      e.target.style.border = error ? '1.5px solid #fca5a5' : '1.5px solid #e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 pr-12 text-sm border rounded-xl transition-all duration-200 outline-none"
                      style={{
                        border: error ? '1.5px solid #fca5a5' : '1.5px solid #e5e7eb',
                        background: '#f9fafb',
                        color: '#111827',
                      }}
                      onFocus={(e) => {
                        if (!error) e.target.style.border = '1.5px solid #00843D';
                        e.target.style.boxShadow = '0 0 0 3px rgba(0,132,61,0.1)';
                        e.target.style.background = '#fff';
                      }}
                      onBlur={(e) => {
                        e.target.style.border = error ? '1.5px solid #fca5a5' : '1.5px solid #e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl"
                    style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Remember & forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      id="remember"
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                      style={{ accentColor: '#00843D' }}
                    />
                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                      Remember me
                    </span>
                  </label>
                  <button type="button" className="text-sm font-medium transition-colors"
                    style={{ color: '#00843D' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#005c2b')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#00843D')}>
                    Forgot password?
                  </button>
                </div>

                {/* Submit button */}
                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={loading || !username || !password}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: loading || !username || !password
                      ? 'linear-gradient(135deg, #6b7280, #9ca3af)'
                      : 'linear-gradient(135deg, #00843D, #006b32)',
                    color: 'white',
                    boxShadow: loading || !username || !password
                      ? 'none'
                      : '0 4px 20px rgba(0,132,61,0.35)',
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Sign In to Portal
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Card bottom */}
            <div className="px-8 py-5 border-t border-gray-100"
              style={{ background: '#f9fafb' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-gray-500">PhilHealth PHIC Gateway</span>
                </div>
                <span className="text-xs text-gray-400">v2026.1.0 · NCR Division</span>
              </div>
            </div>
          </div>

          {/* Additional info */}
          <p className="text-center text-xs text-gray-400 mt-6 leading-relaxed">
            Authorized personnel only. All sessions are monitored and logged<br />
            in accordance with PhilHealth Data Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
