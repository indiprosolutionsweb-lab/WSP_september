
import React, { useMemo } from 'react';
import { TOTAL_WEEKS } from '../constants';

interface YearCalendarViewProps {
    financialYearStartDate: Date;
    financialYearString: string;
}

const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'long' });
};

export const YearCalendarView: React.FC<YearCalendarViewProps> = ({ financialYearStartDate, financialYearString }) => {
    const weeks = useMemo(() => {
        const weekData = [];
        for (let i = 0; i < TOTAL_WEEKS; i++) {
            const weekStartDate = new Date(financialYearStartDate);
            weekStartDate.setDate(weekStartDate.getDate() + i * 7);

            const weekEndDate = new Date(weekStartDate);
            weekEndDate.setDate(weekEndDate.getDate() + 6);

            weekData.push({
                week: i + 1,
                startDate: weekStartDate,
                endDate: weekEndDate,
            });
        }
        return weekData;
    }, [financialYearStartDate]);

    return (
        <div className="bg-slate-800/50 rounded-xl p-6 md:p-8 mt-4">
            <h2 className="text-3xl font-bold text-slate-200 mb-2 text-center">Year Calendar</h2>
            <p className="text-center text-slate-400 mb-6">{`Financial Year: ${financialYearString}`}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 max-h-[70vh] overflow-y-auto pr-2">
                {weeks.map(({ week, startDate, endDate }) => (
                    <div key={week} className="bg-slate-800 p-4 rounded-lg shadow-md border-l-4 border-slate-700 hover:border-blue-500 transition-colors">
                        <p className="text-slate-300 text-sm">
                            <span className="font-bold text-blue-400">Week {week}:</span> {formatDate(startDate)} to {formatDate(endDate)}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};
