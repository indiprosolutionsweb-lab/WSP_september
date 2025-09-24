
import React, { useState, useEffect } from 'react';
import { TOTAL_WEEKS } from '../constants';

interface WeekRangeSelectorProps {
    weekRange: { start: number; end: number };
    setWeekRange: (range: { start: number; end: number }) => void;
}
export const WeekRangeSelector: React.FC<WeekRangeSelectorProps> = ({ weekRange, setWeekRange }) => {
    const [startInput, setStartInput] = useState(weekRange.start.toString());
    const [endInput, setEndInput] = useState(weekRange.end.toString());

    useEffect(() => {
        setStartInput(weekRange.start.toString());
        setEndInput(weekRange.end.toString());
    }, [weekRange]);

    const handleUpdate = (type: 'start' | 'end', value: string) => {
        let week = parseInt(value, 10);
        if (isNaN(week)) {
            if (type === 'start') setStartInput(weekRange.start.toString());
            else setEndInput(weekRange.end.toString());
            return;
        }
        week = Math.max(1, Math.min(TOTAL_WEEKS, week));
        const newRange = { ...weekRange, [type]: week };
        if (newRange.start > newRange.end) {
            if (type === 'start') newRange.end = newRange.start;
            else newRange.start = newRange.end;
        }
        setWeekRange(newRange);
    };
    
    const createHandler = (type: 'start' | 'end') => ({
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => (type === 'start' ? setStartInput : setEndInput)(e.target.value),
        onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { handleUpdate(type, e.currentTarget.value); e.currentTarget.blur(); } },
        onBlur: (e: React.FocusEvent<HTMLInputElement>) => handleUpdate(type, e.currentTarget.value)
    });

    return (
        <div className="flex items-center justify-center space-x-2 p-2">
            <label htmlFor="start-week-input" className="text-base font-bold text-slate-200 tracking-wide">Weeks</label>
            <input id="start-week-input" type="number" value={startInput} {...createHandler('start')} className="w-16 bg-slate-700 border border-slate-600 rounded-lg px-2 py-0.5 text-slate-100 text-center text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" min="1" max={TOTAL_WEEKS} aria-label="Start week" />
            <span className="text-slate-400">to</span>
            <input id="end-week-input" type="number" value={endInput} {...createHandler('end')} className="w-16 bg-slate-700 border border-slate-600 rounded-lg px-2 py-0.5 text-slate-100 text-center text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" min="1" max={TOTAL_WEEKS} aria-label="End week" />
            <span className="text-base text-slate-400 font-normal">of {TOTAL_WEEKS}</span>
        </div>
    );
};
