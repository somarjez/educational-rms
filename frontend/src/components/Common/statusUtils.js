// statusUtils.js - Utility functions for status mapping
export function getPriorityColor(priority) {
  switch(priority) {
    case 'LOW': return '#10b981';
    case 'MEDIUM': return '#f59e0b';
    case 'HIGH': return '#ef4444';
    case 'URGENT': return '#8b0000';
    default: return '#6b7280';
  }
}

export function getStatusBadgeClass(status) {
  switch(status) {
    case 'APPROVED': return 'status-approved';
    case 'PENDING': return 'status-pending';
    case 'REJECTED': return 'status-rejected';
    case 'CANCELLED': return 'status-cancelled';
    default: return 'status-default';
  }
}
