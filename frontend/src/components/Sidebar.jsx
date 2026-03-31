import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ collapsed }) => {
  const location = useLocation();
  const { logout, isAdmin } = useAuth();

  const menuItems = [
    { path: '/', icon: 'ti-home', label: 'Dashboard' },
    { path: '/pos', icon: 'ti-shopping-cart', label: 'POS' },
    { path: '/items', icon: 'ti-box', label: 'Items', adminOnly: true },
    { path: '/categories', icon: 'ti-tags', label: 'Categories', adminOnly: true },
    { path: '/stock', icon: 'ti-archive', label: 'Stock', adminOnly: true },
    { path: '/sales', icon: 'ti-receipt', label: 'Sales' },
    { path: '/reports', icon: 'ti-chart-bar', label: 'Reports' },
    ...(isAdmin() ? [{ path: '/users', icon: 'ti-users', label: 'Users' }] : []),
  ];

  const filteredMenu = menuItems.filter(item => !item.adminOnly || isAdmin());

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="logo-area">
        <div className="logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="4" fill="#E66239"/>
            <text x="12" y="17" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">PP</text>
          </svg>
        </div>
        <span className="logo-text">
          <svg height="18" viewBox="0 0 100 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <text x="0" y="18" fill="#262626" fontSize="14" fontWeight="bold" fontFamily="Poppins, sans-serif">Pawin PyPOS</text>
          </svg>
        </span>
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
