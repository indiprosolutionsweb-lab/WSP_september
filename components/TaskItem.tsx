

import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';
import { TrashIcon, StarIcon } from './icons';
import { isTimeTrackingEnabled } from '../constants';

interface TaskItemProps {
    task: Task;
    onUpdateTask: (updatedTask: Task) => void;
    onDeleteTask: (taskId: string) => void;
    canEdit: boolean;
}

const statusStyles: { [key in TaskStatus]: { select: string; border: string; } } = {
    [TaskStatus.Incomplete]: { select: 'bg-red-900/50 text-red-300', border: 'border-l-4 border-red-500' },
    [TaskStatus.Complete]: { select: 'bg-green-900/50 text-green-300', border: 'border-l-4 border-green-500' },
    [TaskStatus.Additional]: { select: 'bg-blue-900/50 text-blue-300', border: 'border-l-4 border-blue-500' },
};

export const TaskItem: React.FC<TaskItemProps> = ({ task, onUpdateTask, onDeleteTask, canEdit }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(task.text);

    const handleDoubleClick = () => {
        if (!canEdit) return;
        setIsEditing(true);
        setEditText(task.text); // Ensure we're editing the latest version
    };

    const handleSaveEdit = () => {
        if (editText.trim() && editText.trim() !== task.text) {
            onUpdateTask({ ...task, text: editText.trim() });
        } else if (!editText.trim()) {
            // Revert to original text if submitted empty
            setEditText(task.text);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSaveEdit();
        } else if (e.key === 'Escape') {
            setEditText(task.text);
            setIsEditing(false);
        }
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onUpdateTask({ ...task, status: e.target.value as TaskStatus });
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseInt(e.target.value, 10);
        onUpdateTask({ ...task, time_taken: isNaN(time) ? 0 : Math.max(0, time) });
    };
    
    const handlePriorityToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if(canEdit) {
            onUpdateTask({ ...task, is_priority: !task.is_priority });
        }
    }

    const disabledClass = canEdit ? '' : 'disabled:opacity-50 disabled:cursor-not-allowed';

    return (
        <div 
            className={`p-1.5 bg-slate-800 rounded-lg shadow-md mb-1.5 flex flex-col transition-all duration-200 hover:bg-slate-700/80 ${isEditing ? 'cursor-default' : 'cursor-pointer'} ${statusStyles[task.status].border} ${task.is_priority ? 'ring-2 ring-yellow-500/50' : ''}`}
            onClick={() => !isEditing && setIsExpanded(prev => !prev)}
            onDoubleClick={handleDoubleClick}
            aria-expanded={isExpanded}
        >
            {isEditing ? (
                 <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={handleSaveEdit}
                    onKeyDown={handleKeyDown}
                    onClick={(e) => e.stopPropagation()} // Prevent card collapse on click inside textarea
                    autoFocus
                    className="w-full bg-slate-600 border border-slate-500 rounded-md p-1 mb-2 text-slate-100 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={Math.max(2, Math.min(6, editText.split('\n').length))}
                />
            ) : (
                <div className={`flex-grow text-slate-200 text-sm ${isExpanded ? 'whitespace-normal break-words' : 'task-line-clamp'}`} title={task.text}>
                    {task.text}
                </div>
            )}
            
            <div className="flex items-center justify-between pt-1 border-t border-slate-700/50" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center space-x-1">
                    <select
                        value={task.status}
                        onChange={handleStatusChange}
                        disabled={!canEdit}
                        className={`rounded px-0.5 py-px text-[11px] focus:outline-none focus:ring-1 focus:ring-slate-500 transition-colors ${statusStyles[task.status].select} ${disabledClass}`}
                        aria-label="Task status"
                    >
                        {Object.values(TaskStatus).map(status => (
                            <option key={status} value={status} className="bg-slate-900 text-white font-normal">
                                {status}
                            </option>
                        ))}
                    </select>

                    {isTimeTrackingEnabled && (
                        <input
                            type="number"
                            value={task.time_taken || ''}
                            onChange={handleTimeChange}
                            disabled={!canEdit}
                            className={`w-8 bg-slate-700/60 rounded text-slate-100 text-center py-px px-0.5 text-[11px] focus:outline-none ${disabledClass}`}
                            min="0"
                            placeholder="Time"
                            aria-label="Time taken in minutes"
                        />
                    )}
                </div>
                
                {canEdit && (
                    <div className="flex items-center gap-0.5">
                        <button
                            onClick={handlePriorityToggle}
                            className={`p-px rounded-full transition-colors ${task.is_priority ? 'text-yellow-400 hover:text-yellow-300' : 'text-slate-500 hover:text-yellow-400'}`}
                            aria-label="Toggle task priority"
                            title="Toggle priority"
                        >
                            <StarIcon filled={!!task.is_priority} />
                        </button>
                        <button
                            onClick={() => onDeleteTask(task.id)}
                            className="p-px text-slate-500 hover:text-red-500 hover:bg-red-900/50 rounded-full transition-colors"
                            aria-label="Delete task"
                        >
                            <TrashIcon />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
