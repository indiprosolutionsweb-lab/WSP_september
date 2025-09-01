
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TOTAL_WEEKS } from '../constants';

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
    
    const handleWeekChange = (setter: React.Dispatch<React.SetStateAction<number>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value)) {
            setter(Math.max(1, Math.min(TOTAL_WEEKS, value)));
        } else {
            setter(1); 
        }
    };
    
    const isValidRange = startWeek <= endWeek;

    const handleConfirmClick = () => {
        if (isValidRange) {
            onConfirm(startWeek, endWeek);
            onClose();
        }
    };
    
    const modalContent = (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4 transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold text-slate-100 mb-4">Download Tasks</h2>
                <p className="text-slate-300 mb-6">Select the range of weeks you want to export to a CSV file.</p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                     <div className="flex items-center gap-2">
                        <label htmlFor="start-week-modal" className="font-semibold text-slate-300">From Week:</label>
                        <input
                            id="start-week-modal"
                            type="number"
                            value={startWeek}
                            onChange={handleWeekChange(setStartWeek)}
                            className="w-20 bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-slate-100 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="1"
                            max={TOTAL_WEEKS}
                            aria-label="Start week for download"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="end-week-modal" className="font-semibold text-slate-300">To Week:</label>
                        <input
                            id="end-week-modal"
                            type="number"
                            value={endWeek}
                            onChange={handleWeekChange(setEndWeek)}
                            className="w-20 bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-slate-100 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="1"
                            max={TOTAL_WEEKS}
                            aria-label="End week for download"
                        />
                    </div>
                </div>
                 {!isValidRange && (
                    <p className="text-center text-red-400 text-sm mb-4 -mt-2">Start week must be less than or equal to end week.</p>
                )}

                <div className="flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md font-semibold text-sm bg-slate-600 text-slate-200 hover:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirmClick}
                        disabled={!isValidRange}
                        autoFocus
                        className="px-4 py-2 rounded-md font-semibold text-sm bg-green-600 text-white hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-slate-500 disabled:cursor-not-allowed"
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