
import React from 'react';
import { Task, TaskStatus } from '../types.ts';
import { isTimeTrackingEnabled } from '../constants.ts';

interface FilteredTaskItemProps {
    task: Task;
}

const statusStyles: { [key in TaskStatus]: { text: string; bg: string; } } = {
    [TaskStatus.Incomplete]: { text: 'text-red-200', bg: 'bg-red-900/50' },
    [TaskStatus.Complete]: { text: 'text-green-200', bg: 'bg-green-900/50' },
    [TaskStatus.Additional]: { text: 'text-blue-200', bg: 'bg-blue-900/50' },
};

const formatTime = (totalMinutes: number): string => {
    if (totalMinutes < 1) return '-';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const hoursStr = hours > 0 ? `${hours}h` : '';
    const minutesStr = minutes > 0 ? ` ${minutes}m` : '';
    return `${hoursStr}${minutesStr}`.trim();
};

export const FilteredTaskItem: React.FC<FilteredTaskItemProps> = ({ task }) => {
    const { week_number, day, text, status, time_taken } = task;
    const style = statusStyles[status];
    const gridCols = isTimeTrackingEnabled ? "grid-cols-[1fr_2fr_6fr_2fr_1fr]" : "grid-cols-[1fr_2fr_7fr_2fr]";

    return (
        <div className={`grid ${gridCols} gap-4 items-center bg-slate-700 p-3 rounded-lg text-sm text-slate-300 border border-slate-600`}>
            <div className="font-semibold text-center">{week_number}</div>
            <div>{day}</div>
            <div className="whitespace-pre-wrap break-words">{text}</div>
            <div className="flex justify-center">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${style.text} ${style.bg}`}>{status}</span>
            </div>
            {isTimeTrackingEnabled && <div className="text-center">{formatTime(time_taken)}</div>}
        </div>
    );
};
