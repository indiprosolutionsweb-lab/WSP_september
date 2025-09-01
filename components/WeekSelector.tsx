import React, { useState, useEffect } from 'react';
import { TOTAL_WEEKS } from '../constants';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface WeekSelectorProps {
    currentWeek: number;
    setCurrentWeek: (week: number) => void;
}

export const WeekSelector: React.FC<WeekSelectorProps> = ({ currentWeek, setCurrentWeek }) => {
    const [inputWeek, setInputWeek] = useState<string>(currentWeek.toString());

    // Sync local input state when the currentWeek prop changes from parent
    useEffect(() => {
        setInputWeek(currentWeek.toString());
    }, [currentWeek]);

    const handlePrevWeek = () => {
        setCurrentWeek(currentWeek > 1 ? currentWeek - 1 : TOTAL_WEEKS);
    };

    const handleNextWeek = () => {
        setCurrentWeek(currentWeek < TOTAL_WEEKS ? currentWeek + 1 : 1);
    };

    const handleGoToWeek = () => {
        let week = parseInt(inputWeek, 10);
        if (isNaN(week)) {
            setInputWeek(currentWeek.toString()); // Reset to current week if input is invalid
            return;
        }

        // Clamp the week number to be within the valid range
        if (week < 1) week = 1;
        if (week > TOTAL_WEEKS) week = TOTAL_WEEKS;

        setCurrentWeek(week);
        // The useEffect hook will sync the input field if the value was clamped or was invalid.
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputWeek(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleGoToWeek();
            (e.target as HTMLInputElement).blur(); // Remove focus from input for better UX
        }
    };
    
    // Hides the default spinner arrows on number inputs for a cleaner look
    // This is now handled globally in index.html

    return (
        <div className="flex items-center justify-center space-x-2 md:space-x-4 p-2">
            <button
                onClick={handlePrevWeek}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                aria-label="Previous week"
            >
                <ChevronLeftIcon />
            </button>
            
            <div className="flex items-center justify-center space-x-1.5">
                <label htmlFor="week-input" className="text-base font-bold text-slate-200 tracking-wide">
                    Week
                </label>
                <input
                    id="week-input"
                    type="number"
                    value={inputWeek}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onBlur={handleGoToWeek} // Update when input loses focus
                    className={`w-16 bg-slate-700 border border-slate-600 rounded-lg px-2 py-0.5 text-slate-100 text-center text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    min="1"
                    max={TOTAL_WEEKS}
                    aria-label={`Current week, edit to jump to a week`}
                />
                 <span className="text-base text-slate-400 font-normal">of {TOTAL_WEEKS}</span>
            </div>

            <button
                onClick={handleNextWeek}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                aria-label="Next week"
            >
                <ChevronRightIcon />
            </button>
        </div>
    );
};