import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
    currentPage = 1,
    totalItems = 0,
    pageSize = 10,
    onPageChange,
}) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const startRecord = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endRecord = Math.min(totalItems, currentPage * pageSize);

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

    // Generate page numbers to display with smart ellipsis for larger sets
    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };

    return (
        <div 
            style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                flexWrap: 'wrap', 
                gap: '1rem',
                padding: '0.85rem 1rem',
                borderTop: '1px solid var(--border-subtle)',
                background: '#FFFFFF',
                borderRadius: '0 0 var(--radius-md) var(--radius-md)'
            }}
        >
            {/* Record count summary */}
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Showing <strong style={{ color: 'var(--text-primary)' }}>{startRecord}</strong> to{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{endRecord}</strong> of{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{totalItems}</strong> records
                {totalPages > 1 && (
                    <span style={{ marginLeft: '6px', color: 'var(--text-secondary)' }}>
                        (Page {currentPage} of {totalPages})
                    </span>
                )}
            </div>

            {/* Navigation controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {/* Previous / Backward Button */}
                <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handlePrev}
                    disabled={currentPage <= 1}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.775rem',
                        opacity: currentPage <= 1 ? 0.45 : 1,
                        cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                        borderColor: 'var(--border-subtle)'
                    }}
                    title="Previous Page"
                >
                    <ChevronLeft size={15} />
                    <span>Previous</span>
                </button>

                {/* Page Number Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {getPageNumbers().map((p, idx) => {
                        if (p === '...') {
                            return (
                                <span 
                                    key={`ellipsis-${idx}`} 
                                    style={{ padding: '0 0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}
                                >
                                    &hellip;
                                </span>
                            );
                        }

                        const isActive = currentPage === p;
                        return (
                            <button
                                key={`page-${p}`}
                                type="button"
                                onClick={() => onPageChange(p)}
                                style={{
                                    minWidth: '32px',
                                    height: '32px',
                                    padding: '0 0.4rem',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.8rem',
                                    fontWeight: isActive ? 700 : 500,
                                    border: isActive ? '1px solid var(--teal)' : '1px solid var(--border-subtle)',
                                    background: isActive ? 'var(--teal)' : '#FFFFFF',
                                    color: isActive ? '#FFFFFF' : 'var(--text-primary)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                {p}
                            </button>
                        );
                    })}
                </div>

                {/* Next / Forward Button */}
                <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleNext}
                    disabled={currentPage >= totalPages}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.775rem',
                        opacity: currentPage >= totalPages ? 0.45 : 1,
                        cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                        borderColor: 'var(--border-subtle)'
                    }}
                    title="Next Page"
                >
                    <span>Next</span>
                    <ChevronRight size={15} />
                </button>
            </div>
        </div>
    );
}
