import { useState, useEffect } from 'react';
import { itemsAPI, salesAPI } from '../services/supabase';
import toast from 'react-hot-toast';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      const [items, sales] = await Promise.all([
        itemsAPI.getAll({}),
        salesAPI.getAll()
      ]);

      const notifs = [];

      // Low stock alerts
      const lowStockItems = (items || []).filter(item => item.quantity <= item.min_stock_level);
      lowStockItems.forEach(item => {
        notifs.push({
          id: `low-stock-${item.id}`,
          type: 'warning',
          icon: 'ti-alert-triangle',
          title: 'Low Stock Alert',
          message: `${item.name} (SKU: ${item.sku}) is running low. Current stock: ${item.quantity}, Min level: ${item.min_stock_level}`,
          time: new Date().toISOString(),
          read: false
        });
      });

      // Out of stock alerts
      const outOfStock = (items || []).filter(item => item.quantity === 0);
      outOfStock.forEach(item => {
        notifs.push({
          id: `out-stock-${item.id}`,
          type: 'danger',
          icon: 'ti-x',
          title: 'Out of Stock',
          message: `${item.name} (SKU: ${item.sku}) is out of stock!`,
          time: new Date().toISOString(),
          read: false
        });
      });

      // Recent sales alerts (large transactions)
      const largeSales = (sales || []).filter(s => parseFloat(s.final_amount) >= 50000);
      largeSales.slice(0, 5).forEach(sale => {
        notifs.push({
          id: `sale-${sale.id}`,
          type: 'success',
          icon: 'ti-shopping-cart',
          title: 'Large Transaction',
          message: `Receipt #${String(sale.id).padStart(5, '0')} - TSH ${parseFloat(sale.final_amount).toLocaleString()} completed`,
          time: sale.created_at,
          read: false
        });
      });

      // Today's summary
      const today = new Date().toISOString().split('T')[0];
      const todaySales = (sales || []).filter(s => s.created_at && s.created_at.startsWith(today));
      if (todaySales.length > 0) {
        const todayTotal = todaySales.reduce((sum, s) => sum + parseFloat(s.final_amount || 0), 0);
        notifs.push({
          id: 'today-summary',
          type: 'info',
          icon: 'ti-calendar',
          title: "Today's Summary",
          message: `${todaySales.length} transactions completed. Total: TSH ${todayTotal.toLocaleString()}`,
          time: new Date().toISOString(),
          read: false
        });
      }

      // System notifications
      notifs.push({
        id: 'welcome',
        type: 'info',
        icon: 'ti-info-circle',
        title: 'Welcome to Pawin PyPOS',
        message: 'Your stationery inventory system is ready. Start by adding products or processing sales.',
        time: new Date().toISOString(),
        read: false
      });

      // Sort by time (newest first)
      notifs.sort((a, b) => new Date(b.time) - new Date(a.time));
      
      setNotifications(notifs);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (id) => {
    setNotifications(notifs => 
      notifs.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(notifs => notifs.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const deleteNotification = (id) => {
    setNotifications(notifs => notifs.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
    toast.success('All notifications cleared');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (time) => {
    const date = new Date(time);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return date.toLocaleDateString();
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case 'warning':
        return { bg: 'rgba(240, 177, 0, 0.15)', border: 'rgba(240, 177, 0, 0.3)', icon: 'var(--warning)' };
      case 'danger':
        return { bg: 'rgba(251, 44, 54, 0.15)', border: 'rgba(251, 44, 54, 0.3)', icon: 'var(--danger)' };
      case 'success':
        return { bg: 'rgba(0, 201, 81, 0.15)', border: 'rgba(0, 201, 81, 0.3)', icon: 'var(--success)' };
      case 'info':
      default:
        return { bg: 'rgba(0, 184, 219, 0.15)', border: 'rgba(0, 184, 219, 0.3)', icon: 'var(--info)' };
    }
  };

  if (loading) {
    return <div className="page-loading">Loading notifications...</div>;
  }

  return (
    <div className="row">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="fs-3 mb-1">Notifications</h1>
            <p className="text-muted mb-0">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          <div className="d-flex gap-2">
            {unreadCount > 0 && (
              <button className="btn btn-outline-secondary btn-sm" onClick={markAllAsRead}>
                <i className="ti ti-check me-1"></i>
                Mark All Read
              </button>
            )}
            {notifications.length > 0 && (
              <button className="btn btn-outline-danger btn-sm" onClick={clearAll}>
                <i className="ti ti-trash me-1"></i>
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="col-12">
        <div className="card">
          <div className="card-body p-0">
            {notifications.length === 0 ? (
              <div className="text-center py-5">
                <i className="ti ti-bell-off fs-1 text-muted"></i>
                <p className="mt-3 text-muted">No notifications</p>
              </div>
            ) : (
              <div className="notification-list">
                {notifications.map((notif) => {
                  const styles = getTypeStyles(notif.type);
                  return (
                    <div 
                      key={notif.id}
                      className={`notification-item p-3 ${!notif.read ? 'unread' : ''}`}
                      style={{ 
                        borderBottom: '1px solid var(--border-color)',
                        background: notif.read ? 'transparent' : styles.bg
                      }}
                    >
                      <div className="d-flex gap-3">
                        <div 
                          className="notification-icon rounded-circle d-flex align-items-center justify-content-center"
                          style={{ 
                            width: 40, 
                            height: 40, 
                            background: styles.bg,
                            border: `1px solid ${styles.border}`
                          }}
                        >
                          <i className={`ti ${notif.icon}`} style={{ color: styles.icon }}></i>
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="mb-1" style={{ fontSize: '0.9rem' }}>{notif.title}</h6>
                              <p className="mb-1 text-muted small">{notif.message}</p>
                              <small className="text-muted">{formatTime(notif.time)}</small>
                            </div>
                            <div className="d-flex gap-1">
                              {!notif.read && (
                                <button 
                                  className="btn btn-sm btn-light"
                                  onClick={() => markAsRead(notif.id)}
                                  title="Mark as read"
                                >
                                  <i className="ti ti-check"></i>
                                </button>
                              )}
                              <button 
                                className="btn btn-sm btn-light"
                                onClick={() => deleteNotification(notif.id)}
                                title="Dismiss"
                              >
                                <i className="ti ti-x"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="col-12 mt-4">
        <div className="card">
          <div className="card-body">
            <h5 className="mb-3"><i className="ti ti-bulb me-2"></i>Quick Tips</h5>
            <ul className="text-muted small mb-0">
              <li className="mb-2">Low stock alerts appear when items fall below minimum level</li>
              <li className="mb-2">Out of stock items need immediate attention</li>
              <li className="mb-2">Large transactions (TSH 50,000+) are highlighted</li>
              <li>Click the bell icon anytime to view your alerts</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="col-12">
        <footer className="text-center py-3 mt-4">
          <p className="mb-0 small text-muted">Copyright © 2026 Pawin PyPOS Stationery Inventory System</p>
        </footer>
      </div>
    </div>
  );
};

export default Notifications;
