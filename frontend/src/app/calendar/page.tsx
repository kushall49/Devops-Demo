'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { eventsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Plus, X, Pencil, Trash2, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

interface CalEvent { _id: string; title: string; description: string; startDate: string; endDate: string; color: string; category: string; allDay: boolean; location: string; }

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f59e0b','#10b981','#3b82f6','#06b6d4'];
const CATEGORIES = ['work','personal','health','education','other'];
const emptyForm = { title: '', description: '', startDate: '', endDate: '', color: '#6366f1', category: 'other', allDay: false, location: '' };

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalEvent | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const month = format(currentDate, 'yyyy-MM');
      const res = await eventsAPI.getAll({ month });
      setEvents(res.data.events);
    } catch (err: any) {
      if (err.response?.status === 401) router.push('/');
      else toast.error('Failed to fetch events');
    } finally { setLoading(false); }
  }, [currentDate, router]);

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/'); return; }
    fetchEvents();
  }, [fetchEvents, router]);

  // Build calendar grid (6 rows × 7 days)
  const buildGrid = () => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    const days: Date[] = [];
    let d = start;
    while (d <= end) { days.push(d); d = addDays(d, 1); }
    return days;
  };

  const eventsForDay = (day: Date) =>
    events.filter(e => isSameDay(new Date(e.startDate), day));

  const openCreate = (day?: Date) => {
    setEditingEvent(null);
    const base = day ? format(day, "yyyy-MM-dd'T'HH:mm") : '';
    setForm({ ...emptyForm, startDate: base, endDate: base });
    setShowModal(true);
  };

  const openEdit = (ev: CalEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEvent(ev);
    setForm({
      title: ev.title, description: ev.description, startDate: format(new Date(ev.startDate), "yyyy-MM-dd'T'HH:mm"),
      endDate: format(new Date(ev.endDate), "yyyy-MM-dd'T'HH:mm"), color: ev.color,
      category: ev.category, allDay: ev.allDay, location: ev.location,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this event?')) return;
    try {
      await eventsAPI.delete(id);
      setEvents(prev => prev.filter(ev => ev._id !== id));
      toast.success('Event deleted');
    } catch { toast.error('Failed to delete event'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.startDate || !form.endDate) { toast.error('Dates are required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, startDate: new Date(form.startDate).toISOString(), endDate: new Date(form.endDate).toISOString() };
      if (editingEvent) {
        const res = await eventsAPI.update(editingEvent._id, payload);
        setEvents(prev => prev.map(ev => ev._id === editingEvent._id ? res.data.event : ev));
        toast.success('Event updated!');
      } else {
        const res = await eventsAPI.create(payload);
        setEvents(prev => [...prev, res.data.event]);
        toast.success('Event created!');
      }
      setShowModal(false);
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to save event');
    } finally { setSaving(false); }
  };

  const days = buildGrid();
  const weekDays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-indigo-400" /> Calendar
            </h1>
            <p className="text-slate-400 text-sm mt-1">Manage your schedule and events</p>
          </div>
          <button id="create-event-btn" onClick={() => openCreate()} className="btn-primary">
            <Plus className="w-4 h-4" /> New Event
          </button>
        </div>

        {/* Month Navigator */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-white">{format(currentDate, 'MMMM yyyy')}</h2>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-2">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => {
                const dayEvents = eventsForDay(day);
                const isToday = isSameDay(day, new Date());
                const inMonth = isSameMonth(day, currentDate);
                return (
                  <div key={i} onClick={() => openCreate(day)}
                    className={`calendar-day ${isToday ? 'today' : ''} ${!inMonth ? 'other-month' : ''}`}>
                    <span className={`text-xs font-medium block mb-1 w-6 h-6 flex items-center justify-center rounded-full
                      ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
                      {format(day, 'd')}
                    </span>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map(ev => (
                        <div key={ev._id} onClick={e => openEdit(ev, e)}
                          className="calendar-event-dot flex items-center justify-between group"
                          style={{ backgroundColor: ev.color + '22', color: ev.color, border: `1px solid ${ev.color}44` }}>
                          <span className="truncate flex-1 text-[10px]">{ev.title}</span>
                          <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
                            <button onClick={e => { e.stopPropagation(); openEdit(ev, e); }}
                              className="p-0.5 rounded hover:bg-white/10"><Pencil className="w-2.5 h-2.5" /></button>
                            <button onClick={e => handleDelete(ev._id, e)}
                              className="p-0.5 rounded hover:bg-white/10"><Trash2 className="w-2.5 h-2.5" /></button>
                          </div>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[9px] text-slate-500 pl-1">+{dayEvents.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Event Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">{editingEvent ? 'Edit Event' : 'New Event'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Title *</label>
                <input className="input-field" placeholder="Event title" value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Start Date *</label>
                  <input type="datetime-local" className="input-field" value={form.startDate}
                    onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">End Date *</label>
                  <input type="datetime-local" className="input-field" value={form.endDate}
                    onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
                  <select className="input-field" value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#12121a]">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Color</label>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                <textarea className="input-field resize-none" rows={2} placeholder="Optional description..."
                  value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Location</label>
                <input className="input-field" placeholder="Optional location..." value={form.location}
                  onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button id="save-event-btn" type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
