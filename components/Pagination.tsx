
import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons.tsx';

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (totalPages <= 1) {
        return null;
    }

    const handlePrev = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5;
        const half = Math.floor(maxPagesToShow / 2);

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            let start = Math.max(1, currentPage - half);
            let end = Math.min(totalPages, currentPage + half);

            if (currentPage <= half) {
                end = maxPagesToShow;
            }
            if (currentPage + half >= totalPages) {
                start = totalPages - maxPagesToShow + 1;
            }

            if (start > 1) {
                pages.push(1, '...');
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (end < totalPages) {
                pages.push('...', totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="flex items-center justify-between pt-4 border-t border-slate-600 text-sm">
            <div className="text-slate-400">
                Showing{' '}
                <span className="font-semibold text-slate-200">
                    {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-200">
                    {Math.min(currentPage * itemsPerPage, totalItems)}
                </span>{' '}
                of <span className="font-semibold text-slate-200">{totalItems}</span> results
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={handlePrev}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-md text-slate-400 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    aria-label="Previous page"
                >
                    <ChevronLeftIcon />
                </button>

                {getPageNumbers().map((page, index) =>
                    typeof page === 'number' ? (
                        <button
                            key={index}
                            onClick={() => onPageChange(page)}
                            className={`px-3 py-1 rounded-md transition-colors ${
                                page === currentPage
                                    ? 'bg-blue-600 text-white font-bold'
                                    : 'text-slate-400 hover:bg-slate-700'
                            }`}
                        >
                            {page}
                        </button>
                    ) : (
                        <span key={index} className="px-3 py-1 text-slate-500">
                            {page}
                        </span>
                    )
                )}

                <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-md text-slate-400 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    aria-label="Next page"
                >
                    <ChevronRightIcon />
                </button>
            </div>
        </div>
    );
};
