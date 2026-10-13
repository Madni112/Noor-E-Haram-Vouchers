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
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Overdue Warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 line-through';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs text-slate-800 space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <span>Automated Task Reminders &amp; Deadlines</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {tasks.filter(t => t.status !== 'Completed').length} Pending
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
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
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wider transition-all ${
                filter === f
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs italic">
            No active reminders under this filter. All operational checklists are on schedule!
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => handleToggle(task.id)}
              className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                task.status === 'Completed'
                  ? 'bg-slate-50/50 border-slate-200/50 opacity-60'
                  : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200/80 shadow-2xs'
              }`}
            >
              <div className="flex items-start gap-3">
                <div 
                  className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                    task.status === 'Completed'
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-300 hover:border-slate-600 bg-white'
                  }`}
                >
                  {task.status === 'Completed' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-slate-900">
                      {task.title}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase ${getStatusBadge(task.status)}`}>
                      {task.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span className="text-slate-800 font-semibold font-mono">
                      {task.partyName} ({task.partyHeadUid})
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>{task.category}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-600 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Due: {task.dueDate} ({task.deadlineHoursRemaining}h left)
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                  <User className="w-3.5 h-3.5 text-slate-400" />
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
