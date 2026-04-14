import React, { useEffect, useState } from 'react';
import { authApi } from '../../services/authApi';
import '../styles/AdminUsersPage.css';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authApi.getUsers();
      const data = response?.results || response || [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggle = async (user) => {
    setSavingId(user.id);
    setError('');
    setMessage('');
    try {
      const updated = await authApi.toggleUserActive(user.id, !user.is_active);
      setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setMessage(`${updated.username} is now ${updated.is_active ? 'active' : 'inactive'}.`);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update user status.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="admin-users-page">
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p>Activate or deactivate user accounts and review roles.</p>
        </div>
        <button type="button" className="refresh-btn" onClick={loadUsers} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      {loading ? (
        <div className="loading-state">Loading users...</div>
      ) : (
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.role_display || user.role}</td>
                  <td>
                    <span className={`status-pill ${user.is_active ? 'active' : 'inactive'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`toggle-btn ${user.is_active ? 'deactivate' : 'activate'}`}
                      onClick={() => handleToggle(user)}
                      disabled={savingId === user.id}
                    >
                      {savingId === user.id
                        ? 'Saving...'
                        : user.is_active
                          ? 'Deactivate'
                          : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;