
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TOTAL_WEEKS } from '../constants.ts';

interface DownloadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (startWeek: number, endWeek: number) => void;
    initialStartWeek: number;
    initialEndWeek: number;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose, onConfirm, initialStartWeek, initialEndWeek }) => {
    const [startWeek, setStartWeek] = useState<number>(initialStartWeek);
    const [endWeek, setEndWeek] = useState<number>(initialEndWeek);
    const modalRoot = document.getElementById('modal-root');

    useEffect(() => {
        if (isOpen) {
            setStartWeek(initialStartWeek);
            setEndWeek(initialEndWeek);
        }
    }, [isOpen, initialStartWeek, initialEndWeek]);
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);


    if (!isOpen || !modalRoot) return null;
    
    const handleStartWeekChange = (week: number) => {
        setStartWeek(week);
        if (week > endWeek) {
            setEndWeek(week);
        }
    };

    const handleEndWeekChange = (week: number) => {
        setEndWeek(week);
        if (week < startWeek) {
            setStartWeek(week);
        }
    };

    const handleConfirmClick = () => {
        onConfirm(startWeek, endWeek);
        onClose();
    };

    const WeekDropdown: React.FC<{ id: string, value: number, onChange: (val: number) => void, label: string }> = ({ id, value, onChange, label }) => (
         <select
            id={id}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value, 10))}
            className="w-24 bg-slate-100 border border-slate-300 rounded-lg px-2 py-1 text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={label}
        >
            {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map(weekNum => (
                <option key={weekNum} value={weekNum} className="font-normal bg-white">
                    {weekNum}
                </option>
            ))}
        </select>
    );
    
    const modalContent = (
        <div 
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold text-slate-900 mb-4">Download Tasks</h2>
                <p className="text-slate-600 mb-6">Select the range of weeks you want to export to a CSV file.</p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                     <div className="flex items-center gap-2">
                        <label htmlFor="start-week-modal" className="font-semibold text-slate-700">From Week:</label>
                        <WeekDropdown id="start-week-modal" value={startWeek} onChange={handleStartWeekChange} label="Start week for download" />
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="end-week-modal" className="font-semibold text-slate-700">To Week:</label>
                        <WeekDropdown id="end-week-modal" value={endWeek} onChange={handleEndWeekChange} label="End week for download" />
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md font-semibold text-sm bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirmClick}
                        autoFocus
                        className="px-4 py-2 rounded-md font-semibold text-sm bg-green-600 text-white hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
                    >
                        Download
                    </button>
                </div>
            </div>
             <style>{`
                @keyframes fade-in-scale {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                .animate-fade-in-scale {
                    animation: fade-in-scale 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );

    return createPortal(modalContent, modalRoot);
};
