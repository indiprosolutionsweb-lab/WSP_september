import React from 'react';
import { Task, TaskStatus, Profile } from '../types';

interface DashboardProps {
    startWeek: number;
    endWeek: number;
    userTasks: Task[]; // Now a flat array of all tasks for the viewing user
    viewingUser: Profile;
}

const statusInfo: { [key in TaskStatus]: { label: string; color: string; textColor: string; borderColor: string; } } = {
    [TaskStatus.Complete]: {
        label: 'Complete',
        color: 'bg-green-500',
        textColor: 'text-green-300',
        borderColor: 'border-green-500',
    },
    [TaskStatus.Incomplete]: {
        label: 'Incomplete',
        color: 'bg-red-500',
        textColor: 'text-red-300',
        borderColor: 'border-red-500',
    },
    [TaskStatus.Additional]: {
        label: 'Additional',
        color: 'bg-blue-500',
        textColor: 'text-blue-300',
        borderColor: 'border-blue-500',
    },
};

const formatTime = (totalMinutes: number): string => {
    if (totalMinutes < 1) return '0m';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const hoursStr = hours > 0 ? `${hours}h` : '';
    const minutesStr = minutes > 0 ? ` ${minutes}m` : '';
    return `${hoursStr}${minutesStr}`.trim();
};

export const Dashboard: React.FC<DashboardProps> = ({ startWeek, endWeek, userTasks, viewingUser }) => {
    const stats = React.useMemo(() => {
        const counts = {
            [TaskStatus.Complete]: 0,
            [TaskStatus.Incomplete]: 0,
            [TaskStatus.Additional]: 0,
        };
        const timeStats = {
            totalTime: 0,
            byStatus: {
                [TaskStatus.Complete]: 0,
                [TaskStatus.Incomplete]: 0,
                [TaskStatus.Additional]: 0,
            }
        };
        let totalTasks = 0;
        
        const tasksInRange = userTasks.filter(task => task.week_number >= startWeek && task.week_number <= endWeek);

        for (const task of tasksInRange) {
             if (counts.hasOwnProperty(task.status)) {
                counts[task.status]++;
                totalTasks++;
                
                const time = task.time_taken || 0;
                timeStats.byStatus[task.status] += time;
                timeStats.totalTime += time;
            }
        }
        
        const percentages = {
            [TaskStatus.Complete]: totalTasks > 0 ? (counts[TaskStatus.Complete] / totalTasks) * 100 : 0,
            [TaskStatus.Incomplete]: totalTasks > 0 ? (counts[TaskStatus.Incomplete] / totalTasks) * 100 : 0,
            [TaskStatus.Additional]: totalTasks > 0 ? (counts[TaskStatus.Additional] / totalTasks) * 100 : 0,
        };

        return { counts, percentages, totalTasks, timeStats };
    }, [userTasks, startWeek, endWeek]);

    const title = startWeek === endWeek 
        ? `Week ${startWeek} Analysis for ${viewingUser.name}`
        : `Weeks ${startWeek}-${endWeek} Analysis for ${viewingUser.name}`;

    if (stats.totalTasks === 0) {
        return (
            <div className="text-center p-10 bg-slate-800/50 rounded-xl">
                <h2 className="text-2xl font-bold text-slate-300">{title}</h2>
                <p className="mt-4 text-slate-400">No tasks to analyze for this week range.</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 rounded-xl p-6 md:p-8">
            <h2 className="text-3xl font-bold text-slate-200 mb-6 text-center">{title}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-slate-800 p-6 rounded-lg shadow-lg border-l-4 border-slate-500">
                    <h3 className="text-xl font-semibold text-slate-300">Total Tasks</h3>
                    <p className="text-4xl font-bold text-white mt-2">{stats.totalTasks}</p>
                    <p className="text-slate-400 text-sm mt-1">For the selected range</p>
                </div>

                {(Object.keys(statusInfo) as TaskStatus[]).map(status => (
                    <div key={status} className={`bg-slate-800 p-6 rounded-lg shadow-lg border-l-4 ${statusInfo[status].borderColor}`}>
                        <h3 className={`text-xl font-semibold ${statusInfo[status].textColor}`}>{statusInfo[status].label} Tasks</h3>
                        <p className="text-4xl font-bold text-white mt-2">{stats.counts[status]}</p>
                        <p className="text-slate-400 text-sm mt-1">{stats.percentages[status].toFixed(1)}% of total</p>
                    </div>
                ))}
            </div>

            <div className="my-10">
                <h3 className="text-2xl font-bold text-slate-200 mb-4 text-center">Time Analysis</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                     <div className="bg-slate-900/70 p-6 rounded-lg shadow-lg border-l-4 border-purple-500 lg:col-span-1 sm:col-span-2">
                        <h3 className="text-xl font-semibold text-purple-300">Total Time Spent</h3>
                        <p className="text-4xl font-bold text-white mt-2">{formatTime(stats.timeStats.totalTime)}</p>
                    </div>
                    {(Object.keys(statusInfo) as TaskStatus[]).map(status => (
                        <div key={status} className={`bg-slate-800 p-6 rounded-lg shadow-lg border-l-4 ${statusInfo[status].borderColor}`}>
                            <h3 className={`text-xl font-semibold ${statusInfo[status].textColor}`}>Time on {statusInfo[status].label}</h3>
                            <p className="text-4xl font-bold text-white mt-2">{formatTime(stats.timeStats.byStatus[status])}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-2xl font-bold text-slate-200 mb-4 text-center">Task Status Distribution</h3>
                <div className="w-full bg-slate-700 rounded-lg p-6 flex justify-around items-end gap-4 h-80">
                    {(Object.keys(statusInfo) as TaskStatus[]).map(status => (
                        <div key={status} className="flex flex-col items-center h-full justify-end w-1/4">
                             <div className="text-white font-bold text-lg mb-1">{stats.percentages[status].toFixed(1)}%</div>
                            <div
                                className={`w-full rounded-t-md ${statusInfo[status].color} transition-all duration-500 ease-out`}
                                style={{ height: `${stats.percentages[status]}%` }}
                                title={`${statusInfo[status].label}: ${stats.percentages[status].toFixed(1)}%`}
                            ></div>
                            <p className="mt-2 text-slate-300 font-semibold">{statusInfo[status].label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
