import { useState, useEffect, useCallback } from 'react';
import { auditAPI, poll } from '../services/api';
import toast from 'react-hot-toast';

const TYPE_META = {
  sale: { label: 'Sales', icon: 'ti-receipt', badge: 'bg-success-subtle text-success' },
  debt: { label: 'Debts', icon: 'ti-wallet', badge: 'bg-warning-subtle text-warning' },
  stock: { label: 'Stock Movements', icon: 'ti-archive', badge: 'bg-info-subtle text-info' },
  inventory: { label: 'Inventory Changes', icon: 'ti-box', badge: 'bg-secondary-subtle text-secondary' },
  auth: { label: 'User Activity', icon: 'ti-user-check', badge: 'bg-primary-subtle text-primary' },
};

const ROLE_META = {
  master_admin: { label: 'Master Admin', badge: 'bg-dark-subtle text-dark' },
  admin: { label: 'Administrator', badge: 'bg-danger-subtle text-danger' },
  on_duty: { label: 'On Duty', badge: 'bg-info-subtle text-info' },
};

const SESSION_STATUS_META = {
  active: { label: 'Active', badge: 'bg-success-subtle text-success' },
  logged_out: { label: 'Logged out', badge: 'bg-secondary-subtle text-secondary' },
  expired: { label: 'Expired', badge: 'bg-warning-subtle text-warning' },
};

const DEVICE_ICON = {
  Mobile: 'ti-device-mobile',
  Tablet: 'ti-device-tablet',
  Desktop: 'ti-device-desktop',
};

const TECH_ICONS = {
  chrome: '/tech_icons/icons8-chrome-48.png',
  linux: '/tech_icons/icons8-linux-48.png',
  windows: '/tech_icons/icons8-windows-11-48.png',
};

const getBrowserBrand = (browser) => {
  if (!browser) return null;
  if (browser.includes('Chrome') || browser.includes('Chromium')) {
    return { src: TECH_ICONS.chrome };
  }
  const fallbacks = {
    Firefox: 'ti-brand-firefox',
    Safari: 'ti-brand-safari',
    'Microsoft Edge': 'ti-brand-edge',
    Opera: 'ti-brand-opera',
  };
  return { icon: fallbacks[browser] || 'ti-world' };
};

const getOsBrand = (os) => {
  if (!os) return null;
  const value = os.toLowerCase();
  if (value.startsWith('windows')) return { src: TECH_ICONS.windows };
  if (value.startsWith('linux')) return { src: TECH_ICONS.linux };
  if (value.startsWith('mac')) return { icon: 'ti-brand-apple' };
  if (value.startsWith('ios') || value.startsWith('ipados')) return { icon: 'ti-brand-apple' };
  if (value.startsWith('android')) return { icon: 'ti-brand-android' };
  if (value.startsWith('chromeos')) return { icon: 'ti-brand-chrome' };
  return { icon: 'ti-world' };
};

const TechBrandIcon = ({ brand, label }) => {
  if (!brand) return null;
  if (brand.src) {
    return (
      <img
        src={brand.src}
        alt={label}
        title={label}
        width="16"
        height="16"
        style={{ objectFit: 'contain' }}
      />
    );
  }
  return <i className={`ti ${brand.icon}`} title={label} style={{ fontSize: 16 }}></i>;
};

const AuditLog = () => {
  const [entries, setEntries] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionSummary, setSessionSummary] = useState({ total: 0, active: 0, devices: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showSessions, setShowSessions] = useState(false);

  const loadLogs = useCallback(async ({ refresh = false, silent = false } = {}) => {
    if (refresh) setRefreshing(true);
    else if (!silent) setLoading(true);
    try {
      const [data, sessionsData] = await Promise.all([
        auditAPI.getLogs(filter || undefined, 200),
        auditAPI.getSessions(100),
      ]);
      setEntries(data?.entries || []);
      setSessions(sessionsData?.sessions || []);
      setSessionSummary({
        total: sessionsData?.total || 0,
        active: sessionsData?.active || 0,
        devices: sessionsData?.devices || 0,
      });
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    loadLogs();
    const stopPolling = poll(() => loadLogs({ silent: true }), 15000);
    return stopPolling;
  }, [loadLogs]);

  const formatTime = (time) => {
    const date = new Date(time);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) +
      ', ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  const getActionLabel = (entry) => {
    const meta = {
      sale_created: 'Sale completed',
      debt_created: 'Debt recorded',
      stock_in: 'Stock added',
      stock_out: 'Stock removed',
      stock_adjustment: 'Stock adjusted',
      item_created: 'Item created',
      item_updated: 'Item updated',
      item_deleted: 'Item deleted',
      service_created: 'Service created',
      service_updated: 'Service updated',
      service_deleted: 'Service deleted',
      category_created: 'Category created',
      category_updated: 'Category updated',
      category_deleted: 'Category deleted',
      login: 'User logged in',
      logout: 'User logged out',
    };
    return meta[entry.action] || entry.action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const getTypeMeta = (type) => TYPE_META[type] || { label: type, icon: 'ti-list', badge: 'bg-secondary-subtle text-secondary' };

  const getStatusMeta = (status) => SESSION_STATUS_META[status] || { label: status, badge: 'bg-secondary-subtle text-secondary' };

  const timeAgo = (time) => {
    if (!time) return '—';
    const diff = Math.max(0, Date.now() - new Date(time).getTime());
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="row animate-fade-in">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h1 className="fs-3 fw-bold mb-1" style={{ color: 'var(--gray-900)' }}>Audit Log</h1>
            <p className="text-muted mb-0 small">Sales, debts, stock movements, inventory changes, user activity, login devices &amp; sessions</p>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => setShowSessions(true)}
            >
              <i className="ti ti-devices me-1"></i>
              Login Sessions
              <span className="badge bg-success-subtle text-success ms-2">
                {sessionSummary.active}
              </span>
            </button>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => loadLogs({ refresh: true })}
              disabled={refreshing}
            >
              {refreshing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1"></span>
                  Refreshing...
                </>
              ) : (
                <>
                  <i className="ti ti-refresh me-1"></i>
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="col-12 mb-4">
        <div className="d-flex gap-2 flex-wrap">
          <button
            className={`btn btn-sm ${filter === '' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setFilter('')}
          >
            All Activities
          </button>
          {Object.entries(TYPE_META).map(([key, meta]) => (
            <button
              key={key}
              className={`btn btn-sm ${filter === key ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setFilter(key)}
            >
              <i className={`ti ${meta.icon} me-1`}></i>
              {meta.label}
            </button>
          ))}
        </div>
      </div>

      <div className="col-12">
        <div className="card border-0 shadow-sm overflow-hidden">
          <div className="table-responsive">
            <table className="table mb-0 text-nowrap table-hover align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="px-4 py-3 text-uppercase small fw-bold text-muted border-0">Type</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold text-muted border-0">Action</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold text-muted border-0">Description</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold text-muted border-0">Amount</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold text-muted border-0">Role</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold text-muted border-0">User</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold text-muted border-0">Date &amp; Time</th>
                </tr>
              </thead>
              <tbody>
                {loading && entries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5">
                      <div className="spinner-border text-primary" role="status"></div>
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state py-5 text-center">
                        <i className="ti ti-list fs-1 text-muted opacity-25"></i>
                        <p className="mt-2 text-muted fw-medium">No activities found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => {
                    const meta = getTypeMeta(entry.type);
                    return (
                      <tr key={`${entry.type}-${entry.id}`}>
                        <td className="px-4 py-3">
                          <span className={`badge ${meta.badge} border-0 px-3 py-2 rounded-pill small`}>
                            <i className={`ti ${meta.icon} me-1`}></i>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 fw-medium">{getActionLabel(entry)}</td>
                        <td className="px-4 py-3 text-muted small">{entry.description}</td>
                        <td className="px-4 py-3 fw-semibold">
                          {entry.amount != null ? `TSH ${Number(entry.amount).toLocaleString()}` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {entry.role ? (
                            <span className={`badge ${ROLE_META[entry.role]?.badge || 'bg-light text-dark'} border-0 px-3 py-2 rounded-pill small`}>
                              {ROLE_META[entry.role]?.label || entry.role}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {entry.username ? (
                            <span className="fw-medium">{entry.username}</span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted small">{formatTime(entry.created_at)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showSessions && (
        <div className="modal-overlay" onClick={() => setShowSessions(false)}>
          <div
            className="modal"
            style={{ maxWidth: '1400px', width: '95vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header align-items-start">
              <div>
                <h3 className="modal-title">Login Devices &amp; Sessions</h3>
                <p className="text-muted small mb-0 mt-1">
                  Saved login history with device, browser, and network details
                </p>
              </div>
              <button className="modal-close" onClick={() => setShowSessions(false)}>
                <i className="ti ti-x"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="d-flex gap-2 flex-wrap mb-3">
                <span className="badge bg-success-subtle text-success border-0 px-3 py-2 rounded-pill">
                  <i className="ti ti-point-filled me-1"></i>
                  {sessionSummary.active} active
                </span>
                <span className="badge bg-primary-subtle text-primary border-0 px-3 py-2 rounded-pill">
                  <i className="ti ti-devices me-1"></i>
                  {sessionSummary.devices} devices
                </span>
                <span className="badge bg-secondary-subtle text-secondary border-0 px-3 py-2 rounded-pill">
                  <i className="ti ti-history me-1"></i>
                  {sessionSummary.total} sessions
                </span>
              </div>

              <div className="card border-0 shadow-sm overflow-hidden">
                <div className="table-responsive">
                  <table
                    className="table mb-0 table-hover align-middle"
                    style={{ tableLayout: 'fixed', minWidth: 980 }}
                  >
                    <colgroup>
                      <col style={{ width: '20%' }} />
                      <col style={{ width: '26%' }} />
                      <col style={{ width: '14%' }} />
                      <col style={{ width: '16%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '12%' }} />
                    </colgroup>
                    <thead className="bg-light">
                      <tr>
                        <th className="px-3 py-3 text-uppercase small fw-bold text-muted border-0">User</th>
                        <th className="px-3 py-3 text-uppercase small fw-bold text-muted border-0">Device</th>
                        <th className="px-3 py-3 text-uppercase small fw-bold text-muted border-0">IP Address</th>
                        <th className="px-3 py-3 text-uppercase small fw-bold text-muted border-0">Login</th>
                        <th className="px-3 py-3 text-uppercase small fw-bold text-muted border-0">Last Activity</th>
                        <th className="px-3 py-3 text-uppercase small fw-bold text-muted border-0">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading && sessions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-5">
                            <div className="spinner-border text-primary" role="status"></div>
                          </td>
                        </tr>
                      ) : sessions.length === 0 ? (
                        <tr>
                          <td colSpan={6}>
                            <div className="empty-state py-5 text-center">
                              <i className="ti ti-devices fs-1 text-muted opacity-25"></i>
                              <p className="mt-2 text-muted fw-medium">No login sessions yet</p>
                              <p className="text-muted small mb-0">Sessions are saved automatically when users log in.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        sessions.map((session) => {
                          const status = getStatusMeta(session.status);
                          const deviceIcon = DEVICE_ICON[session.device_type] || 'ti-device-desktop';
                          return (
                            <tr key={session.id}>
                              <td className="px-3 py-3">
                                <div className="fw-medium text-truncate" title={session.full_name || session.username || ''}>
                                  {session.full_name || session.username || '—'}
                                </div>
                                {session.username && (
                                  <small className="text-muted">@{session.username}</small>
                                )}
                              </td>
                              <td className="px-3 py-3">
                                <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
                                  <span className="badge bg-light text-dark border rounded-2 p-2 flex-shrink-0">
                                    <i className={`ti ${deviceIcon}`}></i>
                                  </span>
                                  <div style={{ minWidth: 0 }}>
                                    <div
                                      className="fw-medium small text-truncate"
                                      title={session.device_type || session.device || 'Unknown device'}
                                    >
                                      {session.device_type || session.device || 'Unknown device'}
                                    </div>
                                    <div className="d-flex align-items-center gap-2 mt-1">
                                      <TechBrandIcon
                                        brand={getBrowserBrand(session.browser)}
                                        label={session.browser || 'Browser'}
                                      />
                                      <TechBrandIcon
                                        brand={getOsBrand(session.os)}
                                        label={session.os || 'Operating system'}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-muted small text-truncate" title={session.ip_address || ''}>
                                {session.ip_address || '—'}
                              </td>
                              <td className="px-3 py-3 text-muted small" title={formatTime(session.login_at)}>{formatTime(session.login_at)}</td>
                              <td className="px-3 py-3 text-muted small" title={formatTime(session.last_seen_at)}>
                                {timeAgo(session.last_seen_at)}
                              </td>
                              <td className="px-3 py-3">
                                <span className={`badge ${status.badge} border-0 px-3 py-2 rounded-pill small`}>
                                  {status.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline-secondary" onClick={() => setShowSessions(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLog;