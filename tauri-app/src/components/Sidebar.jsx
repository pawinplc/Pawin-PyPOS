import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ alertCount = 0, isMobile = false, mobileOpen = false }) => {
  const showMobile = isMobile && mobileOpen;
  const location = useLocation();
  const { logout, isAdmin } = useAuth();

  const menuItems = [
    ...(isAdmin()
      ? [{ path: '/admin', icon: 'ti-layout', label: 'Dashboard' }]
      : [{ path: '/', icon: 'ti-home', label: 'Dashboard' }]),
    { path: '/pos', icon: 'ti-shopping-cart', label: 'POS' },
    { path: '/analytics', icon: 'ti-chart-line', label: 'Analytics' },
    { path: '/services', icon: 'ti-printer', label: 'Services', adminOnly: true },
    { path: '/items', icon: 'ti-box', label: 'Items', adminOnly: true, alertPath: '/items' },
    { path: '/categories', icon: 'ti-tags', label: 'Categories', adminOnly: true },
    { path: '/stock', icon: 'ti-archive', label: 'Stock', adminOnly: true, alertPath: '/stock' },
    { path: '/sales', icon: 'ti-receipt', label: 'Sales' },
    { path: '/reports', icon: 'ti-chart-bar', label: 'Reports', adminOnly: true },
    ...(isAdmin() ? [{ path: '/users', icon: 'ti-users', label: 'Users' }] : []),
  ];

  const filteredMenu = menuItems.filter(item => !item.adminOnly || isAdmin());

  const needsAttention = (item) => {
    if (!item.alertPath) return false;
    return alertCount > 0;
  };

  return (
    <aside className={`sidebar-rail ${showMobile ? 'mobile-show' : ''}`}>
      {/* Logo */}
      <div className="rail-logo">
        <img
          src={`${import.meta.env.BASE_URL}logo1.png`}
          alt="Pawin PyPOS"
          className="rail-logo-img"
        />
        <span className="rail-logo-text">Pawin PyPOS</span>
      </div>

      {/* Main nav */}
      <nav className="rail-nav">
        <ul className="rail-nav-list">
          <li className="rail-section-label">
            <span className="rail-label-text">Main</span>
          </li>

          {filteredMenu.map((item) => {
            const active = location.pathname === item.path;
            return (
              <li key={item.path} className="rail-item">
                <Link
                  to={item.path}
                  className={`rail-link ${active ? 'active' : ''}`}
                  data-tooltip={item.label}
                >
                  <i className={`ti ${item.icon} rail-icon`}></i>
                  <span className="rail-text">{item.label}</span>
                  {needsAttention(item) && <span className="rail-dot"></span>}
                </Link>
              </li>
            );
          })}

          <li className="rail-section-label">
            <span className="rail-label-text">Account</span>
          </li>

          <li className="rail-item">
            <Link
              to="/guide"
              className={`rail-link ${location.pathname === '/guide' ? 'active' : ''}`}
              data-tooltip="User Guide"
            >
              <i className="ti ti-help rail-icon"></i>
              <span className="rail-text">User Guide</span>
            </Link>
          </li>

          <li className="rail-item">
            <Link
              to="/account"
              className={`rail-link ${location.pathname === '/account' ? 'active' : ''}`}
              data-tooltip="Account"
            >
              <i className="ti ti-user rail-icon"></i>
              <span className="rail-text">Account</span>
            </Link>
          </li>

          <li className="rail-item">
            <button
              className="rail-link rail-logout"
              onClick={logout}
              data-tooltip="Logout"
            >
              <i className="ti ti-logout rail-icon"></i>
              <span className="rail-text">Logout</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Footer */}
      <div className="rail-footer">
        <span className="rail-footer-version">v0.1.0</span>
        <span className="rail-footer-copy rail-text">© 2026 PawinPLC</span>
      </div>
    </aside>
  );
};

export default Sidebar;
