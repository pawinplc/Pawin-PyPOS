import { useState, useEffect, useRef } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { itemsAPI, salesAPI } from '../services/supabase';

const Layout = () => {
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    loadNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      setNotifLoading(true);
      const [items, sales] = await Promise.all([
        itemsAPI.getAll({}),
        salesAPI.getAll()
      ]);

      const notifs = [];

      const lowStockItems = (items || []).filter(item => item.quantity <= item.min_stock_level && item.quantity > 0);
      lowStockItems.slice(0, 3).forEach(item => {
        notifs.push({
          id: `low-stock-${item.id}`,
          type: 'warning',
          icon: 'ti-alert-triangle',
          title: 'Low Stock',
          message: `${item.name}: ${item.quantity} left`,
          time: new Date().toISOString()
        });
      });

      const outOfStock = (items || []).filter(item => item.quantity === 0);
      outOfStock.slice(0, 2).forEach(item => {
        notifs.push({
          id: `out-stock-${item.id}`,
          type: 'danger',
          icon: 'ti-x',
          title: 'Out of Stock',
          message: `${item.name} needs restocking`,
          time: new Date().toISOString()
        });
      });

      const today = new Date().toISOString().split('T')[0];
      const todaySales = (sales || []).filter(s => s.created_at && s.created_at.startsWith(today));
      if (todaySales.length > 0) {
        const todayTotal = todaySales.reduce((sum, s) => sum + parseFloat(s.final_amount || 0), 0);
        notifs.push({
          id: 'today-summary',
          type: 'info',
          icon: 'ti-calendar',
          title: "Today's Sales",
          message: `${todaySales.length} sales • TSH ${todayTotal.toLocaleString()}`,
          time: new Date().toISOString()
        });
      }

      setNotifications(notifs.slice(0, 5));
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setNotifLoading(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
  };

  const getInitials = () => {
    if (user?.full_name) {
      return user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const formatTime = (time) => {
    const date = new Date(time);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const getNotifStyle = (type) => {
    switch (type) {
      case 'warning': return { bg: 'rgba(240, 177, 0, 0.15)', icon: 'var(--warning)' };
      case 'danger': return { bg: 'rgba(251, 44, 54, 0.15)', icon: 'var(--danger)' };
      case 'success': return { bg: 'rgba(0, 201, 81, 0.15)', icon: 'var(--success)' };
      default: return { bg: 'rgba(0, 184, 219, 0.15)', icon: 'var(--info)' };
    }
  };

  return (
    <div className="app-layout">
      <div 
        id="overlay" 
        className={`overlay ${mobileMenuOpen ? 'show' : ''}`} 
        onClick={closeMobileMenu}
      ></div>
      
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      <nav className={`topbar ${sidebarCollapsed ? 'full' : ''}`}>
        <div className="d-flex align-items-center gap-2">
          <button className="toggle-btn d-lg-none" onClick={toggleMobileMenu}>
            <i className="ti ti-layout-sidebar-left-expand"></i>
          </button>

          <button className="toggle-btn d-none d-lg-flex" onClick={toggleSidebar}>
            <i className={`ti ${sidebarCollapsed ? 'ti-layout-sidebar-right-expand' : 'ti-layout-sidebar-left-expand'}`}></i>
          </button>
        </div>

        <ul className="list-unstyled d-flex align-items-center mb-0 gap-1">
          <li className="me-2">
            <button className="theme-toggle" onClick={toggleDarkMode} title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <i className="ti ti-sun theme-toggle-icon sun"></i>
              <i className="ti ti-moon theme-toggle-icon moon"></i>
            </button>
          </li>

          <li className="position-relative" ref={notifRef}>
            <button 
              className="btn-icon btn-sm btn-light btn rounded-circle"
              onClick={() => { setNotifDropdownOpen(!notifDropdownOpen); if (!notifDropdownOpen) loadNotifications(); }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" />
                <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
              </svg>
              {notifications.length > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '10px' }}>
                  {notifications.length}
                </span>
              )}
            </button>
            
            {notifDropdownOpen && (
              <div className="notif-dropdown" style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                background: 'var(--bg-white)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                boxShadow: '0 0.5rem 1rem rgba(0,0,0,0.1)',
                width: '320px',
                maxHeight: '400px',
                overflow: 'hidden',
                zIndex: 1000
              }}>
                <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Notifications</h6>
                  {notifications.length > 0 && (
                    <small className="text-muted">{notifications.length} new</small>
                  )}
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {notifLoading ? (
                    <div className="p-4 text-center text-muted">
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Loading...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted">
                      <i className="ti ti-bell-off fs-4"></i>
                      <p className="mt-2 mb-0 small">No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const style = getNotifStyle(notif.type);
                      return (
                        <div 
                          key={notif.id}
                          className="p-3 border-bottom"
                          style={{ borderColor: 'var(--border-color)', cursor: 'pointer' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-50)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div className="d-flex gap-2">
                            <div 
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: 32, height: 32, background: style.bg, flexShrink: 0 }}
                            >
                              <i className={`ti ${notif.icon}`} style={{ color: style.icon, fontSize: '14px' }}></i>
                            </div>
                            <div className="flex-grow-1 min-width-0">
                              <p className="mb-0 small fw-medium" style={{ fontSize: '13px' }}>{notif.title}</p>
                              <p className="mb-0 text-muted" style={{ fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {notif.message}
                              </p>
                              <small className="text-muted">{formatTime(notif.time)}</small>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-2 text-center border-top" style={{ borderColor: 'var(--border-color)' }}>
                    <Link 
                      to="/sales/today" 
                      className="small text-primary text-decoration-none"
                      onClick={() => setNotifDropdownOpen(false)}
                    >
                      View all sales <i className="ti ti-arrow-right ms-1"></i>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </li>

          <li className="ms-2 dropdown" ref={dropdownRef}>
            <a 
              href="#" 
              role="button" 
              onClick={(e) => { e.preventDefault(); setDropdownOpen(!dropdownOpen); }}
            >
              <div className="user-avatar-initials">{getInitials()}</div>
            </a>
            <div className={`dropdown-menu dropdown-menu-end p-0 ${dropdownOpen ? 'show' : ''}`} style={{ minWidth: 200 }}>
              <div>
                <div className="d-flex gap-3 align-items-center border-dashed border-bottom px-3 py-3">
                  <div className="user-avatar-initials" style={{ width: '2.5rem', height: '2.5rem' }}>{getInitials()}</div>
                  <div>
                    <h4 className="mb-0 small">{user?.full_name || user?.username || 'User'}</h4>
                    <p className="mb-0 small text-muted">@{user?.username || 'user'}</p>
                  </div>
                </div>
                <div className="p-3 d-flex flex-column gap-1 small lh-lg">
                  <Link to="/" className="text-decoration-none">
                    <i className="ti ti-home me-2"></i>
                    <span>Home</span>
                  </Link>
                  <Link to="/account" className="text-decoration-none">
                    <i className="ti ti-settings me-2"></i>
                    <span>Settings</span>
                  </Link>
                  <a href="#!" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                    <i className="ti ti-logout me-2"></i>
                    <span>Logout</span>
                  </a>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </nav>

      <main className={`content ${sidebarCollapsed ? 'full' : ''}`}>
        <div className="container-fluid">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
