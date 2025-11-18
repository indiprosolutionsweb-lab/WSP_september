import React from 'react';
import { TOTAL_WEEKS } from '../constants.ts';
import { ChevronLeftIcon, ChevronRightIcon } from './icons.tsx';

interface WeekSelectorProps {
    currentWeek: number;
    setCurrentWeek: (week: number) => void;
}

export const WeekSelector: React.FC<WeekSelectorProps> = ({ currentWeek, setCurrentWeek }) => {
    const handlePrevWeek = () => {
        setCurrentWeek(currentWeek > 1 ? currentWeek - 1 : TOTAL_WEEKS);
    };

    const handleNextWeek = () => {
        setCurrentWeek(currentWeek < TOTAL_WEEKS ? currentWeek + 1 : 1);
    };

    return (
        <div className="flex items-center justify-center space-x-2 md:space-x-4 p-2">
            <button
                onClick={handlePrevWeek}
                className="p-1 rounded-full text-slate-500 hover:bg-sky-200 hover:text-slate-800 transition-colors"
                aria-label="Previous week"
            >
                <ChevronLeftIcon />
            </button>
            
            <div className="flex items-center justify-center space-x-1.5">
                <label htmlFor="week-input" className="text-base font-bold text-slate-800 tracking-wide">
                    Week
                </label>
                <select
                    id="week-input"
                    value={currentWeek}
                    onChange={(e) => setCurrentWeek(parseInt(e.target.value, 10))}
                    className="w-20 bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800 text-center text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={`Current week, select to jump to a week`}
                >
                    {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map(weekNum => (
                        <option key={weekNum} value={weekNum} className="font-normal bg-white">
                            {weekNum}
                        </option>
                    ))}
                </select>
                 <span className="text-base text-slate-500 font-normal">of {TOTAL_WEEKS}</span>
            </div>

            <button
                onClick={handleNextWeek}
                className="p-1 rounded-full text-slate-500 hover:bg-sky-200 hover:text-slate-800 transition-colors"
                aria-label="Next week"
            >
                <ChevronRightIcon />
            </button>
        </div>
    );
};
