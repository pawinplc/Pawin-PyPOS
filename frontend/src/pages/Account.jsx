import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Account = () => {
  const { user, updatePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(newPassword);
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row">
      <div className="col-12">
        <div className="mb-4">
          <h1 className="fs-3 mb-1">Account Settings</h1>
          <p className="mb-0 text-muted">Manage your account information and security.</p>
        </div>
      </div>

      <div className="col-lg-6">
        <div className="card">
          <div className="card-header bg-white">
            <h4 className="mb-0 h6">Profile Information</h4>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label text-muted small">Email Address</label>
              <p className="mb-0 fw-medium">{user?.email || 'N/A'}</p>
            </div>
            <div className="mb-3">
              <label className="form-label text-muted small">User ID</label>
              <p className="mb-0 fw-medium" style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                {user?.id || 'N/A'}
              </p>
            </div>
            <div className="mb-3">
              <label className="form-label text-muted small">Role</label>
              <p className="mb-0">
                <span className="badge bg-primary">Admin</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="col-lg-6">
        <div className="card">
          <div className="card-header bg-white">
            <h4 className="mb-0 h6">Change Password</h4>
          </div>
          <div className="card-body">
            <form onSubmit={handlePasswordChange}>
              <div className="mb-3">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="col-12 mt-4">
        <div className="card">
          <div className="card-header bg-white">
            <h4 className="mb-0 h6">About PyPOS</h4>
          </div>
          <div className="card-body">
            <p className="mb-1"><strong>Pawin PyPOS</strong> - University Stationery Inventory & POS System</p>
            <p className="mb-1 text-muted small">Version 1.0.0</p>
            <p className="mb-0 text-muted small">Built with React + Supabase</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
