
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Task, TaskStatus, Day, Profile } from '../types.ts';
import { DAYS } from '../constants.ts';

interface TaskDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task;
    allProfiles: Profile[];
    onUpdateTask: (updatedTask: Task) => void;
    onMoveToUpcoming: (task: Task) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ 
    isOpen, 
    onClose, 
    task, 
    allProfiles,
    onUpdateTask,
    onMoveToUpcoming
}) => {
    const modalRoot = document.getElementById('modal-root');
    const [moveSelection, setMoveSelection] = useState<string>(task.day);
    const [statusSelection, setStatusSelection] = useState<TaskStatus>(task.status);

    // Reset state when task changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setMoveSelection(task.day);
            setStatusSelection(task.status);
        }
    }, [isOpen, task]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !modalRoot) return null;

    const creatorName = task.created_by 
        ? allProfiles.find(p => p.id === task.created_by)?.name || 'Unknown User'
        : allProfiles.find(p => p.id === task.user_id)?.name || 'Unknown'; // Fallback for legacy tasks

    const formattedDate = new Date(task.created_at).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });

    const handleMoveChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setMoveSelection(e.target.value);
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStatusSelection(e.target.value as TaskStatus);
    };

    const handleSave = () => {
        if (moveSelection === 'Upcoming') {
            onMoveToUpcoming(task);
        } else {
            // Check if changes were made to Day or Status
            const newDay = moveSelection as Day;
            const newStatus = statusSelection;

            if (newDay !== task.day || newStatus !== task.status) {
                onUpdateTask({
                    ...task,
                    day: newDay,
                    status: newStatus
                });
            }
        }
        onClose();
    };

    // Logic: If incomplete/in-progress, show To Start/In Progress. If Complete, just Complete.
    const isComplete = task.status === TaskStatus.Complete;

    return createPortal(
        <div 
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-sm border border-slate-600 overflow-hidden animate-fade-in-scale"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-slate-700 px-4 py-3 border-b border-slate-600 flex justify-between items-center">
                    <h3 className="font-bold text-slate-200 text-lg truncate pr-4">Task Details</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-4 space-y-6">
                    {/* 1. Task Details */}
                    <div className="space-y-2">
                        <h4 className="text-xs uppercase tracking-wider text-slate-500 font-bold">Created info</h4>
                        <div className="bg-slate-700/50 p-3 rounded-md border border-slate-700 space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Created By:</span>
                                <span className="text-slate-200 font-medium">{creatorName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Date:</span>
                                <span className="text-slate-200">{formattedDate}</span>
                            </div>
                        </div>
                        <div className="p-2 text-slate-300 text-sm italic border-l-2 border-blue-500 bg-slate-700/30">
                            "{task.text}"
                        </div>
                    </div>

                    {/* 2. Move Task */}
                    <div className="space-y-2">
                        <h4 className="text-xs uppercase tracking-wider text-slate-500 font-bold">Move Task</h4>
                        <div className="relative">
                            <select
                                value={moveSelection}
                                onChange={handleMoveChange}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            >
                                <optgroup label="Days of Week">
                                    {DAYS.map(day => (
                                        <option key={day} value={day}>{day}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Other">
                                    <option value="Upcoming">Upcoming</option>
                                </optgroup>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* 3. Status */}
                    <div className="space-y-2">
                        <h4 className="text-xs uppercase tracking-wider text-slate-500 font-bold">Update Status</h4>
                        <div className="relative">
                            {isComplete ? (
                                <div className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-green-400 font-semibold flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Complete
                                </div>
                            ) : (
                                <>
                                    <select
                                        value={statusSelection}
                                        onChange={handleStatusChange}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    >
                                        <option value={TaskStatus.Incomplete}>To Start</option>
                                        <option value={TaskStatus.InProgress}>In Progress</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-slate-700/50 px-4 py-3 border-t border-slate-600 text-right">
                    <button 
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>,
        modalRoot
    );
};
