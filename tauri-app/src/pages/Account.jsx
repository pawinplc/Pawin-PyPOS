import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import supabase from '../services/supabase';
import toast from 'react-hot-toast';

const Account = () => {
  const { user, updatePassword, setUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileName = `avatar-${user.id}-${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('item-images')
        .upload(fileName, file);
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage
        .from('item-images')
        .getPublicUrl(fileName);
      
      const avatarUrl = urlData.publicUrl;
      
      // Update user context with new avatar
      setUser({ ...user, avatar_url: avatarUrl });
      
      toast.success('Profile picture updated!');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

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
            <div className="text-center mb-4">
              <div className="position-relative d-inline-block">
                {user?.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt="Profile"
                    className="rounded-circle"
                    style={{ width: 100, height: 100, objectFit: 'cover' }}
                  />
                ) : (
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center text-white"
                    style={{ width: 100, height: 100, background: 'var(--primary)', fontSize: '2rem' }}
                  >
                    {getInitials(user?.full_name || user?.username)}
                  </div>
                )}
                <button 
                  className="btn btn-sm btn-primary rounded-circle position-absolute"
                  style={{ bottom: 0, right: 0, width: 32, height: 32 }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    <i className="ti ti-camera"></i>
                  )}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="d-none"
                  onChange={handleAvatarUpload}
                />
              </div>
              <p className="mt-2 text-muted small">Click to change photo</p>
            </div>
            <div className="mb-3">
              <label className="form-label text-muted small">Full Name</label>
              <p className="mb-0 fw-medium">{user?.full_name || user?.username || 'N/A'}</p>
            </div>
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
            <p className="mb-1"><strong>Pawin PyPOS</strong> - Stationery Inventory & POS System</p>
            <p className="mb-1 text-muted small">Version 1.0.0</p>
            <p className="mb-0 text-muted small">Built with React + Supabase</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
