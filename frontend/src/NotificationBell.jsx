import { useState, useEffect } from 'react';
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
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button onClick={() => setShowList((prev) => !prev)}>
                🔔
                {unreadCount > 0 && (
                    <span style={{
                        background: 'red', color: 'white', borderRadius: '50%',
                        padding: '2px 6px', fontSize: '0.75rem', marginLeft: '4px'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {showList && (
                <div style={{
                    position: 'absolute', right: 0, top: '2rem', background: 'white',
                    border: '1px solid #ccc', borderRadius: '8px', minWidth: '280px',
                    maxHeight: '400px', overflowY: 'auto', zIndex: 10,
                }}>
                    {notifications.length === 0 && <p style={{ padding: '1rem' }}>No notifications</p>}
                    {notifications.map((n) => (
                        <div
                            key={n.id}
                            style={{
                                padding: '0.75rem', borderBottom: '1px solid #eee',
                                background: n.is_read ? 'white' : '#f0f8ff',
                                display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
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
                                <strong>{n.subject}</strong>
                                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#555' }}>
                                    {n.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {toastMessage && (
                <div style={{
                    position: 'fixed', top: '1rem', right: '1rem', background: '#333',
                    color: 'white', padding: '0.75rem 1rem', borderRadius: '6px', zIndex: 100,
                }}>
                    {toastMessage}
                </div>
            )}
        </div>
    );
}

export default NotificationBell;