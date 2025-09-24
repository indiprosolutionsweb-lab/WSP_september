
import React, { useState } from 'react';
import { UnplannedTask, Day } from '../types';
import { UnplannedTaskItem } from './UnplannedTaskItem';
import { PlusIcon } from './icons';

interface UnplannedTasksViewProps {
    unplannedTasks: UnplannedTask[];
    onAddTask: (text: string) => void;
    onUpdateTask: (updatedTask: UnplannedTask) => void;
    onDeleteTask: (taskId: string) => void;
    onPlanTask: (task: UnplannedTask, week: number, day: Day) => void;
    currentWeek: number;
}

export const UnplannedTasksView: React.FC<UnplannedTasksViewProps> = ({ unplannedTasks, onAddTask, onUpdateTask, onDeleteTask, onPlanTask, currentWeek }) => {
    const [newTaskText, setNewTaskText] = useState('');

    const handleAddTask = () => {
        if (newTaskText.trim()) {
            onAddTask(newTaskText.trim());
            setNewTaskText('');
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAddTask();
        }
    };

    return (
        <div className="bg-slate-800/50 rounded-xl p-6 md:p-8 mt-4 flex-grow flex flex-col">
            <h2 className="text-3xl font-bold text-slate-200 mb-6 text-center">Upcoming Task List</h2>
            <div className="mb-6 bg-slate-800 p-4 rounded-lg shadow-lg">
                 <label htmlFor="new-unplanned-task" className="block text-lg font-semibold text-slate-300 mb-2">Add a new task</label>
                 <div className="flex items-start gap-3">
                    <textarea id="new-unplanned-task" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} onKeyDown={handleKeyDown} placeholder="Enter task details..." className="flex-grow bg-slate-700 border border-slate-600 rounded-lg p-2 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[40px]" rows={2} />
                    <button onClick={handleAddTask} className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded-lg flex items-center justify-center transition-colors shrink-0" aria-label="Add task"><PlusIcon className="h-5 w-5" /></button>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                {unplannedTasks.length > 0 ? (
                    [...unplannedTasks].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(task => (
                        <UnplannedTaskItem key={task.id} task={task} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask} onPlanTask={onPlanTask} currentWeek={currentWeek} />
                    ))
                ) : (
                    <div className="text-center py-10 text-slate-400">
                        <p>Your upcoming task list is empty.</p>
                        <p>Add tasks above to get started!</p>
                    </div>
                )}
            </div>
        </div>
    );
};
