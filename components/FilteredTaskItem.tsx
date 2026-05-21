
import React from 'react';
import { Task, TaskStatus } from '../types.ts';

interface FilteredTaskItemProps {
    task: Task;
}

const statusStyles: { [key in TaskStatus]: { text: string; bg: string; } } = {
    [TaskStatus.Incomplete]: { text: 'text-red-200', bg: 'bg-red-900/50' },
    [TaskStatus.InProgress]: { text: 'text-orange-200', bg: 'bg-orange-900/50' },
    [TaskStatus.Complete]: { text: 'text-green-200', bg: 'bg-green-900/50' },
    [TaskStatus.Additional]: { text: 'text-blue-200', bg: 'bg-blue-900/50' },
};

export const FilteredTaskItem: React.FC<FilteredTaskItemProps> = ({ task }) => {
    const { week_number, day, text, status } = task;
    const style = statusStyles[status];
    const gridCols = "grid-cols-[1fr_2fr_7fr_2fr]";

    return (
        <div className={`grid ${gridCols} gap-4 items-center bg-slate-700 p-3 rounded-lg text-sm text-slate-300 border border-slate-600`}>
            <div className="font-semibold text-center">{week_number}</div>
            <div>{day}</div>
            <div className="whitespace-pre-wrap break-words">{text}</div>
            <div className="flex justify-center">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${style.text} ${style.bg}`}>{status}</span>
            </div>
        </div>
    );
};
