import React from 'react';

const PaginationToolbar = ({
  currentPage,
  totalPages,
  onPrev,
  onNext,
  className = '',
}) => {
  return (
    <div className={`timeline-toolbar ${className}`.trim()}>
      <span className="timeline-toolbar-info">
        Page {currentPage} of {totalPages}
      </span>
      <div className="timeline-toolbar-actions">
        <button
          className="btn-export"
          type="button"
          onClick={onPrev}
          disabled={currentPage <= 1}
        >
          Previous
        </button>
        <button
          className="btn-export"
          type="button"
          onClick={onNext}
          disabled={currentPage >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PaginationToolbar;
