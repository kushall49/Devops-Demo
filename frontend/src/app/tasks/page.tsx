'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { tasksAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, X, Trash2, Check, Filter, CheckSquare, Clock, AlertTriangle } from 'lucide-react';

interface Task { _id: string; title: string; description: string; completed: boolean; priority: 'low'|'medium'|'high'; dueDate: string|null; category: string; completedAt: string|null; }

const emptyForm = { title: '', description: '', priority: 'medium', dueDate: '', category: 'other' };
const PRIORITIES = ['low','medium','high'];
const CATEGORIES = ['work','personal','health','education','other'];

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all'|'pending'|'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const fetchTasks = useCallback(async () => {
    try {
      const [tasksRes, statsRes] = await Promise.all([tasksAPI.getAll(), tasksAPI.getStats()]);
      setTasks(tasksRes.data.tasks);
      setStats(statsRes.data.stats);
    } catch (err: any) {
      if (err.response?.status === 401) router.push('/');
      else toast.error('Failed to load tasks');
    } finally { setLoading(false); }
  }, [router]);

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/'); return; }
    fetchTasks();
  }, [fetchTasks, router]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Task title is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, dueDate: form.dueDate || undefined };
      const res = await tasksAPI.create(payload as any);
      setTasks(prev => [res.data.task, ...prev]);
      setStats((s: any) => s ? { ...s, total: s.total + 1, pending: s.pending + 1 } : s);
      toast.success('Task created!');
      setShowModal(false);
      setForm(emptyForm);
    } catch { toast.error('Failed to create task'); }
    finally { setSaving(false); }
  };

  const toggleComplete = async (task: Task) => {
    try {
      const res = await tasksAPI.update(task._id, { completed: !task.completed });
      setTasks(prev => prev.map(t => t._id === task._id ? res.data.task : t));
      setStats((s: any) => {
        if (!s) return s;
        const delta = task.completed ? -1 : 1;
        return { ...s, completed: s.completed + delta, pending: s.pending - delta, completionRate: Math.round(((s.completed + delta) / s.total) * 100) };
      });
      toast.success(task.completed ? 'Marked incomplete' : 'Task completed! 🎉');
    } catch { toast.error('Failed to update task'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await tasksAPI.delete(id);
      setTasks(prev => prev.filter(t => t._id !== id));
      setStats((s: any) => s ? { ...s, total: s.total - 1 } : s);
      toast.success('Task deleted');
    } catch { toast.error('Failed to delete task'); }
  };

  const filteredTasks = tasks.filter(t => {
    const statusOk = filter === 'all' || (filter === 'completed' ? t.completed : !t.completed);
    const priorityOk = priorityFilter === 'all' || t.priority === priorityFilter;
    return statusOk && priorityOk;
  });

  const priorityIcon = (p: string) => p === 'high' ? '🔴' : p === 'medium' ? '🟡' : '🟢';
  const priorityClass = (p: string) => p === 'high' ? 'priority-high' : p === 'medium' ? 'priority-medium' : 'priority-low';

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-indigo-400" />Tasks
            </h1>
            <p className="text-slate-400 text-sm mt-1">Manage your to-dos and track progress</p>
          </div>
          <button id="create-task-btn" onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" />New Task
          </button>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Total', value: stats.total, color: 'text-slate-300' },
              { label: 'Completed', value: stats.completed, color: 'text-emerald-400' },
              { label: 'Pending', value: stats.pending, color: 'text-amber-400' },
              { label: 'High Priority', value: stats.highPriority, color: 'text-red-400' },
              { label: 'Rate', value: `${stats.completionRate}%`, color: 'text-indigo-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card text-center py-3 px-2">
                <div className={`text-xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            {(['all','pending','completed'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                  filter === f ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50">
              <option value="all" className="bg-[#12121a]">All Priorities</option>
              {PRIORITIES.map(p => <option key={p} value={p} className="bg-[#12121a] capitalize">{p}</option>)}
            </select>
          </div>
          <span className="text-xs text-slate-500 ml-auto">{filteredTasks.length} tasks</span>
        </div>

        {/* Task List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-20 card">
            <CheckSquare className="w-12 h-12 mx-auto mb-4 text-slate-700" />
            <p className="text-slate-400 font-medium">No tasks found</p>
            <p className="text-slate-600 text-sm mt-1">
              {filter !== 'all' ? 'Try changing the filter.' : 'Create your first task to get started.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map(task => (
              <div key={task._id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all group animate-slide-up
                  ${task.completed ? 'bg-white/2 border-white/5 opacity-70' : 'bg-[#12121a] border-white/8 hover:border-white/15'}`}>
                {/* Complete checkbox */}
                <button id={`task-toggle-${task._id}`} onClick={() => toggleComplete(task)}
                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
                    ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 hover:border-indigo-500'}`}>
                  {task.completed && <Check className="w-3 h-3 text-white" />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-medium ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {task.title}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityClass(task.priority)}`}>
                      {priorityIcon(task.priority)} {task.priority}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-500 capitalize">{task.category}</span>
                  </div>
                  {task.description && (
                    <p className="text-xs text-slate-500 mt-1 truncate">{task.description}</p>
                  )}
                  {task.dueDate && (
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-slate-600" />
                      <span className={`text-xs ${new Date(task.dueDate) < new Date() && !task.completed ? 'text-red-400' : 'text-slate-500'}`}>
                        Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {new Date(task.dueDate) < new Date() && !task.completed && (
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                      )}
                    </div>
                  )}
                </div>

                {/* Delete */}
                <button id={`task-delete-${task._id}`} onClick={() => handleDelete(task._id)}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Task Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">New Task</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Task Title *</label>
                <input className="input-field" placeholder="What needs to be done?" value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))} autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                <textarea className="input-field resize-none" rows={2} placeholder="Optional notes..."
                  value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Priority</label>
                  <select className="input-field" value={form.priority}
                    onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                    {PRIORITIES.map(p => <option key={p} value={p} className="bg-[#12121a] capitalize">{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
                  <select className="input-field" value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#12121a] capitalize">{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Due Date</label>
                <input type="date" className="input-field" value={form.dueDate}
                  onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button id="save-task-btn" type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
