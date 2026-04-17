import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import authApi from '../../services/authApi';
import './ReportsPage.css';
import './UserManagementPage.css';

const normalizeRole = (role) => String(role || '').toUpperCase();

const UserManagementPage = () => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const sortedUsers = useMemo(() => {
    const copy = Array.isArray(users) ? [...users] : [];
    copy.sort((a, b) => (a?.email || '').localeCompare(b?.email || ''));
    return copy;
  }, [users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await authApi.adminListUsers();
      const list = Array.isArray(data) ? data : (data?.results || []);
      setUsers(list);
      setError('');
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSendReset = async (targetUser) => {
    setNotice('');
    setError('');

    if (!targetUser?.id) return;

    try {
      const result = await authApi.adminSendPasswordReset(targetUser.id);
      setNotice(result?.message || 'Password reset email sent.');
    } catch (err) {
      const apiMessage = err?.response?.data?.error;
      setError(apiMessage || 'Failed to send password reset email.');
    }
  };

  const role = normalizeRole(currentUser?.role);
  const isAdmin = role === 'ADMIN';

  if (!isAdmin) {
    return (
      <div className="reports-page">
        <h2 className="reports-title">User Management</h2>
        <p className="reports-subtitle">You do not have access to this page.</p>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <h2 className="reports-title">User Management</h2>
          <p className="reports-subtitle">View users and send password reset emails.</p>
        </div>
        <button className="um-refresh" onClick={fetchUsers} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {notice && <div className="reports-notice">{notice}</div>}
      {error && <div className="reports-notice um-error">{error}</div>}

      <div className="reports-table-wrapper">
        <table className="reports-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((u) => {
              return (
                <tr key={u.id}>
                  <td>{(u.first_name || u.last_name) ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : (u.username || '—')}</td>
                  <td>{u.email}</td>
                  <td className="um-role">{normalizeRole(u.role)}</td>
                  <td className="um-actions">
                    <button
                      className="um-btn secondary"
                      onClick={() => handleSendReset(u)}
                      disabled={loading}
                    >
                      Send Reset
                    </button>
                  </td>
                </tr>
              );
            })}
            {!loading && sortedUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="um-empty">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagementPage;
