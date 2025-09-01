
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FocusNote } from '../types';

interface FocusViewProps {
    note: FocusNote | null;
    onSave: (note: { focus_text: string | null; pointers_text: string | null }) => void;
}


// A simple debounce hook implemented within the component
const useDebounce = (callback: (...args: any[]) => void, delay: number) => {
    const timeoutRef = useRef<number | null>(null);

    return (...args: any[]) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = window.setTimeout(() => {
            callback(...args);
        }, delay);
    };
};

export const FocusView: React.FC<FocusViewProps> = ({ note, onSave }) => {
    const [focusText, setFocusText] = useState('');
    const [pointersText, setPointersText] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    // This ref helps prevent the initial save on first render
    const isInitialMount = useRef(true);

    useEffect(() => {
        if (note) {
            setFocusText(note.focus_text || '');
            setPointersText(note.pointers_text || '');
        }
        // Set initial mount to false after the first render
        const timer = setTimeout(() => {
            isInitialMount.current = false;
        }, 500);
        return () => clearTimeout(timer);
    }, [note]);

    const debouncedSave = useCallback(useDebounce((newFocus: string, newPointers: string) => {
        if (isInitialMount.current) return;
        setIsSaving(true);
        onSave({ focus_text: newFocus, pointers_text: newPointers });
        // Simulate save time for user feedback
        setTimeout(() => setIsSaving(false), 700);
    }, 1000), [onSave]);


    const handleFocusChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;
        setFocusText(newText);
        debouncedSave(newText, pointersText);
    };

    const handlePointersChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;
        setPointersText(newText);
        debouncedSave(focusText, newText);
    };

    return (
        <div className="bg-slate-800/50 rounded-xl p-6 md:p-8 mt-4 flex-grow flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-slate-200">My Focus</h2>
                 <div className={`text-sm transition-opacity duration-300 ${isSaving ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="text-slate-400 italic">Saving...</span>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
                {/* Main Focus Area */}
                <div className="lg:col-span-2 flex flex-col">
                    <label htmlFor="focus-text" className="text-lg font-semibold text-blue-300 mb-2">
                        My Focus (Week/Month/Year)
                    </label>
                    <textarea
                        id="focus-text"
                        value={focusText}
                        onChange={handleFocusChange}
                        className="flex-grow w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        aria-label="Main focus notes"
                    />
                </div>

                {/* Pointers/Notes Area */}
                <div className="lg:col-span-1 flex flex-col">
                     <label htmlFor="pointers-text" className="text-lg font-semibold text-purple-300 mb-2">
                        Pointers / Notes
                    </label>
                    <textarea
                        id="pointers-text"
                        value={pointersText}
                        onChange={handlePointersChange}
                        className="flex-grow w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        aria-label="Pointers and quick notes"
                    />
                </div>
            </div>
        </div>
    );
};
