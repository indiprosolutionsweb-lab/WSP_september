
import React, { useState } from 'react';
import { UnplannedTask, TaskStatus, Day } from '../types.ts';
import { TrashIcon, StarIcon } from './icons.tsx';
import { DAYS, TOTAL_WEEKS, isTimeTrackingEnabled } from '../constants.ts';

interface UnplannedTaskItemProps {
    task: UnplannedTask;
    onUpdateTask: (updatedTask: UnplannedTask) => void;
    onDeleteTask: (taskId: string) => void;
    onPlanTask: (task: UnplannedTask, week: number, day: Day) => void;
    currentWeek: number;
}

const statusStyles: { [key in TaskStatus]: { select: string; border: string; } } = {
    [TaskStatus.Incomplete]: { select: 'bg-red-900/40 text-red-200', border: 'border-l-4 border-red-500' },
    [TaskStatus.InProgress]: { select: 'bg-orange-900/40 text-orange-200', border: 'border-l-4 border-orange-500' },
    [TaskStatus.Complete]: { select: 'bg-green-900/40 text-green-200', border: 'border-l-4 border-green-500' },
    [TaskStatus.Additional]: { select: 'bg-blue-900/40 text-blue-200', border: 'border-l-4 border-blue-500' },
};

export const UnplannedTaskItem: React.FC<UnplannedTaskItemProps> = ({ task, onUpdateTask, onDeleteTask, onPlanTask, currentWeek }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(task.text);
    const [planWeek, setPlanWeek] = useState<string>(currentWeek.toString());
    const [planDay, setPlanDay] = useState<Day | ''>('');

    const handleSaveEdit = () => {
        if (editText.trim() && editText.trim() !== task.text) onUpdateTask({ ...task, text: editText.trim() });
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); }
        else if (e.key === 'Escape') { setEditText(task.text); setIsEditing(false); }
    };
    
    const handlePlan = () => {
        const weekNum = parseInt(planWeek, 10);
        if (planDay && !isNaN(weekNum) && weekNum >= 1 && weekNum <= TOTAL_WEEKS) {
            onPlanTask(task, weekNum, planDay);
        }
    };

    return (
        <div className={`p-3 bg-slate-700 rounded-lg shadow-md mb-3 flex flex-col transition-all duration-200 ${statusStyles[task.status].border} ${task.is_priority ? 'ring-2 ring-yellow-400/70' : ''}`}>
            {isEditing ? (
                 <textarea value={editText} onChange={(e) => setEditText(e.target.value)} onBlur={handleSaveEdit} onKeyDown={handleKeyDown} autoFocus className="w-full bg-slate-600 border border-slate-500 rounded-md p-2 mb-2 text-slate-200 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-blue-500" rows={3} />
            ) : (
                <div className="flex-grow text-slate-200 text-sm whitespace-normal break-words" onDoubleClick={() => setIsEditing(true)}>
                    {task.text}
                </div>
            )}
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-600">
                <div className="flex items-center space-x-2">
                     <select value={task.status} onChange={(e) => onUpdateTask({ ...task, status: e.target.value as TaskStatus })} className={`rounded px-1 py-0.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-slate-500 ${statusStyles[task.status].select}`} aria-label="Task status">
                        {Object.values(TaskStatus).map(status => <option key={status} value={status} className="bg-slate-700 text-slate-200">{status}</option>)}
                    </select>
                    {isTimeTrackingEnabled && <input type="number" value={task.time_taken || ''} onChange={(e) => onUpdateTask({ ...task, time_taken: parseInt(e.target.value, 10) || 0 })} className="w-12 bg-slate-600 rounded text-slate-200 text-center py-0.5 px-1 text-xs" min="0" placeholder="Time" />}
                     <button onClick={() => onUpdateTask({ ...task, is_priority: !task.is_priority })} className={`p-1 rounded-full transition-colors ${task.is_priority ? 'text-yellow-500 hover:text-yellow-400' : 'text-slate-500 hover:text-yellow-500'}`} title="Toggle priority"><StarIcon filled={!!task.is_priority} /></button>
                    <button onClick={() => onDeleteTask(task.id)} className="p-1 text-slate-500 hover:text-red-500 hover:bg-red-900/30 rounded-full" aria-label="Delete task"><TrashIcon /></button>
                </div>
                <div className="flex items-center gap-2">
                    <select value={planWeek} onChange={(e) => setPlanWeek(e.target.value)} className="w-28 bg-slate-600 border border-slate-500 rounded-md px-2 py-1 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" aria-label="Select week">
                        {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map(weekNum => <option key={weekNum} value={weekNum}>Week {weekNum}</option>)}
                    </select>
                    <select value={planDay} onChange={(e) => setPlanDay(e.target.value as Day)} className="bg-slate-600 border border-slate-500 rounded-md px-2 py-1 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="">Day</option>
                        {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
                    </select>
                    <button onClick={handlePlan} disabled={!planDay || !planWeek} className="bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1 rounded-md transition-colors text-xs disabled:bg-slate-600 disabled:cursor-not-allowed">Plan</button>
                </div>
            </div>
        </div>
    );
};
