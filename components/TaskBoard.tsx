
import React, { useMemo } from 'react';
import { Day, Task } from '../types';
import { DAYS } from '../constants';
import { DayColumn } from './DayColumn';

interface TaskBoardProps {
    currentWeek: number;
    tasks: Task[]; // Now a flat array of all tasks for the viewing user
    onAddTask: (week: number, day: Day, taskText: string) => void;
    onUpdateTask: (updatedTask: Task) => void;
    onDeleteTask: (taskId: string) => void;
    canEditTasks: boolean;
    canAddTask: boolean;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ currentWeek, tasks, onAddTask, onUpdateTask, onDeleteTask, canEditTasks, canAddTask }) => {
    
    const weekTasksByDay = useMemo(() => {
        const tasksForWeek = tasks.filter(task => task.week_number === currentWeek);
        const groupedTasks: { [key in Day]?: Task[] } = {};
        for (const task of tasksForWeek) {
            if (!groupedTasks[task.day]) {
                groupedTasks[task.day] = [];
            }
            groupedTasks[task.day]!.push(task);
        }
        return groupedTasks;
    }, [currentWeek, tasks]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2 p-2 md:p-3 lg:p-4 flex-grow min-h-0">
            {DAYS.map(day => (
                <DayColumn 
                    key={day}
                    day={day}
                    tasks={weekTasksByDay[day] || []}
                    onAddTask={(d, taskText) => onAddTask(currentWeek, d, taskText)}
                    onUpdateTask={onUpdateTask}
                    onDeleteTask={onDeleteTask}
                    canEditTasks={canEditTasks}
                    canAddTask={canAddTask}
                />
            ))}
        </div>
    );
};
