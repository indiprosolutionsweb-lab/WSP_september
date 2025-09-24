
import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, Profile } from '../types';
import { WeekRangeSelector } from './WeekRangeSelector';
import { FilteredTaskItem } from './FilteredTaskItem';
import { DAYS, isTimeTrackingEnabled } from '../constants';

interface TasksListViewProps {
    userTasks: Task[];
    viewingUser: Profile;
    initialWeek: number;
}

export const TasksListView: React.FC<TasksListViewProps> = ({ userTasks, viewingUser, initialWeek }) => {
    const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
    const [weekRange, setWeekRange] = useState({ start: initialWeek, end: initialWeek });

    const filteredTasks = useMemo(() => {
        return userTasks
            .filter(task => 
                (task.week_number >= weekRange.start && task.week_number <= weekRange.end) &&
                (statusFilter === 'all' || task.status === statusFilter)
            )
            .sort((a, b) => {
                if (a.week_number !== b.week_number) return a.week_number - b.week_number;
                const dayIndexA = DAYS.indexOf(a.day);
                const dayIndexB = DAYS.indexOf(b.day);
                if (dayIndexA !== dayIndexB) return dayIndexA - dayIndexB;
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            });
    }, [userTasks, statusFilter, weekRange]);

    const headerGridCols = isTimeTrackingEnabled ? "grid-cols-[1fr_2fr_6fr_2fr_1fr]" : "grid-cols-[1fr_2fr_7fr_2fr]";

    return (
        <div className="bg-slate-800/50 rounded-xl p-6 md:p-8 mt-4 flex-grow flex flex-col">
            <h2 className="text-3xl font-bold text-slate-200 mb-6 text-center">Tasks List for {viewingUser.name}</h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6 bg-slate-800 p-4 rounded-lg shadow-lg">
                <div className="flex items-center gap-2">
                    <label htmlFor="status-filter" className="font-semibold text-slate-300">Status:</label>
                    <select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')} className="bg-slate-700 border border-slate-600 rounded-md px-3 py-1.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="all">All</option>
                        {Object.values(TaskStatus).map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                </div>
                <WeekRangeSelector weekRange={weekRange} setWeekRange={setWeekRange} />
            </div>
            <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                {filteredTasks.length > 0 ? (
                    <div className="space-y-2">
                        <div className={`grid ${headerGridCols} gap-4 items-center bg-slate-900/70 p-3 rounded-lg font-bold text-slate-400 text-sm sticky top-0 z-10`}>
                            <div className="text-center">Wk</div>
                            <div>Day</div>
                            <div>Task Description</div>
                            <div className="text-center">Status</div>
                            {isTimeTrackingEnabled && <div className="text-center">Time</div>}
                        </div>
                        {filteredTasks.map(task => <FilteredTaskItem key={task.id} task={task} />)}
                    </div>
                ) : (
                    <div className="text-center py-10 text-slate-400 bg-slate-800 rounded-lg">
                        <p className="text-lg">No tasks found for the selected criteria.</p>
                        <p className="mt-2">Try adjusting the status or week range filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
