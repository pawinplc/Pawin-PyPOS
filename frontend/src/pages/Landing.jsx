import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const Landing = () => {
    const { user } = useAuth();
    const [darkMode, setDarkMode] = useState(false);

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

    // If already logged in, skip the landing page
    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="landing-container">
            <header className="landing-header">
                <div className="landing-logo-pro">
                    <div className="logo-ring">
                        <img src="/logo1.png" alt="Pawin Logo" />
                    </div>
                    <div className="logo-text">
                        <span className="brand">Pawin</span>
                        <span className="suite">PyPOS Suite</span>
                    </div>
                </div>
                <nav className="landing-nav">
                    <button className="theme-toggle-btn me-3" onClick={toggleTheme} title="Toggle Theme">
                        <i className={`ti ${darkMode ? 'ti-sun' : 'ti-moon'}`}></i>
                    </button>
                    <Link to="/login" className="nav-btn">Login</Link>
                    <Link to="/login" className="nav-btn primary">Get Started</Link>
                </nav>
            </header>

            <main className="hero-section">
                <div className="hero-content fade-in-up">
                    <span className="hero-badge">Modern Point of Sale System</span>
                    <h1>Empower Your Stationery Business with <span>Pawin PyPOS</span></h1>
                    <p>
                        A comprehensive, fast, and secure inventory management and sales system 
                        designed for precision and ease of use.
                    </p>
                    <div className="hero-actions">
                        <Link to="/login" className="hero-btn primary">
                            Enter Dashboard <i className="ti ti-arrow-right"></i>
                        </Link>
                        <button className="hero-btn outline">
                            View Features
                        </button>
                    </div>
                </div>
                
                <div className="hero-visual">
                    <div className="glass-card main-preview">
                        <div className="mock-window-bar">
                            <span className="dot"></span>
                            <span className="dot"></span>
                            <span className="dot"></span>
                        </div>
                        <div className="mock-content mobile-app-mock">
                            <div className="mobile-header">
                                <div className="status-bar">
                                    <span>9:41</span>
                                    <div className="status-icons">
                                        <i className="ti ti-wifi"></i>
                                        <i className="ti ti-battery-4"></i>
                                    </div>
                                </div>
                                <div className="app-bar">
                                    <i className="ti ti-menu-2"></i>
                                    <span className="app-title">Dashboard</span>
                                    <i className="ti ti-bell"></i>
                                </div>
                            </div>
                            <div className="mobile-body">
                                <div className="mock-card-sm">
                                    <div className="line-long"></div>
                                    <div className="line-short"></div>
                                </div>
                                <div className="mock-list">
                                    <div className="mock-item">
                                        <div className="circle"></div>
                                        <div className="lines">
                                            <div className="l1"></div>
                                            <div className="l2"></div>
                                        </div>
                                    </div>
                                    <div className="mock-item">
                                        <div className="circle"></div>
                                        <div className="lines">
                                            <div className="l1"></div>
                                            <div className="l2"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mobile-nav">
                                <i className="ti ti-home"></i>
                                <i className="ti ti-shopping-cart"></i>
                                <div className="fab">
                                    <i className="ti ti-plus"></i>
                                </div>
                                <i className="ti ti-box"></i>
                                <i className="ti ti-user"></i>
                            </div>
                        </div>
                    </div>
                    <div className="floating-badge badge-1">
                        <i className="ti ti-check"></i> Real-time Sync
                    </div>
                    <div className="floating-badge badge-2">
                        <i className="ti ti-package"></i> Inventory Pro
                    </div>
                </div>
            </main>

            <section className="features-grid">
                <div className="feature-card">
                    <div className="feature-icon"><i className="ti ti-bolt"></i></div>
                    <h3>Lightning Fast</h3>
                    <p>Optimized for quick transaction processing and real-time inventory updates.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon"><i className="ti ti-shield-check"></i></div>
                    <h3>Secure & Reliable</h3>
                    <p>Enterprise-grade security for your business data and sales reports.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon"><i className="ti ti-device-desktop"></i></div>
                    <h3>Cross Platform</h3>
                    <p>Seamlessly switch between your desktop app and web browser dashboard.</p>
                </div>
            </section>

            <footer className="landing-footer">
                <p>&copy; 2026 Pawin PLC. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Landing;
