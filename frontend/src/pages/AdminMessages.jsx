import { useState, useEffect } from 'react';
import { notificationsAPI, usersAPI } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AdminMessages = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetUser, setTargetUser] = useState('all');
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('chat');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, messagesData] = await Promise.all([
        usersAPI.getAll(),
        notificationsAPI.getAll()
      ]);
      setUsers(usersData || []);
      setHistory(messagesData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message || !title) return toast.error('Please fill all fields');

    try {
      setSending(true);
      if (targetUser === 'all') {
        // Broadcast to all staff users
        const staffUsers = users.filter(u => u.id !== currentUser.id);
        const promises = staffUsers.map(u => 
          notificationsAPI.send({
            user_id: u.id,
            sender_id: currentUser.id,
            title,
            message,
            type
          })
        );
        await Promise.all(promises);
        toast.success(`Broadcasted to ${staffUsers.length} users`);
      } else {
        await notificationsAPI.send({
          user_id: targetUser,
          sender_id: currentUser.id,
          title,
          message,
          type
        });
        toast.success('Message sent successfully');
      }
      setMessage('');
      setTitle('');
      loadData();
    } catch (error) {
      console.error('Send error:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading users...</div>;

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fs-4 fw-bold mb-1">Admin Messaging</h1>
          <p className="text-muted small mb-0">Send notices or chat messages to staff</p>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card h-100">
            <div className="card-header fw-bold">New Message</div>
            <div className="card-body">
              <form onSubmit={handleSend}>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Recipient</label>
                  <select 
                    className="form-select shadow-none" 
                    value={targetUser}
                    onChange={(e) => setTargetUser(e.target.value)}
                  >
                    <option value="all">All Staff (Broadcast)</option>
                    {users.filter(u => u.id !== currentUser.id).map(user => (
                      <option key={user.id} value={user.id}>
                        {user.full_name || user.username} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Message Type</label>
                  <div className="d-flex gap-2">
                    <button 
                      type="button"
                      className={`btn btn-sm flex-grow-1 ${type === 'chat' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setType('chat')}
                    >
                      <i className="ti ti-message me-1"></i> Chat
                    </button>
                    <button 
                      type="button"
                      className={`btn btn-sm flex-grow-1 ${type === 'info' ? 'btn-info text-white' : 'btn-outline-info'}`}
                      onClick={() => setType('info')}
                    >
                      <i className="ti ti-info-circle me-1"></i> Info
                    </button>
                    <button 
                      type="button"
                      className={`btn btn-sm flex-grow-1 ${type === 'warning' ? 'btn-warning text-white' : 'btn-outline-warning'}`}
                      onClick={() => setType('warning')}
                    >
                      <i className="ti ti-alert-triangle me-1"></i> Warning
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Title</label>
                  <input 
                    type="text" 
                    className="form-control shadow-none" 
                    placeholder="Subject..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Message Content</label>
                  <textarea 
                    className="form-control shadow-none" 
                    rows="4" 
                    placeholder="Type your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-100" 
                  disabled={sending}
                >
                  {sending ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="ti ti-send me-1"></i> Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span className="fw-bold">Message History</span>
              <button className="btn btn-sm btn-outline-secondary" onClick={loadData}>
                <i className="ti ti-refresh"></i>
              </button>
            </div>
            <div className="card-body p-0 overflow-auto" style={{ maxHeight: '500px' }}>
              {history.length === 0 ? (
                <div className="p-4 text-center text-muted italic">No message history</div>
              ) : (
                <div className="list-group list-group-flush">
                  {history.map(msg => (
                    <div key={msg.id} className="list-group-item p-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="badge bg-light text-dark border">{msg.type}</span>
                        <small className="text-muted">{new Date(msg.created_at).toLocaleString()}</small>
                      </div>
                      <h6 className="mb-1 fw-bold">{msg.title}</h6>
                      <p className="mb-1 text-secondary small">{msg.message}</p>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          To: {users.find(u => u.id === msg.user_id)?.full_name || 'Unknown'}
                        </small>
                        {msg.is_read ? (
                          <small className="text-success"><i className="ti ti-checks"></i> Read</small>
                        ) : (
                          <small className="text-muted"><i className="ti ti-check"></i> Unread</small>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;
