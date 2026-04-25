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
    toast.error('User creation is restricted to the Cloud Dashboard for security.');
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
            <div className="skeleton" style={{ width: 250, height: 40 }}></div>
          </div>
        </div>
        <div className="col-12">
          <div className="card">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-3 border-bottom skeleton" style={{ height: 60 }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="row">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="fs-3 mb-1">User Management</h1>
            <p className="text-muted mb-0">View system users and their assigned roles</p>
          </div>
          <div>
            <button className="btn btn-primary" onClick={openModal}>
              <i className="ti ti-plus"></i>
              Add User
            </button>
          </div>
        </div>
      </div>

      <div className="col-12">
        <div className="card">
          <div className="table-responsive">
            <table className="table mb-0 text-nowrap table-hover">
              <thead className="table-light border-light">
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="align-middle">
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div className="avatar avatar-sm avatar-primary">
                          <span className="avatar-initials">{getInitials(user.full_name)}</span>
                        </div>
                        <span className="fw-medium">{user.full_name || '-'}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      {user.role === 'admin' ? (
                        <span className="badge bg-danger-subtle text-danger border border-danger">Admin</span>
                      ) : (
                        <span className="badge bg-info-subtle text-info border border-info">Staff</span>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-success-subtle text-success border border-success">Active</span>
                    </td>
                    <td className="small">{new Date(user.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="empty-state py-5 text-center">
                <i className="ti ti-users fs-1 text-muted"></i>
                <p className="mt-2 text-muted">No system users found</p>
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
            <div className="modal-body p-4 text-center">
              <i className="ti ti-shield-lock text-warning fs-1 mb-3"></i>
              <p>For security reasons, system users must be registered via the <strong>Cloud Management Console</strong>.</p>
              <p className="small text-muted">Direct user creation from the desktop app is currently disabled.</p>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={closeModal} className="btn btn-primary w-100">
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
