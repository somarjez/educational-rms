export const getTypeClass = (type) => {
  return {
    success: 'modal-success',
    error: 'modal-error',
    warning: 'modal-warning',
    info: 'modal-info',
  }[type] || 'modal-info';
};

export const getIcon = (type) => {
  return {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  }[type];
};

export const stopPropagation = (e) => e.stopPropagation();
