'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Calendar, CheckSquare, LayoutDashboard, LogOut, Menu, X, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserInfo { id: string; username: string; email: string; }

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    router.push('/');
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/calendar',  label: 'Calendar',  icon: Calendar },
    { href: '/tasks',     label: 'Tasks',      icon: CheckSquare },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-sm">SmartCal</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href} id={`nav-${label.toLowerCase()}`}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    active ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                           : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
                  <Icon className="w-4 h-4" />{label}
                </Link>
              );
            })}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* Monitoring links */}
            <div className="hidden lg:flex items-center gap-2">
              <a href="http://localhost:9090" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-orange-400 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-all">
                <Activity className="w-3 h-3" />Prometheus
              </a>
              <a href="http://localhost:3001" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 transition-all">
                📊 Grafana
              </a>
            </div>

            {/* User badge */}
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/[0.08]">
                <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{user.username.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-sm text-slate-300 font-medium">{user.username}</span>
              </div>
            )}

            {/* Logout */}
            <button id="logout-btn" onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>

            {/* Mobile toggle */}
            <button className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-white/5"
              onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/5 py-3 animate-fade-in">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium mb-1 ${
                  pathname === href ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                <Icon className="w-4 h-4" />{label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
