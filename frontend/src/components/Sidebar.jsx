import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ alertCount = 0 }) => {
  const location = useLocation();
  const { logout, isAdmin, user } = useAuth();

  const isUserAdmin = isAdmin();

  const sections = [
    {
      title: null,
      items: [
        { path: isUserAdmin ? '/admin' : '/', icon: 'ti-smart-home', label: 'Dashboard' },
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
        ...(isUserAdmin ? [{ path: '/users', icon: 'ti-users', label: 'Users' }] : []),
        ...(isUserAdmin ? [{ path: '/audit', icon: 'ti-clipboard-list', label: 'Audit Log' }] : []),
        { path: '/account', icon: 'ti-user-circle', label: 'Account' },
      ]
    }
  ];

  const needsAttention = (item) => {
    if (!item.alertPath) return false;
    return (item.alertPath === '/stock' || item.alertPath === '/items') && alertCount > 0;
  };

  const asideStyle = {
    width: 240,
    background: '#fff',
    borderRight: '1px solid #e5e7eb',
    height: '100vh',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 1030,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  };

  const logoStyle = {
    height: 60,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0 14px',
    borderBottom: '1px solid #e5e7eb',
    flexShrink: 0
  };

  const navStyle = {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '8px 0'
  };

  const sectionStyle = {
    marginBottom: 10
  };

  const titleStyle = {
    padding: '10px 16px 4px',
    fontSize: '0.65rem',
    textTransform: 'uppercase',
    color: '#6b7280',
    fontWeight: 700,
    letterSpacing: '0.1em',
    whiteSpace: 'nowrap'
  };

  const linkStyle = (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 10px',
    margin: '2px 12px',
    borderRadius: 8,
    fontSize: '0.875rem',
    fontWeight: 400,
    color: active ? '#e66239' : '#1f2937',
    background: active ? 'rgba(230, 98, 57, 0.095)' : 'transparent',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
    cursor: 'pointer'
  });

  const footerStyle = {
    flexShrink: 0,
    borderTop: '1px solid #e5e7eb',
    background: '#fff',
    padding: '6px 0'
  };

  return (
    <aside style={asideStyle}>
      <div style={logoStyle}>
        <img
          src={`${import.meta.env.BASE_URL}logo1.png`}
          alt="Pawin PyPOS"
          style={{ width: 32, height: 32, objectFit: 'contain' }}
        />
        <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>Pawin PyPOS</span>
      </div>

      <nav style={navStyle}>
        {sections.map((section, idx) => {
          const visibleItems = section.items.filter(item => !item.adminOnly || isAdmin());
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} style={sectionStyle}>
              {section.title && (
                <div style={titleStyle}>{section.title}</div>
              )}
              {visibleItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <div key={item.path}>
                    <Link
                      to={item.path}
                      style={linkStyle(active)}
                      onMouseEnter={(e) => {
                        if (!active) e.currentTarget.style.background = 'rgba(230, 98, 57, 0.095)';
                      }}
                      onMouseLeave={(e) => {
                        if (!active) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <i className={`ti ${item.icon}`} style={{ fontSize: '1.1rem', flexShrink: 0 }}></i>
                      <span>{item.label}</span>
                      {needsAttention(item) && (
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e66239', marginLeft: 'auto' }}></span>
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div style={footerStyle}>
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            padding: '8px 22px',
            background: 'transparent',
            border: 'none',
            textAlign: 'left',
            color: '#1f2937',
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#e66239'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#1f2937'; }}
        >
          <i className="ti ti-logout" style={{ fontSize: '1.1rem' }}></i>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;