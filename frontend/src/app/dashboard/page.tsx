'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { tasksAPI, eventsAPI, healthAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { CheckSquare, Calendar, TrendingUp, Activity, Cpu, Database, Server, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface Stats { total: number; completed: number; pending: number; highPriority: number; completionRate: number; }
interface HealthData { status: string; uptime: { formatted: string }; services: { api: { status: string }; database: { status: string; connection: string } }; system: { memory: { rss: string; heapUsed: string }; cpu: { cores: number } } }

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, eventsRes, tasksRes, healthRes] = await Promise.all([
        tasksAPI.getStats(),
        eventsAPI.getAll(),
        tasksAPI.getAll(),
        healthAPI.getStatus(),
      ]);
      setStats(statsRes.data.stats);
      const now = new Date();
      setUpcomingEvents(eventsRes.data.events.filter((e: any) => new Date(e.startDate) >= now).slice(0, 5));
      setRecentTasks(tasksRes.data.tasks.slice(0, 5));
      setHealth(healthRes.data);
    } catch (err: any) {
      if (err.response?.status === 401) router.push('/');
      else toast.error('Failed to load dashboard data');
    } finally { setLoading(false); }
  }, [router]);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!localStorage.getItem('token')) { router.push('/'); return; }
    if (stored) setUser(JSON.parse(stored));
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [router, fetchData]);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f]"><Navbar />
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center"><div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading dashboard...</p></div></div></div>
  );

  const statCards = [
    { label: 'Total Tasks', value: stats?.total ?? 0, icon: CheckSquare, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    { label: 'Completed', value: stats?.completed ?? 0, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Pending', value: stats?.pending ?? 0, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { label: 'Upcoming Events', value: upcomingEvents.length, icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  ];

  const isHealthy = (s: string) => s === 'healthy' || s === 'connected';

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.username} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">Here's your productivity overview</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, color, bg, border }) => (
            <div key={label} className={`card border ${border} animate-slide-up`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">{label}</span>
                <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
              </div>
              <div className={`text-3xl font-bold ${color}`}>{value}</div>
              {label === 'Completed' && stats && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Completion rate</span><span>{stats.completionRate}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${stats.completionRate}%` }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Upcoming Events */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title mb-0">📅 Upcoming Events</h2>
              <a href="/calendar" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">View all →</a>
            </div>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No upcoming events</p>
                <a href="/calendar" className="text-xs text-indigo-400 mt-2 inline-block hover:underline">Add your first event →</a>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event._id} className="flex items-center gap-4 p-3 bg-white/3 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                    <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: event.color || '#6366f1' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{event.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(event.startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-white/5 rounded-lg text-slate-400 capitalize flex-shrink-0">{event.category}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Tasks */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title mb-0">✅ Recent Tasks</h2>
              <a href="/tasks" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">View all →</a>
            </div>
            {recentTasks.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No tasks yet</p>
                <a href="/tasks" className="text-xs text-indigo-400 mt-2 inline-block hover:underline">Create a task →</a>
              </div>
            ) : (
              <div className="space-y-2">
                {recentTasks.map((task) => (
                  <div key={task._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/3 transition-all group">
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                      {task.completed && <svg className="w-3 h-3 text-white m-auto" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>}
                    </div>
                    <span className={`text-sm flex-1 truncate ${task.completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>{task.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium priority-${task.priority}`}>{task.priority}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* System Health */}
        {health && (
          <div className="card">
            <h2 className="section-title">🏥 System Health Status</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* API Status */}
              <div className="p-4 bg-white/3 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Server className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">API Server</span>
                </div>
                <div className="flex items-center gap-2">
                  {isHealthy(health.services.api.status)
                    ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                    : <AlertCircle className="w-5 h-5 text-red-400" />}
                  <span className={`text-sm font-semibold capitalize ${isHealthy(health.services.api.status) ? 'text-emerald-400' : 'text-red-400'}`}>
                    {health.services.api.status}
                  </span>
                </div>
              </div>

              {/* DB Status */}
              <div className="p-4 bg-white/3 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Database</span>
                </div>
                <div className="flex items-center gap-2">
                  {isHealthy(health.services.database.connection)
                    ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                    : <AlertCircle className="w-5 h-5 text-red-400" />}
                  <span className={`text-sm font-semibold capitalize ${isHealthy(health.services.database.connection) ? 'text-emerald-400' : 'text-red-400'}`}>
                    {health.services.database.connection}
                  </span>
                </div>
              </div>

              {/* Uptime */}
              <div className="p-4 bg-white/3 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Uptime</span>
                </div>
                <span className="text-sm font-semibold text-indigo-400">{health.uptime.formatted}</span>
              </div>

              {/* Memory */}
              <div className="p-4 bg-white/3 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Memory (Heap)</span>
                </div>
                <span className="text-sm font-semibold text-purple-400">{health.system.memory.heapUsed}</span>
              </div>
            </div>

            {/* Monitoring Links */}
            <div className="mt-4 flex flex-wrap gap-3">
              <a href="http://localhost:9090" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl text-sm text-orange-400 hover:bg-orange-500/20 transition-all">
                <Activity className="w-4 h-4" />Open Prometheus
              </a>
              <a href="http://localhost:3001" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-sm text-yellow-400 hover:bg-yellow-500/20 transition-all">
                📊 Open Grafana
              </a>
              <a href="http://localhost:5000/metrics" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-400 hover:bg-blue-500/20 transition-all">
                🔍 Raw Metrics
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
