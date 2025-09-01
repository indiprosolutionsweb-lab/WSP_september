import React, { useState } from 'react';
import { Task, Profile, Day, WeekTasks } from '../types';
import { DAYS } from '../constants';
import { DownloadModal } from './DownloadModal';

interface DownloadTasksProps {
    allTasks: Task[] | undefined; // Flat array for the viewing user
    viewingUser: Profile;
    initialStartWeek: number;
    initialEndWeek: number;
}

const escapeCsvField = (field: string | number): string => {
    // Replace newlines with a space to keep each task on a single line within a cell
    const str = String(field).replace(/(\r\n|\n|\r)/gm, " "); 
    // If the string contains a comma or a double quote, wrap it in double quotes
    if (str.includes(',') || str.includes('"')) {
        // Escape any existing double quotes by doubling them up
        const escapedStr = str.replace(/"/g, '""');
        return `"${escapedStr}"`;
    }
    return str;
};

export const DownloadTasks: React.FC<DownloadTasksProps> = ({ allTasks, viewingUser, initialStartWeek, initialEndWeek }) => {
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    const handleDownload = (startWeek: number, endWeek: number) => {
        if (!allTasks || isDownloading) return;

        setIsDownloading(true);

        const tasksByWeek: { [week: number]: WeekTasks } = {};
        for (const task of allTasks) {
            if (task.week_number >= startWeek && task.week_number <= endWeek) {
                if (!tasksByWeek[task.week_number]) {
                    tasksByWeek[task.week_number] = {};
                }
                if (!tasksByWeek[task.week_number][task.day]) {
                    tasksByWeek[task.week_number][task.day] = [];
                }
                tasksByWeek[task.week_number][task.day]!.push(task);
            }
        }

        const csvRows: string[] = [];
        
        csvRows.push(`User Name:,${escapeCsvField(viewingUser.name)}`);
        csvRows.push(`Week Range:,${startWeek} to ${endWeek}`);
        csvRows.push("");

        for (let week = startWeek; week <= endWeek; week++) {
            const weekTasks = tasksByWeek[week];
            
            csvRows.push(`Week:,${week}`);
            
            const dayHeaders = ["", ...DAYS.flatMap(day => [
                escapeCsvField(day),
                escapeCsvField('Status'),
                escapeCsvField('Time (m)')
            ])];
            csvRows.push(dayHeaders.join(","));

            if (weekTasks && Object.keys(weekTasks).length > 0) {
                let maxTasksPerDay = 0;
                DAYS.forEach(day => {
                    const tasksOnDay = weekTasks[day as Day];
                    if (tasksOnDay && tasksOnDay.length > maxTasksPerDay) {
                        maxTasksPerDay = tasksOnDay.length;
                    }
                });

                if (maxTasksPerDay === 0) {
                     csvRows.push(",No tasks for this week.");
                } else {
                    for (let i = 0; i < maxTasksPerDay; i++) {
                        const taskRow: string[] = [`Task ${i + 1}`];
                        
                        DAYS.forEach(day => {
                            const task = weekTasks[day as Day]?.[i];
                            if (task) {
                                taskRow.push(escapeCsvField(task.text));
                                taskRow.push(escapeCsvField(task.status));
                                taskRow.push(escapeCsvField(task.time_taken));
                            } else {
                                taskRow.push("", "", "");
                            }
                        });
                        csvRows.push(taskRow.join(","));
                    }
                }
            } else {
                csvRows.push(",No tasks for this week.");
            }
            csvRows.push(""); 
        }

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        
        const fileName = `wsp_table_${viewingUser.name.replace(/\s+/g, '_')}_W${startWeek}-W${endWeek}.csv`;
        link.setAttribute("download", fileName);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => setIsDownloading(false), 500);
    };

    return (
        <>
            <div className="flex items-center justify-center">
                <button
                    onClick={() => setIsModalOpen(true)}
                    disabled={isDownloading}
                    className="px-2 py-1 rounded-md font-semibold text-sm transition-colors bg-green-600 text-white shadow-md hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isDownloading ? 'Processing...' : 'Download'}
                </button>
            </div>
            <DownloadModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleDownload}
                initialStartWeek={initialStartWeek}
                initialEndWeek={initialEndWeek}
            />
        </>
    );
};
