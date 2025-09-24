
import React, { useState } from 'react';
import { Day, Task } from '../types.ts';
import { TaskItem } from './TaskItem.tsx';
import { PlusIcon } from './icons.tsx';

interface DayColumnProps {
    day: Day;
    tasks: Task[];
    onAddTask: (day: Day, taskText: string) => void;
    onUpdateTask: (updatedTask: Task) => void;
    onDeleteTask: (taskId: string) => void;
    canEditTasks: boolean;
    canAddTask: boolean;
}

export const DayColumn: React.FC<DayColumnProps> = ({ day, tasks, onAddTask, onUpdateTask, onDeleteTask, canEditTasks, canAddTask }) => {
    const [newTaskText, setNewTaskText] = useState('');

    const handleAddTask = () => {
        if (newTaskText.trim()) {
            onAddTask(day, newTaskText.trim());
            setNewTaskText('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleAddTask();
        }
    };

    return (
        <div className="bg-slate-800/50 rounded-xl p-1.5 flex flex-col h-full min-h-[300px]">
            <h2 className="text-lg font-bold text-slate-300 mb-1.5 text-center border-b-2 border-slate-700 pb-1.5">{day}</h2>
            <div className="flex-grow overflow-y-auto pr-1.5">
                {tasks.map(task => (
                    <TaskItem 
                        key={task.id} 
                        task={task}
                        onUpdateTask={onUpdateTask}
                        onDeleteTask={onDeleteTask}
                        canEdit={canEditTasks}
                    />
                ))}
            </div>
            {canAddTask && (
                <div className="mt-2 flex items-center space-x-2 pt-2 border-t border-slate-700/50">
                    <input
                        type="text"
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Add task..."
                        className="min-w-0 flex-grow bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleAddTask}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-1.5 rounded-lg flex items-center justify-center transition-colors shrink-0"
                        aria-label="Add task"
                    >
                        <PlusIcon className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
};
