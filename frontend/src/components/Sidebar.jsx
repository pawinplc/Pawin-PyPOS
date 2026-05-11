import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ collapsed, alertCount = 0, isMobile = false, mobileOpen = false }) => {
  const showMobile = isMobile && mobileOpen;
  const location = useLocation();
  const { logout, isAdmin, user } = useAuth();

  const sections = [
  const sections = [
    {
      title: null,
      items: [
        { path: isAdmin() ? '/admin' : '/', icon: 'ti-smart-home', label: 'Dashboard' },
        { path: '/pos', icon: 'ti-shopping-cart', label: 'POS', alertPath: '/pos' },
        { path: '/analytics', icon: 'ti-chart-line', label: 'Analytics' },
      ]
    },
    {
      title: 'Inventory',
      items: [
        { path: '/services', icon: 'ti-printer', label: 'Services', adminOnly: true },
        { path: '/items', icon: 'ti-box', label: 'Items', adminOnly: true, alertPath: '/items' },
        { path: '/categories', icon: 'ti-tags', label: 'Categories', adminOnly: true },
        { path: '/stock', icon: 'ti-archive', label: 'Stock', adminOnly: true, alertPath: '/stock' },
      ]
    },
    {
      title: 'Finance & Sales',
      items: [
        { path: '/sales', icon: 'ti-receipt', label: 'Sales' },
        { path: '/debts', icon: 'ti-wallet', label: 'Debt' },
        { path: '/reports', icon: 'ti-chart-bar', label: 'Reports', adminOnly: true },
      ]
    },
    {
      title: 'System',
      items: [
        ...(user?.role === 'admin' ? [{ path: '/users', icon: 'ti-users', label: 'Users' }] : []),
        { path: '/settings', icon: 'ti-settings', label: 'Settings', adminOnly: true },
        { path: '/account', icon: 'ti-user-circle', label: 'Account' },
      ]
    }
  ];

  const needsAttention = (item) => {
    if (!item.alertPath) return false;
    return (item.alertPath === '/stock' || item.alertPath === '/items') && alertCount > 0;
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${showMobile ? 'mobile-show' : ''}`}>
      <div className="logo-area border-bottom">
        <img 
          src={`${import.meta.env.BASE_URL}logo1.png`} 
          alt="Pawin PyPOS" 
          className="logo-img"
          style={{ width: 32, height: 32, objectFit: 'contain' }}
        />
        <span className="logo-text fw-bold ms-2">Pawin PyPOS</span>
      </div>

      <nav className="nav">
        {sections.map((section, idx) => {
          const visibleItems = section.items.filter(item => !item.adminOnly || isAdmin());
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="nav-section mb-3">
              {section.title && !collapsed && (
                <div className="nav-section-title px-4 py-2" style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--gray-500)', fontWeight: 700, letterSpacing: '0.1em' }}>
                  {section.title}
                </div>
              )}
              {visibleItems.map((item) => (
                <li key={item.path} style={{ listStyle: 'none' }}>
                  <Link
                    to={item.path}
                    className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                  >
                    <i className={`ti ${item.icon}`} style={{ fontSize: '1.1rem' }}></i>
                    <span className="nav-text">{item.label}</span>
                    {needsAttention(item) && <span className="nav-dot"></span>}
                  </Link>
                </li>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer border-top bg-white py-2">
        <li style={{ listStyle: 'none' }}>
          <button className="logout-btn nav-link w-100 border-0 bg-transparent text-start" onClick={logout}>
            <i className="ti ti-logout" style={{ fontSize: '1.1rem' }}></i>
            <span className="nav-text">Logout</span>
          </button>
        </li>
      </div>
    </aside>
  );
};

export default Sidebar;
