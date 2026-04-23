import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import TitleBar from '../components/TitleBar';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !darkMode ? 'dark' : 'light';
    setDarkMode(!darkMode);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

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
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TitleBar />
      <div className="login-container" style={{ marginTop: '32px' }}>
        <div className="card login-card" style={{ maxWidth: 420, width: '100%', position: 'relative' }}>
          <button 
            onClick={toggleTheme} 
            className="theme-toggle-btn" 
            style={{ position: 'absolute', top: '15px', right: '15px', width: '32px', height: '32px', fontSize: '1rem' }}
           title="Toggle Theme">
            <i className={`ti ${darkMode ? 'ti-sun' : 'ti-moon'}`}></i>
          </button>
          <div className="card-body p-5">
            <div className="text-center mb-4">
              <div className="mb-3 d-inline-block logo-ring">
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" style={{ color: 'var(--text-primary)' }} className="form-label">Password</label>
              <input
                id="password"
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="d-grid gap-2 mb-4">
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="text-center">
            <Link to="/" className="text-muted small text-decoration-none hover-primary">
              <i className="ti ti-arrow-left me-1"></i> Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
