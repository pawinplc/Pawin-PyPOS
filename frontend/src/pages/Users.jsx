import { useState, useEffect } from 'react';
import { usersAPI } from '../services/supabase';
import toast from 'react-hot-toast';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '', password: '', full_name: '', role: 'staff'
  });

  useEffect(() => {
    loadUsers();
    
    const interval = setInterval(() => loadUsers(), 10000);
    
    return () => clearInterval(interval);
  }, []);

  const loadUsers = async () => {
    try {
      const data = await usersAPI.getAll();
      setUsers(data || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setFormData({ email: '', password: '', full_name: '', role: 'staff' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ email: '', password: '', full_name: '', role: 'staff' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      toast.error('Email is required');
      return;
    }

    try {
      setLoading(true);
      // For public.users, we generate a password hash if needed, but here we just store it
      // Note: In a real app, you'd use an Edge Function to create the auth user too
      await usersAPI.create({
        email: formData.email,
        username: formData.email.split('@')[0],
        password_hash: 'managed_via_console', // Placeholder for now
        full_name: formData.full_name,
        role: formData.role
      });

      toast.success('User added to management table');
      closeModal();
      loadUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await usersAPI.delete(id);
      toast.success('User removed');
      loadUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <div className="skeleton" style={{ width: 150, height: 28, marginBottom: 8 }}></div>
              <div className="skeleton" style={{ width: 200, height: 18 }}></div>
            </div>
            <div className="skeleton" style={{ width: 100, height: 36, borderRadius: 4 }}></div>
          </div>
        </div>
        <div className="col-12">
          <div className="card">
            <div className="table-responsive">
              <table className="table mb-0">
                <thead className="table-light">
                  <tr>
                    <th><div className="skeleton" style={{ width: 60, height: 14 }}></div></th>
                    <th><div className="skeleton" style={{ width: 150, height: 14 }}></div></th>
                    <th><div className="skeleton" style={{ width: 120, height: 14 }}></div></th>
                    <th><div className="skeleton" style={{ width: 80, height: 14 }}></div></th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(6)].map((_, i) => (
                    <tr key={i}>
                      <td><div className="skeleton" style={{ width: 40, height: 40, borderRadius: 20 }}></div></td>
                      <td><div className="skeleton" style={{ width: 150, height: 16 }}></div></td>
                      <td><div className="skeleton" style={{ width: 100, height: 16 }}></div></td>
                      <td><div className="skeleton" style={{ width: 60, height: 16 }}></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="row animate-fade-in">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="fs-3 fw-bold mb-1" style={{ color: 'var(--gray-900)' }}>Users</h1>
            <p className="text-muted mb-0 small">Manage system access and roles</p>
          </div>
          <div>
            <button className="btn btn-primary d-flex align-items-center gap-2 shadow-sm" onClick={openModal}>
              <i className="ti ti-plus fs-5"></i>
              Add New User
            </button>
          </div>
        </div>
      </div>

      <div className="col-12">
        <div className="card border-0 shadow-sm overflow-hidden">
          <div className="table-responsive">
            <table className="table mb-0 text-nowrap table-hover align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="px-4 py-3 text-uppercase small fw-bold text-muted border-0">User Profile</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold text-muted border-0">Email Address</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold text-muted border-0">Access Role</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold text-muted border-0">Status</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold text-muted border-0">Joined</th>
                  <th className="px-4 py-3 text-end border-0"></th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="px-4 py-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="avatar avatar-md avatar-primary" style={{ backgroundColor: 'rgba(230, 98, 57, 0.1)', color: 'var(--primary)' }}>
                          <span className="avatar-initials fw-bold">{getInitials(user.full_name)}</span>
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{user.full_name || 'System User'}</div>
                          <div className="text-muted x-small">ID: {user.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted small">{user.email}</td>
                    <td className="px-4 py-3">
                      {user.role === 'admin' ? (
                        <span className="badge bg-danger-subtle text-danger border-0 px-2 py-1 rounded-pill small">Administrator</span>
                      ) : (
                        <span className="badge bg-info-subtle text-info border-0 px-2 py-1 rounded-pill small">Staff Member</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="d-flex align-items-center gap-1 text-success small fw-medium">
                        <span className="nav-dot position-relative d-inline-block" style={{ top: 0, right: 0, transform: 'none' }}></span>
                        Active
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted small">{new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td className="px-4 py-3 text-end">
                      <button 
                        className="btn btn-sm btn-icon border-0 bg-light text-danger hover-up" 
                        onClick={() => handleDelete(user.id)}
                        title="Delete User"
                      >
                        <i className="ti ti-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="empty-state py-5 text-center">
                <i className="ti ti-users fs-1 text-muted opacity-25"></i>
                <p className="mt-2 text-muted fw-medium">No users found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add New User</h3>
              <button onClick={closeModal} className="modal-close">
                <i className="ti ti-x"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select
                    className="form-select"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Password *</label>
                  <input
                    type="password"
                    className="form-control"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="btn btn-outline-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
