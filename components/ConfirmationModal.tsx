
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: React.ReactNode;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
    const modalRoot = document.getElementById('modal-root');

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

    const modalContent = (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4 transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
                onClick={e => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
                <h2 className="text-xl font-bold text-slate-100 mb-4">{title}</h2>
                <div className="text-slate-300 mb-6">
                    {message}
                </div>
                <div className="flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md font-semibold text-sm bg-slate-600 text-slate-200 hover:bg-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        autoFocus
                        className="px-4 py-2 rounded-md font-semibold text-sm bg-red-600 text-white hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                    >
                        Confirm Delete
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