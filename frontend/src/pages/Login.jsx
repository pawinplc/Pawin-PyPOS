import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="card login-card" style={{ maxWidth: 420, width: '100%' }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <div className="mb-3 d-inline-block">
              <img 
                src={`${import.meta.env.BASE_URL}logo1.png`} 
                alt="Pawin PyPOS" 
                style={{ width: 60, height: 60, objectFit: 'contain' }}
              />
            </div>
            <h1 className="card-title mb-1" style={{ color: 'var(--text-primary)' }}>Pawin PyPOS</h1>
            <p className="text-muted small">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email address</label>
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label d-flex justify-content-between">
                <span style={{ color: 'var(--text-primary)' }}>Password</span>
                <a href="#" className="small link-primary text-decoration-none">Forgot Password?</a>
              </label>
              <input
                id="password"
                type="password"
                className="form-control"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="form-check">
                <input id="remember" className="form-check-input" type="checkbox" />
                <label className="form-check-label small" htmlFor="remember" style={{ color: 'var(--text-primary)' }}>Remember me</label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
