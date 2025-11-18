
import React from 'react';
import { TOTAL_WEEKS } from '../constants.ts';

interface WeekRangeSelectorProps {
    weekRange: { start: number; end: number };
    setWeekRange: (range: { start: number; end: number }) => void;
}
export const WeekRangeSelector: React.FC<WeekRangeSelectorProps> = ({ weekRange, setWeekRange }) => {

    const handleUpdate = (type: 'start' | 'end', value: string) => {
        const week = parseInt(value, 10);
        const newRange = { ...weekRange, [type]: week };

        if (newRange.start > newRange.end) {
            if (type === 'start') {
                newRange.end = newRange.start;
            } else {
                newRange.start = newRange.end;
            }
        }
        setWeekRange(newRange);
    };

    const WeekDropdown: React.FC<{ id: string; value: number; type: 'start' | 'end' }> = ({ id, value, type }) => (
        <select
            id={id}
            value={value}
            onChange={(e) => handleUpdate(type, e.target.value)}
            className="w-20 bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-slate-200 text-center text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={type === 'start' ? "Start week" : "End week"}
        >
            {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map(weekNum => (
                <option key={weekNum} value={weekNum} className="font-normal bg-slate-800">
                    {weekNum}
                </option>
            ))}
        </select>
    );

    return (
        <div className="flex items-center justify-center space-x-2 p-2">
            <label htmlFor="start-week-input" className="text-base font-bold text-slate-200 tracking-wide">Weeks</label>
            <WeekDropdown id="start-week-input" value={weekRange.start} type="start" />
            <span className="text-slate-400">to</span>
            <WeekDropdown id="end-week-input" value={weekRange.end} type="end" />
            <span className="text-base text-slate-400 font-normal">of {TOTAL_WEEKS}</span>
        </div>
    );
};
