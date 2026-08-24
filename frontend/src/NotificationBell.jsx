import { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import api from './api.js';

function NotificationBell() {
    const { token } = useAuth();
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showList, setShowList] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

        const wrapperRef = useRef(null);

    // Closes the dropdown when clicking anywhere outside this component,
    // not just when re-clicking the bell.
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowList(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch notifications whenever this mounts. Also show a one-time toast
    // with the most recent notification's subject — sessionStorage ensures
    // it only appears once per browser session, not on every page navigation.
    useEffect(() => {
        if (!token) return;

        api.get('/notifications', { headers: { Authorization: `Bearer ${token}` } })
            .then((response) => {
                setNotifications(response.data);
                setUnreadCount(response.data.filter((n) => !n.is_read).length);

                if (!sessionStorage.getItem('notif_toast_shown') && response.data.length > 0) {
                    setToastMessage(response.data[0].subject);
                    sessionStorage.setItem('notif_toast_shown', '1');
                    setTimeout(() => setToastMessage(''), 3000);
                }
            })
            .catch(() => {});
    }, [token]);

    //mark a notification as read without navigation
    const handleMarkAsRead = (id, isRead) => {
        api.post(`/notifications/${id}/read`, {is_read: isRead}, {
            headers: { Authorization: `Bearer ${token}` },
        }).then(() => {
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: isRead } : n))
            );
            setUnreadCount((prev) => isRead ? Math.max(0, prev - 1) : prev + 1);
        });
    };

    // Mark as read, then navigate to the ticket it's about
    const handleNotificationClick = (notification) => {
        if (!notification.is_read) {
            handleMarkAsRead(notification.id, true);
        }
        setShowList(false);
        if (notification.link) navigate(notification.link);
    };

     return (
            <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button
                className="btn btn-secondary"
                onClick={() => setShowList((prev) => !prev)}
                style={{ position: 'relative', fontSize: '1rem' }}
            >
                🔔
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: '-6px', right: '-6px',
                        background: 'var(--danger)', color: 'white', borderRadius: '50%',
                        minWidth: '18px', height: '18px', display: 'inline-flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 700, padding: '0 4px',
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {showList && (
                <div className="card" style={{
                    position: 'absolute', right: 0, top: '2.75rem',
                    minWidth: '300px', maxHeight: '400px', overflowY: 'auto',
                    zIndex: 10, padding: 0,
                }}>
                    {notifications.length === 0 && (
                        <p className="empty-state" style={{ padding: '1rem' }}>No notifications</p>
                    )}
                    {notifications.map((n) => (
                        <div
                            key={n.id}
                            style={{
                                padding: '0.75rem 1rem',
                                borderBottom: '1px solid var(--border)',
                                background: n.is_read ? 'transparent' : 'var(--accent-soft)',
                                display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={n.is_read}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsRead(n.id, e.target.checked);
                                }}
                                style={{ marginTop: '0.25rem' }}
                            />
                            <div style={{ cursor: 'pointer' }} onClick={() => handleNotificationClick(n)}>
                                <strong style={{ fontSize: '0.9rem' }}>{n.subject}</strong>
                                <p className="text-secondary" style={{ margin: '0.2rem 0 0', fontSize: '0.82rem' }}>
                                    {n.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {toastMessage && (
                <div style={{
                    position: 'fixed', top: '1rem', right: '1rem',
                    background: 'var(--sidebar-bg)', color: 'var(--text-on-sidebar)',
                    padding: '0.75rem 1.1rem', borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow)', zIndex: 100, fontWeight: 600, fontSize: '0.9rem',
                }}>
                    🔔 {toastMessage}
                </div>
            )}
        </div>
    );
}

export default NotificationBell;