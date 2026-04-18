import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ collapsed, alertCount = 0, isMobile = false, mobileOpen = false }) => {
  const showMobile = isMobile && mobileOpen;
  const location = useLocation();
  const { logout, isAdmin } = useAuth();

  const menuItems = [
    ...(isAdmin() ? [{ path: '/admin', icon: 'ti-layout', label: 'Dashboard' }] : [{ path: '/', icon: 'ti-home', label: 'Dashboard' }]),
    { path: '/pos', icon: 'ti-shopping-cart', label: 'POS', alertPath: '/pos' },
    { path: '/analytics', icon: 'ti-chart-line', label: 'Analytics' },
    { path: '/services', icon: 'ti-printer', label: 'Services', adminOnly: true, adminViewOnly: true },
    { path: '/items', icon: 'ti-box', label: 'Items', adminOnly: true, adminViewOnly: true, alertPath: '/items' },
    { path: '/categories', icon: 'ti-tags', label: 'Categories', adminOnly: true, adminViewOnly: true },
    { path: '/stock', icon: 'ti-archive', label: 'Stock', adminOnly: true, adminViewOnly: true, alertPath: '/stock' },
    { path: '/sales', icon: 'ti-receipt', label: 'Sales' },
    { path: '/reports', icon: 'ti-chart-bar', label: 'Reports', adminOnly: true, adminExportOnly: true },
    ...(isAdmin() ? [{ path: '/users', icon: 'ti-users', label: 'Users' }] : []),
  ];

  const filteredMenu = menuItems.filter(item => !item.adminOnly || isAdmin());

  const needsAttention = (item) => {
    if (!item.alertPath) return false;
    return item.alertPath === '/' && alertCount > 0 ||
           item.alertPath === '/stock' && alertCount > 0 ||
           item.alertPath === '/items' && alertCount > 0;
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${showMobile ? 'mobile-show' : ''}`}>
      <div className="logo-area">
        <img 
          src={`${import.meta.env.BASE_URL}logo1.png`} 
          alt="Pawin PyPOS" 
          className="logo-img"
          style={{ width: 32, height: 32, objectFit: 'contain' }}
        />
        <span className="logo-text">Pawin PyPOS</span>
      </div>

      <nav className="nav">
        <li className="nav-section-label px-4 py-2 mt-2"><small className="nav-text">Main</small></li>
        {filteredMenu.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <i className={`ti ${item.icon}`}></i>
              <span className="nav-text">{item.label}</span>
              {needsAttention(item) && <span className="nav-dot"></span>}
            </Link>
          </li>
        ))}

        <li className="nav-section-label px-4 pt-4 pb-2"><small className="nav-text">Account</small></li>
        <li>
          <Link
            to="/account"
            className={`nav-link ${location.pathname === '/account' ? 'active' : ''}`}
          >
            <i className="ti ti-user"></i>
            <span className="nav-text">Account</span>
          </Link>
        </li>
        <li>
          <button className="logout-btn" onClick={logout}>
            <i className="ti ti-logout"></i>
            <span className="nav-text">Logout</span>
          </button>
        </li>
      </nav>
    </aside>
  );
};

export default Sidebar;
