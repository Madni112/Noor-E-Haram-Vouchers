'use client';

import { useState } from 'react';
import { 
  Bell, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  User, 
  ArrowRight, 
  Filter, 
  Check, 
  ShieldAlert 
} from 'lucide-react';
import { toggleTaskCompleted } from '../../lib/erpData';

export default function RemindersPanel({ tasks = [], onTasksUpdated }) {
  const [filter, setFilter] = useState('ALL');

  const handleToggle = (taskId) => {
    const updated = toggleTaskCompleted(taskId);
    if (onTasksUpdated) onTasksUpdated(updated);
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'PENDING') return t.status !== 'Completed';
    if (filter === 'COMPLETED') return t.status === 'Completed';
    if (filter === 'URGENT') return t.status === 'Urgent' || t.status === 'Overdue Warning';
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Urgent':
        return 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse';
      case 'Overdue Warning':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Completed':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 line-through';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  return (
    <div className="bg-slate-900 border border-emerald-900/60 rounded-xl p-5 shadow-xl text-white space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-800/40 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-400/20">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <span>Automated Task Reminders &amp; Deadlines</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-800/80 text-emerald-200">
                {tasks.filter(t => t.status !== 'Completed').length} Pending
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Automated operational cutoff triggers for visas, hotels, flights &amp; payment collections
            </p>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {['ALL', 'URGENT', 'PENDING', 'COMPLETED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider transition-all ${
                filter === f
                  ? 'bg-amber-400 text-emerald-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs italic">
            No active reminders under this filter. All operational checklists are on schedule!
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => handleToggle(task.id)}
              className={`flex items-start justify-between gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                task.status === 'Completed'
                  ? 'bg-slate-950/40 border-slate-800/80 opacity-60'
                  : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80 hover:border-emerald-600/50 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <div 
                  className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    task.status === 'Completed'
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'border-slate-500 hover:border-amber-400'
                  }`}
                >
                  {task.status === 'Completed' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-slate-100">
                      {task.title}
                    </span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase ${getStatusBadge(task.status)}`}>
                      {task.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[10.5px] text-slate-400 flex-wrap">
                    <span className="text-amber-300 font-bold font-mono">
                      {task.partyName} ({task.partyHeadUid})
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300">{task.category}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-emerald-300 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Due: {task.dueDate} ({task.deadlineHoursRemaining}h left)
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {task.assignedTo}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
