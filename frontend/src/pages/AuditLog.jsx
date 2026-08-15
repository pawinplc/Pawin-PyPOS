import { useState, useEffect, useCallback } from 'react';
import { auditAPI, poll } from '../services/api';
import toast from 'react-hot-toast';

const TYPE_META = {
  sale: { label: 'Sales', icon: 'ti-receipt', badge: 'bg-success-subtle text-success' },
  debt: { label: 'Debts', icon: 'ti-wallet', badge: 'bg-warning-subtle text-warning' },
  stock: { label: 'Stock Movements', icon: 'ti-archive', badge: 'bg-info-subtle text-info' },
  auth: { label: 'User Activity', icon: 'ti-user-check', badge: 'bg-primary-subtle text-primary' },
};

const AuditLog = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadLogs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await auditAPI.getLogs(filter || undefined, 200);
      setEntries(data?.entries || []);
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
    const stopPolling = poll(() => loadLogs(), 15000);
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
      login: 'User logged in',
      logout: 'User logged out',
    };
    return meta[entry.action] || entry.action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const getTypeMeta = (type) => TYPE_META[type] || { label: type, icon: 'ti-list', badge: 'bg-secondary-subtle text-secondary' };

  return (
    <div className="row animate-fade-in">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h1 className="fs-3 fw-bold mb-1" style={{ color: 'var(--gray-900)' }}>Audit Log</h1>
            <p className="text-muted mb-0 small">Sales, debts, stock movements, and user activity</p>
          </div>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => loadLogs(true)}
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
                  <th className="px-4 py-3 text-uppercase small fw-bold text-muted border-0">User</th>
                  <th className="px-4 py-3 text-uppercase small fw-bold text-muted border-0">Date &amp; Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(6)].map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="skeleton" style={{ width: 90, height: 14 }}></div>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
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
    </div>
  );
};

export default AuditLog;