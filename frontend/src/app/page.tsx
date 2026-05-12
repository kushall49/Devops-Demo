'use client';

// ============================================================
// LOGIN / REGISTER PAGE (Home Page)
// This is the entry point. Users can switch between
// Login and Register forms.
// ============================================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import { Calendar, CheckSquare, BarChart3, Eye, EyeOff, Zap } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '' });

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (localStorage.getItem('token')) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (mode === 'login') {
        res = await authAPI.login({ email: form.email, password: form.password });
      } else {
        if (!form.username.trim()) { toast.error('Username is required'); setLoading(false); return; }
        res = await authAPI.register({ username: form.username, email: form.email, password: form.password });
      }
      // Save token and user to localStorage
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success(mode === 'login' ? 'Welcome back! 👋' : 'Account created! 🎉');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Calendar, label: 'Smart Calendar', desc: 'Manage events visually' },
    { icon: CheckSquare, label: 'Task Tracking', desc: 'Stay on top of todos' },
    { icon: BarChart3, label: 'Live Monitoring', desc: 'Prometheus + Grafana' },
    { icon: Zap, label: 'CI/CD Pipeline', desc: 'GitHub Actions ready' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* ---- LEFT PANEL: Branding ---- */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background gradient blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-indigo-500/10 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">SmartCal</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl font-bold text-white leading-tight mb-6">
            Your Intelligent
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Calendar & Task
            </span>
            <br />
            Manager
          </h1>
          <p className="text-slate-400 text-lg mb-12 leading-relaxed">
            A full-stack DevOps demo with Prometheus monitoring,
            Grafana dashboards, and a complete CI/CD pipeline.
          </p>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-4">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/8">
                <div className="w-9 h-9 bg-indigo-600/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-200">{label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech stack pills */}
        <div className="relative z-10 flex flex-wrap gap-2">
          {['Next.js', 'Node.js', 'MongoDB', 'Docker', 'Prometheus', 'Grafana', 'GitHub Actions'].map((t) => (
            <span key={t} className="px-3 py-1 text-xs font-medium bg-white/5 border border-white/10 rounded-full text-slate-400">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* ---- RIGHT PANEL: Auth Form ---- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">SmartCal</span>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 mb-8">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  mode === m
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="bg-[#12121a] border border-white/8 rounded-2xl p-8 shadow-2xl animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-2">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-slate-400 text-sm mb-8">
              {mode === 'login'
                ? 'Sign in to access your calendar and tasks.'
                : 'Join SmartCal to get started — it\'s free!'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="johndoe"
                    value={form.username}
                    onChange={handleChange}
                    className="input-field"
                    autoComplete="username"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="input-field"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="input-field pr-12"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="auth-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed
                           text-white font-semibold py-3 rounded-xl transition-all duration-200 mt-2
                           flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path d="M4 12a8 8 0 018-8v8z" fill="currentColor" className="opacity-75" />
                    </svg>
                    {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                  </span>
                ) : (
                  mode === 'login' ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            {/* Demo credentials hint */}
            <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <p className="text-xs text-indigo-300 font-medium mb-1">🎯 Demo Credentials</p>
              <p className="text-xs text-slate-400">Email: <code className="text-indigo-300">demo@smartcal.dev</code></p>
              <p className="text-xs text-slate-400">Password: <code className="text-indigo-300">demo1234</code></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
